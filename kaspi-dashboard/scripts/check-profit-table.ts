import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkProfitTable() {
    console.log('🔍 Checking profit_by_product table...')

    // Try to select some data
    const { data, error, count } = await supabase
        .from('profit_by_product')
        .select('*', { count: 'exact' })
        .limit(5)

    if (error) {
        console.error('❌ Error:', error)
    } else {
        console.log(`✅ Count: ${count}`)
        console.log('Sample data:', JSON.stringify(data, null, 2))
    }
}

checkProfitTable()
