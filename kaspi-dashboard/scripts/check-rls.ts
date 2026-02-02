
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Use SERVICE ROLE key to query system tables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkRLS() {
    console.log('Checking RLS policies...')

    const { data, error } = await supabase
        .rpc('get_policies') // This might not exist, so we'll try querying pg_policies if possible, or just check if we can read with anon key

    // Better way: Try to read with ANON key
    const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('--- Testing Read with ANON Key ---')

    const tables = [
        'stock',
        'stores',
        'products',
        'profit_by_product',
        'product_metrics',
        'sales',
        'payments_in',
        'payments_out',
        'money_by_account'
    ]

    for (const table of tables) {
        const { count, error } = await supabaseAnon
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.log(`❌ ${table}: Error - ${error.message}`)
        } else {
            console.log(`✅ ${table}: Readable (Count: ${count})`)
        }
    }
}

checkRLS()
