// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { scrapeCompetitorMarketplaces } from "@/lib/scraper/supplierScraper";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { query, fabric, supplier_product_id } = body;

    if (!query) {
      return NextResponse.json({ error: "Arama terimi (ürün adı) zorunludur." }, { status: 400 });
    }

    const analysis = await scrapeCompetitorMarketplaces(query, fabric);

    // If supplier_product_id is provided, save competitor prices to DB
    if (supplier_product_id && analysis.items.length > 0) {
      try {
        // Delete previous competitor items for this product
        await adminClient
          .from("competitor_prices")
          .delete()
          .eq("supplier_product_id", supplier_product_id);

        // Insert new competitor items
        const competitorRows = analysis.items.map(item => ({
          supplier_product_id,
          marketplace_name: item.marketplace_name,
          product_title: item.product_title,
          product_url: item.product_url,
          price: item.price
        }));

        await adminClient.from("competitor_prices").insert(competitorRows);
      } catch (dbErr) {
        console.error("Failed to persist competitor items:", dbErr);
      }
    }

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("POST admin competitor search error:", err);
    return NextResponse.json({ error: err.message || "Pazar yerleri aranamadı." }, { status: 500 });
  }
}
