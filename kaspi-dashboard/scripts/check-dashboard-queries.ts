
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkQueries() {
    const queries = [
        { name: 'stock', query: supabase.from('stock').select('*').limit(1) },
        { name: 'sales', query: supabase.from('sales').select('*').limit(1) },
        { name: 'product_metrics', query: supabase.from('product_metrics').select('*').limit(1) },
        { name: 'stores', query: supabase.from('stores').select('*').limit(1) },
        { name: 'products', query: supabase.from('products').select('*').limit(1) },
        { name: 'payments_in', query: supabase.from('payments_in').select('*').limit(1) },
        { name: 'payments_out', query: supabase.from('payments_out').select('*').limit(1) },
        { name: 'money_by_account', query: supabase.from('money_by_account').select('*').limit(1) },
        { name: 'profit_by_product', query: supabase.from('profit_by_product').select('*').limit(1) },
    ]

    for (const { name, query } of queries) {
        try {
            const { error } = await query
            if (error) {
                console.error(`❌ Error querying ${name}:`, error.message)
            } else {
                console.log(`✅ ${name}: OK`)
            }
        } catch (e: any) {
            console.error(`❌ Exception querying ${name}:`, e.message)
        }
    }
}

checkQueries()
