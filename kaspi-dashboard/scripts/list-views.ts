import dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function listViews() {
    try {
        const { supabaseAdmin } = await import('../lib/supabase/server')

        // Query pg_views system table
        // Note: accessing system tables might be restricted even for service_role depending on RLS/Supabase config,
        // but usually it works for postgres role. service_role is not postgres role.
        // However, we can try.

        const { data, error } = await supabaseAdmin
            .from('pg_views')
            .select('viewname, schemaname')
            .eq('schemaname', 'public')

        if (error) {
            console.log('Error listing views:', error.message)
        } else {
            console.log('Views in public schema:', data.map((v: any) => v.viewname))
        }

    } catch (e) {
        console.log('Error:', e)
    }
}

listViews()
