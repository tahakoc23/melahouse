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

    // Update Auth user credentials (email/password) if provided
    const authUpdatePayload: any = {};
    if (email) authUpdatePayload.email = email;
    if (password && password.trim() !== "") authUpdatePayload.password = password;
    if (full_name) authUpdatePayload.user_metadata = { full_name };

    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: authErr } = await adminClient.auth.admin.updateUserById(userId, authUpdatePayload);
      if (authErr) {
        console.error("Auth updateUserById error:", authErr);
        return NextResponse.json({ error: authErr.message }, { status: 400 });
      }
    }

    // Update public.profiles table
    const profileUpdatePayload: any = {};
    if (email) profileUpdatePayload.email = email;
    if (full_name) profileUpdatePayload.full_name = full_name;
    if (role) profileUpdatePayload.role = role;

    if (Object.keys(profileUpdatePayload).length > 0) {
      const { error: profileErr } = await adminClient
        .from('profiles')
        .update(profileUpdatePayload)
        .eq('id', userId);

      if (profileErr) {
        console.error("Profile update error:", profileErr);
        return NextResponse.json({ error: profileErr.message }, { status: 400 });
      }
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

    // Delete linked profile & addresses first
    await adminClient.from('addresses').delete().eq('user_id', userId);
    await adminClient.from('wishlist').delete().eq('user_id', userId);
    await adminClient.from('reviews').delete().eq('user_id', userId);
    await adminClient.from('profiles').delete().eq('id', userId);

    // Delete user from auth.users
    const { error: authDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      console.error("Auth deleteUser error:", authDeleteErr);
      return NextResponse.json({ error: authDeleteErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Kullanıcı sistemden başarıyla silindi." });
  } catch (err: any) {
    console.error("DELETE admin users error:", err);
    return NextResponse.json({ error: err.message || "Silme işlemi sırasında hata oluştu." }, { status: 500 });
  }
}
