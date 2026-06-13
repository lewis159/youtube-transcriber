import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — uses anon key, respects RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — lazy init so it doesn't throw during next build (SUPABASE_SERVICE_ROLE_KEY is runtime-only)
let _admin: ReturnType<typeof createClient> | null = null
export function getSupabaseAdmin() {
  if (!_admin) {
    _admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

// Keep supabaseAdmin as a named export for backwards compat — but make it a getter
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof ReturnType<typeof createClient>]
  },
})
