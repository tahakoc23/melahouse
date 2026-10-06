import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/ui/AdminShell'

export const metadata: Metadata = {
  title: 'Yönetim',
  robots: { index: false, follow: false },
}

/**
 * Admin yetki kontrolü sunucuda yapılır: getUser() oturumu Supabase Auth sunucusunda doğrular
 * (getSession çerezdeki veriye güvenir, yetki kararı için kullanılmaz). Rol admin değilse ana sayfaya.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
  const profile = data as { full_name: string | null; role: string | null } | null

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <AdminShell userName={profile.full_name || user.email || 'Yönetici'} userEmail={user.email ?? ''}>
      {children}
    </AdminShell>
  )
}
