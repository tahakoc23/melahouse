import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const SERVICE_ROLE_PLACEHOLDER = 'your_service_role_key_here'

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || serviceKey.trim() === '' || serviceKey === SERVICE_ROLE_PLACEHOLDER) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ortam değişkeni tanımlı değil veya geçersiz (placeholder). Admin istemcisi oluşturulamadı.'
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ortam değişkeni tanımlı değil. Admin istemcisi oluşturulamadı.')
  }

  return createClient<Database>(
    supabaseUrl,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
