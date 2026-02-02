
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkZeroCostStock() {
    console.log('🔍 Checking Zero Cost Stock...')

    const { data: stock, error } = await supabase
        .from('stock')
        .select('product_id, stock, cost_price')
        .gt('stock', 0)
        .eq('cost_price', 0)
        .limit(10)

    if (error) {
        console.error('❌ Error fetching stock:', error)
        return
    }

    console.log(`Found ${stock?.length} items with stock > 0 and cost_price = 0`)
    console.log('Sample items:', stock)
}

checkZeroCostStock()
