import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-side client with service role key for admin operations
// Using a proxy or lazy initialization to avoid build-time errors if env vars are missing
let clientInstance: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
        return () => ({ data: null, error: { message: 'Build time mock' } });
      }
      throw new Error('Missing Supabase environment variables');
    }

    if (!clientInstance) {
      clientInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }

    return (clientInstance as any)[prop];
  }
});

