// @ts-nocheck
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // 1. Fetch all suppliers
    const { data: suppliers, error: supErr } = await adminClient
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (supErr) throw supErr;

    // 2. Fetch all supplier products with supplier details
    const { data: supplierProducts, error: prodErr } = await adminClient
      .from("supplier_products")
      .select("*, suppliers(name, domain), products(id, name, slug)")
      .order("created_at", { ascending: false });

    if (prodErr) throw prodErr;

    // 3. Fetch unread changes for RED BADGE count
    const { data: unreadChanges, error: chgErr } = await adminClient
      .from("supplier_changes")
      .select("id")
      .eq("is_read", false);

    if (chgErr) throw chgErr;

    return NextResponse.json({
      suppliers: suppliers || [],
      supplierProducts: supplierProducts || [],
      unreadCount: unreadChanges?.length || 0
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (err: any) {
    console.error("GET admin suppliers error:", err);
    return NextResponse.json({ error: err.message || "Toptancılar alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();

    const { name, domain, website_url, contact_person, phone, email, notes } = body;
    if (!name) {
      return NextResponse.json({ error: "Firma adı zorunludur." }, { status: 400 });
    }

    const { data: supplier, error } = await adminClient
      .from("suppliers")
      .insert({
        name,
        domain: domain || (website_url ? website_url.replace(/https?:\/\//, '').split('/')[0] : ''),
        website_url,
        contact_person,
        phone,
        email,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ supplier });
  } catch (err: any) {
    console.error("POST admin supplier error:", err);
    return NextResponse.json({ error: err.message || "Toptancı eklenemedi." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { id, name, website_url, contact_person, phone, email, notes } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Toptancı ID ve firma adı zorunludur." }, { status: 400 });
    }

    const domain = website_url ? website_url.replace(/https?:\/\//, '').split('/')[0] : '';

    const { data: supplier, error } = await adminClient
      .from("suppliers")
      .update({
        name,
        domain,
        website_url,
        contact_person,
        phone,
        email,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ supplier });
  } catch (err: any) {
    console.error("PUT admin supplier error:", err);
    return NextResponse.json({ error: err.message || "Toptancı güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("id");
    const supplierProductId = searchParams.get("product_id");

    if (supplierId) {
      const { error } = await adminClient
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Toptancı firma silindi." });
    }

    if (supplierProductId) {
      const { error } = await adminClient
        .from("supplier_products")
        .delete()
        .eq("id", supplierProductId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Toptancı ürünü silindi." });
    }

    return NextResponse.json({ error: "Silinecek ID parametresi bulunamadı." }, { status: 400 });
  } catch (err: any) {
    console.error("DELETE admin supplier error:", err);
    return NextResponse.json({ error: err.message || "Silme işleminde hata oluştu." }, { status: 500 });
  }
}
