// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const adminClient = createAdminClient();

    const { data: changes, error } = await adminClient
      .from("supplier_changes")
      .select("*, supplier_products(title, product_url, image_url, suppliers(name))")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ changes: changes || [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (err: any) {
    console.error("GET admin supplier changes error:", err);
    return NextResponse.json({ error: err.message || "Değişiklik günlüğü alınamadı." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { change_id, mark_all_read = false } = body;

    if (mark_all_read) {
      const { error } = await adminClient
        .from("supplier_changes")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Tüm bildirimler okundu olarak işaretlendi." });
    }

    if (change_id) {
      const { error } = await adminClient
        .from("supplier_changes")
        .update({ is_read: true })
        .eq("id", change_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "change_id veya mark_all_read parametresi gereklidir." }, { status: 400 });
  } catch (err: any) {
    console.error("PUT admin supplier changes error:", err);
    return NextResponse.json({ error: err.message || "Bildirim güncellenemedi." }, { status: 500 });
  }
}
