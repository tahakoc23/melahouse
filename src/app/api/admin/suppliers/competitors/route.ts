import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { researchMarketPrices } from "@/lib/scraper/marketResearch";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
// Kaynaklar paralel taranır; en yavaşı ~20 sn'de zaman aşımına düşer
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 200) : '';
    const fabric = typeof body.fabric === 'string' ? body.fabric.trim().slice(0, 200) : '';
    const supplierProductId = typeof body.supplier_product_id === 'string' ? body.supplier_product_id : null;

    if (!query) {
      return NextResponse.json({ error: "Arama terimi (ürün adı) zorunludur." }, { status: 400 });
    }

    const analysis = await researchMarketPrices(query, fabric);

    // Toptancı ürününden açıldıysa son araştırmayı kaydet
    if (supplierProductId && analysis.items.length > 0) {
      const adminClient = createAdminClient();
      const { error: delErr } = await adminClient
        .from("competitor_prices" as never)
        .delete()
        .eq("supplier_product_id", supplierProductId);
      const { error: insErr } = delErr
        ? { error: delErr }
        : await adminClient.from("competitor_prices" as never).insert(
            analysis.items.map(item => ({
              supplier_product_id: supplierProductId,
              marketplace_name: item.marketplace_name,
              product_title: item.product_title,
              product_url: item.product_url,
              price: item.price,
            })) as never,
          );
      if (insErr) console.error("Rakip fiyatları kaydedilemedi:", insErr);
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("POST admin competitor search error:", err);
    const message = err instanceof Error ? err.message : "Piyasa araştırması yapılamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
