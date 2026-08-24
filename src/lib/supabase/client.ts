import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uruqnynrgxzgwugybjpu.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydXFueW5yZ3h6Z3d1Z3lianB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyOTg3NzMsImV4cCI6MjEwMjg3NDc3M30.MzzawgOfxsENDcUuBb-pVSMAUGC7h9l4VovTfDE6vGI'

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}
