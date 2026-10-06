// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const adminClient = createAdminClient();

    // Fetch return orders
    const { data: orders, error } = await adminClient
      .from("orders")
      .select("*, order_items(*, products(*, product_images(*))), profiles(full_name, email, phone)")
      .in("status", ["iade_talebi", "iade_edildi"])
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Fetch return orders error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (err: any) {
    console.error("GET admin returns error:", err);
    return NextResponse.json({ error: err.message || "İç sunucu hatası." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Sipariş ID gereklidir." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Only allow transition iade_talebi -> iade_edildi
    const { data: order, error: fetchErr } = await adminClient
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    if (order.status !== "iade_talebi") {
      return NextResponse.json({ error: "Yalnızca iade talebi bulunan siparişler onaylanabilir." }, { status: 400 });
    }

    const { data: updatedRows, error: updateErr } = await adminClient
      .from("orders")
      .update({
        status: "iade_edildi",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .eq("status", "iade_talebi")
      .select("id");

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: "Yalnızca iade talebi bulunan siparişler onaylanabilir." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "İade onaylandı ve tamamlandı." });
  } catch (err: any) {
    console.error("POST admin returns approve error:", err);
    return NextResponse.json({ error: err.message || "İç sunucu hatası." }, { status: 500 });
  }
}
