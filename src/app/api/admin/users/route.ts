// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Call SECURITY DEFINER RPC function get_all_users_with_details()
    const { data: rawUsers, error: rpcErr } = await adminClient.rpc("get_all_users_with_details");

    if (rpcErr) {
      console.error("RPC get_all_users_with_details error:", rpcErr);
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    const profiles = rawUsers || [];

    // Enrich each user with totals and phone fallback from addresses
    const enrichedUsers = profiles.map((user: any) => {
      const userAddresses = user.addresses || [];
      const userOrders = user.orders || [];
      
      const phoneFallback = user.phone || userAddresses.find((a: any) => a.phone)?.phone || '-';
      const validOrders = userOrders.filter((o: any) => !['iptal_edildi', 'iade_edildi'].includes(o.status));
      const totalSpent = validOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

      return {
        ...user,
        phone: phoneFallback,
        addresses: userAddresses,
        orders: userOrders,
        totalOrdersCount: userOrders.length,
        totalSpentAmount: totalSpent
      };
    });

    return NextResponse.json({ users: enrichedUsers }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (err: any) {
    console.error("GET admin users error:", err);
    return NextResponse.json({ error: err.message || "İç sunucu hatası." }, { status: 500 });
  }
}

// PATCH - Edit User (email, password, full_name, role)
export async function PATCH(request: Request) {
  try {
    const adminClient = createAdminClient();
    const { userId, email, password, full_name, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID zorunludur." }, { status: 400 });
    }

    // Call SECURITY DEFINER RPC admin_update_user
    const { data, error } = await adminClient.rpc("admin_update_user", {
      target_user_id: userId,
      new_email: email || null,
      new_password: password || null,
      new_full_name: full_name || null,
      new_role: role || null
    });

    if (error || (data && data.success === false)) {
      const errMsg = error?.message || data?.error || "Kullanıcı güncellenemedi.";
      console.error("admin_update_user error:", errMsg);
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Kullanıcı başarıyla güncellendi." });
  } catch (err: any) {
    console.error("PATCH admin users error:", err);
    return NextResponse.json({ error: err.message || "Güncelleme sırasında hata oluştu." }, { status: 500 });
  }
}

// DELETE - Delete User by ID
export async function DELETE(request: Request) {
  try {
    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID (userId) parametresi gereklidir." }, { status: 400 });
    }

    // Call SECURITY DEFINER RPC admin_delete_user
    const { data, error } = await adminClient.rpc("admin_delete_user", {
      target_user_id: userId
    });

    if (error || (data && data.success === false)) {
      const errMsg = error?.message || data?.error || "Kullanıcı silinemedi.";
      console.error("admin_delete_user error:", errMsg);
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Kullanıcı sistemden başarıyla silindi." });
  } catch (err: any) {
    console.error("DELETE admin users error:", err);
    return NextResponse.json({ error: err.message || "Silme işlemi sırasında hata oluştu." }, { status: 500 });
  }
}
