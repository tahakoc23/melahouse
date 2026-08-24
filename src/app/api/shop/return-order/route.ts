// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Oturum açmanız gerekmektedir." }, { status: 401 });
    }

    const { orderId, reason, explanation } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Sipariş ID gereklidir." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify order belongs to user
    const { data: order, error: fetchErr } = await adminClient
      .from("orders")
      .select("id, user_id, notes, status")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    if (order.user_id !== session.user.id) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmuyor." }, { status: 403 });
    }

    const returnNote = `[İADE TALEBİ] Nedeni: ${reason}${explanation ? ` | Açıklama: ${explanation}` : ''}`;
    const updatedNotes = order.notes ? `${order.notes}\n${returnNote}` : returnNote;

    const { error: updateErr } = await adminClient
      .from("orders")
      .update({
        status: "iade_talebi",
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("Order return update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "İade talebiniz başarıyla alındı." });
  } catch (err: any) {
    console.error("Return order API error:", err);
    return NextResponse.json({ error: err.message || "İç sunucu hatası." }, { status: 500 });
  }
}
