import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  // Admin API routes: return JSON 401/403 instead of redirecting (defense in depth;
  // each route handler also enforces requireAdmin()).
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
    }
    const { data: apiProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if ((apiProfile as { role?: string | null } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
    }
    return supabaseResponse
  }

  // Protected routes
  const protectedPaths = ['/hesabim', '/siparislerim', '/favorilerim', '/odeme']
  const adminPaths = ['/admin']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  const isAdmin = adminPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/giris'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  
  if (isAdmin && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } else if (isAdmin && !user) {
    return NextResponse.redirect(new URL('/giris', request.url))
  }
  
  return supabaseResponse
}
