import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type AdminGuardResult = { user: User } | NextResponse

/**
 * API route handler'ları için admin yetki kontrolü.
 * Kullanım:
 *   const guard = await requireAdmin()
 *   if (guard instanceof NextResponse) return guard
 *   const { user } = guard
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || (profile as { role?: string | null } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
    }

    return { user }
  } catch (err) {
    console.error('requireAdmin error:', err)
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
  }
}
