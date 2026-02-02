import dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCounts() {
    console.log('📊 Checking Database Counts...\n')

    const tables = ['products', 'stock', 'stores', 'sales', 'customer_orders', 'money_by_account']

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.error(`❌ Error checking ${table}:`, error.message)
        } else {
            console.log(`✅ ${table}: ${count} rows`)
        }
    }

    // Check Stores Content specifically
    const { data: stores } = await supabase.from('stores').select('name, id')
    console.log('\n🏪 Stores in DB:')
    stores?.forEach(s => console.log(`- "${s.name}" (${s.id})`))
}

checkCounts()
