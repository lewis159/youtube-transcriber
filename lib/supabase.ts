import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — uses anon key, respects RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — lazy so SUPABASE_SERVICE_ROLE_KEY isn't read at build time
let _admin: SupabaseClient | null = null
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}
