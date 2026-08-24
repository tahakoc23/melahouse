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
