// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCustomEmail, replaceTemplateVariables } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Verify user role
    const { data: roleData, error: roleError } = await supabase
      .from('profiles' as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const body = await req.json();
    const { to, subject, html, templateId, variables } = body;

    if (!to || !subject) {
      return NextResponse.json({ error: 'Eksik zorunlu alanlar' }, { status: 400 });
    }

    let emailHtml = html;

    if (templateId) {
      const adminClient = createAdminClient();
      const { data: template, error: templateError } = await adminClient
        .from('email_templates' as any)
        .select('body_html')
        .eq('id', templateId)
        .single();

      if (templateError || !template || !template.body_html) {
        return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
      }

      emailHtml = replaceTemplateVariables(template.body_html, variables || {});
    }

    if (!emailHtml) {
      return NextResponse.json({ error: 'E-posta içeriği boş olamaz' }, { status: 400 });
    }

    const result = await sendCustomEmail(to, subject, emailHtml);

    // Log the email
    const adminClient = createAdminClient();
    await adminClient.from('email_logs' as any).insert({
      recipient_email: Array.isArray(to) ? to.join(', ') : to,
      subject,
      status: result.id ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Email send endpoint error:', error);
    return NextResponse.json({ error: 'E-posta gönderilirken bir hata oluştu' }, { status: 500 });
  }
}
