import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const serviceKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY && 
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
