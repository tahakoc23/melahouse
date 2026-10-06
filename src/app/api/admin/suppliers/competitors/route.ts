import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { runResearch, type ResearchAttributes } from "@/lib/research/engine";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
// Kaynaklar paralel taranır; en yavaşı ~20 sn'de zaman aşımına düşer
export const maxDuration = 60;

const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const a = (body.attributes ?? {}) as Record<string, unknown>;
    const attributes: ResearchAttributes = {
      // Eski istemciler { query, fabric } gönderiyor; ikisini de destekle
      name: clean(a.name) || clean(body.name) || clean(body.query),
      category: clean(a.category),
      color: clean(a.color),
      fabric: clean(a.fabric) || clean(body.fabric),
      details: Array.isArray(a.details) ? a.details.filter((d): d is string => typeof d === 'string').slice(0, 12) : [],
    };
    const queryOverride = clean(body.searchQuery) || undefined;
    const supplierProductId = typeof body.supplier_product_id === 'string' ? body.supplier_product_id : null;

    if (!attributes.name && !attributes.category && !queryOverride) {
      return NextResponse.json({ error: "Araştırma için ürün adı ya da kategori gerekli." }, { status: 400 });
    }

    const cost = Number(body.costPrice);
    const result = await runResearch(attributes, queryOverride, Number.isFinite(cost) && cost > 0 ? cost : undefined);

    // Toptancı ürününden açıldıysa, fiyat hesabına giren ürünleri kaydet
    if (supplierProductId) {
      const included = result.items.filter(i => i.included);
      if (included.length > 0) {
        const adminClient = createAdminClient();
        const { error: delErr } = await adminClient
          .from("competitor_prices" as never)
          .delete()
          .eq("supplier_product_id", supplierProductId);
        if (!delErr) {
          const { error: insErr } = await adminClient.from("competitor_prices" as never).insert(
            included.map(item => ({
              supplier_product_id: supplierProductId,
              marketplace_name: item.store,
              product_title: item.title,
              product_url: item.url,
              price: item.price,
            })) as never,
          );
          if (insErr) console.error("Rakip fiyatları kaydedilemedi:", insErr);
        } else {
          console.error("Eski rakip fiyatları silinemedi:", delErr);
        }
      }
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error("POST admin competitor search error:", err);
    const message = err instanceof Error ? err.message : "Piyasa araştırması yapılamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
