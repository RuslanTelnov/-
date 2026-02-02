import dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkTableType() {
    try {
        const { supabaseAdmin } = await import('../lib/supabase/server')

        // Check if it's a table
        const { data: tables, error: tableError } = await supabaseAdmin
            .from('information_schema.tables')
            .select('table_name, table_type')
            .in('table_name', ['profit_by_product', 'sales'])
            .eq('table_schema', 'public')

        if (tableError) {
            // Supabase client might not allow querying information_schema directly like this due to PostgREST restrictions
            console.log('Could not query information_schema via client:', tableError.message)

            // Fallback: Try to RPC or just infer from error?
            // Let's try to insert a dummy row (and rollback/fail) - if it's a view it might fail differently?
            // No, that's risky.
        } else {
            console.log('Table Types:', tables)
        }

    } catch (e) {
        console.log('Error:', e)
    }
}

checkTableType()
