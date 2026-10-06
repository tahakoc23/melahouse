import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Değerler ortam değişkenlerinden gelir (Vercel + .env.local); koda sabit proje adresi yazılmaz
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}
