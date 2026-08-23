import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type TypedSupabaseClient = SupabaseClient<Database>

let cachedClient: TypedSupabaseClient | null = null

export function createSupabaseServerClient(): TypedSupabaseClient {
  if (cachedClient) return cachedClient

  cachedClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  return cachedClient
}
