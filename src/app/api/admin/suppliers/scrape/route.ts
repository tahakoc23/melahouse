// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { scrapeSupplierProduct } from "@/lib/scraper/supplierScraper";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { action = 'scrape_preview' } = body;

    // 1. Live Preview Scraping (Before Saving)
    if (action === 'scrape_preview') {
      const { product_url } = body;
      if (!product_url) {
        return NextResponse.json({ error: "Ürün linki (URL) zorunludur." }, { status: 400 });
      }

      const scrapedData = await scrapeSupplierProduct(product_url);
      return NextResponse.json({ data: scrapedData });
    }

    // 2. Save Supplier Product to Database
    if (action === 'save_product') {
      const { 
        supplier_id, 
        supplier_name,
        admin_product_id, 
        title, 
        product_url, 
        sku, 
        price, 
        stock_status, 
        color, 
        fabric, 
        sizes,
        description, 
        image_url, 
        raw_metadata 
      } = body;

      if (!title || !product_url) {
        return NextResponse.json({ error: "Ürün adı ve linki zorunludur." }, { status: 400 });
      }

      // Automatically create or assign supplier by name if supplier_id not set
      let finalSupplierId = supplier_id || null;
      if (!finalSupplierId && supplier_name && supplier_name.trim()) {
        const sName = supplier_name.trim();
        const domain = product_url ? product_url.replace(/https?:\/\//, '').split('/')[0] : '';

        const { data: existingSup } = await adminClient
          .from("suppliers")
          .select("id")
          .ilike("name", sName)
          .maybeSingle();

        if (existingSup) {
          finalSupplierId = existingSup.id;
        } else {
          const { data: newSup } = await adminClient
            .from("suppliers")
            .insert({
              name: sName,
              domain: domain || 'Toptancı',
              website_url: product_url ? `https://${domain}` : ''
            })
            .select("id")
            .single();

          if (newSup) {
            finalSupplierId = newSup.id;
          }
        }
      }

      // Store sizes inside raw_metadata or fabric/description if schema requires
      const updatedMetadata = {
        ...(raw_metadata || {}),
        sizes: sizes || 'Standart'
      };

      // Check if product_url already exists
      const { data: existing } = await adminClient
        .from("supplier_products")
        .select("id")
        .eq("product_url", product_url)
        .maybeSingle();

      let savedProduct;
      if (existing) {
        const { data: updated, error: uErr } = await adminClient
          .from("supplier_products")
          .update({
            supplier_id: finalSupplierId,
            admin_product_id: admin_product_id || null,
            title,
            sku,
            price: Number(price || 0),
            stock_status: stock_status || 'stokta_var',
            color: color || 'Standart',
            fabric: fabric || 'Belirtilmemiş',
            description,
            image_url,
            raw_metadata: updatedMetadata,
            last_scraped_at: new Date().toISOString()
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (uErr) throw uErr;
        savedProduct = updated;
      } else {
        const { data: inserted, error: iErr } = await adminClient
          .from("supplier_products")
          .insert({
            supplier_id: finalSupplierId,
            admin_product_id: admin_product_id || null,
            title,
            product_url,
            sku,
            price: Number(price || 0),
            stock_status: stock_status || 'stokta_var',
            color: color || 'Standart',
            fabric: fabric || 'Belirtilmemiş',
            description,
            image_url,
            raw_metadata: updatedMetadata,
            last_scraped_at: new Date().toISOString()
          })
          .select()
          .single();

        if (iErr) throw iErr;
        savedProduct = inserted;
      }

      return NextResponse.json({ supplierProduct: savedProduct });
    }

    // 3. Live Batch Refresh & Change Detection Engine
    if (action === 'refresh_all') {
      const { data: products } = await adminClient
        .from("supplier_products")
        .select("*");

      if (!products || products.length === 0) {
        return NextResponse.json({ updatedCount: 0, changesCount: 0 });
      }

      let changesDetectedCount = 0;
      const results = [];

      for (const p of products) {
        try {
          const fresh = await scrapeSupplierProduct(p.product_url);

          const oldPrice = Number(p.price || 0);
          const newPrice = Number(fresh.price || 0);
          const oldStock = p.stock_status || 'stokta_var';
          const newStock = fresh.stock_status || 'stokta_var';

          // Detect Price Change
          if (newPrice > 0 && Math.abs(oldPrice - newPrice) > 0.01) {
            await adminClient.from("supplier_changes").insert({
              supplier_product_id: p.id,
              field_changed: 'price',
              old_value: `${oldPrice.toLocaleString('tr-TR')} ₺`,
              new_value: `${newPrice.toLocaleString('tr-TR')} ₺`,
              is_read: false
            });
            changesDetectedCount++;
          }

          // Detect Stock Status Change
          if (oldStock !== newStock) {
            await adminClient.from("supplier_changes").insert({
              supplier_product_id: p.id,
              field_changed: 'stock_status',
              old_value: oldStock === 'stokta_var' ? 'Stokta Var' : 'Stokta Yok (Tükendi)',
              new_value: newStock === 'stokta_var' ? 'Stokta Var' : 'Stokta Yok (Tükendi)',
              is_read: false
            });
            changesDetectedCount++;
          }

          // Update Product Row in DB
          await adminClient
            .from("supplier_products")
            .update({
              price: newPrice > 0 ? newPrice : oldPrice,
              stock_status: newStock,
              title: fresh.title || p.title,
              color: fresh.color !== 'Standart' ? fresh.color : p.color,
              fabric: fresh.fabric !== 'Belirtilmemiş' ? fresh.fabric : p.fabric,
              description: fresh.description || p.description,
              image_url: fresh.image_url || p.image_url,
              raw_metadata: {
                ...(p.raw_metadata || {}),
                sizes: fresh.sizes || 'Standart'
              },
              last_scraped_at: new Date().toISOString()
            })
            .eq("id", p.id);

          results.push({ id: p.id, title: p.title, status: 'success' });
        } catch (sErr: any) {
          console.error(`Scrape failed for product ID ${p.id}:`, sErr);
          results.push({ id: p.id, title: p.title, status: 'failed', error: sErr.message });
        }
      }

      return NextResponse.json({ 
        updatedCount: products.length, 
        changesCount: changesDetectedCount,
        results
      });
    }

    return NextResponse.json({ error: "Geçersiz işlem tipi." }, { status: 400 });
  } catch (err: any) {
    console.error("POST admin scrape error:", err);
    return NextResponse.json({ error: err.message || "Taramada hata oluştu." }, { status: 500 });
  }
}
