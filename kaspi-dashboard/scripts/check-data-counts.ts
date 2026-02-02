import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkData() {
    console.log('🔍 Checking database content...')

    const tables = ['products', 'stock', 'stores', 'profit_by_product', 'turnover', 'sales']

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
}

checkData()
