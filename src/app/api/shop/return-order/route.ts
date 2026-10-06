// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Real order status values (see src/lib/constants.ts ORDER_STATUSES)
const RETURNABLE_STATUSES = ["teslim_edildi", "kargoya_verildi"];
const RETURN_REASON_MAX = 200;
const RETURN_EXPLANATION_MAX = 1000;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Oturum açmanız gerekmektedir." }, { status: 401 });
    }

    const { orderId, reason: rawReason, explanation: rawExplanation } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Sipariş ID gereklidir." }, { status: 400 });
    }

    const reason = typeof rawReason === "string" ? rawReason.trim() : "";
    const explanation = typeof rawExplanation === "string" ? rawExplanation.trim() : "";

    if (rawExplanation != null && typeof rawExplanation !== "string") {
      return NextResponse.json({ error: "Açıklama geçersiz." }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: "İade nedeni zorunludur." }, { status: 400 });
    }

    if (reason.length > RETURN_REASON_MAX) {
      return NextResponse.json({ error: `İade nedeni en fazla ${RETURN_REASON_MAX} karakter olabilir.` }, { status: 400 });
    }

    if (explanation.length > RETURN_EXPLANATION_MAX) {
      return NextResponse.json({ error: `Açıklama en fazla ${RETURN_EXPLANATION_MAX} karakter olabilir.` }, { status: 400 });
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

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz bulunmuyor." }, { status: 403 });
    }

    if (!RETURNABLE_STATUSES.includes(order.status)) {
      return NextResponse.json({ error: "Bu sipariş için iade talebi oluşturulamaz. Yalnızca kargoya verilmiş veya teslim edilmiş siparişler iade edilebilir." }, { status: 400 });
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
      .eq("id", orderId)
      .in("status", RETURNABLE_STATUSES);

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
