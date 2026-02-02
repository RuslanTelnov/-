
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMainWarehouseStock() {
    console.log('🔍 Checking Main Warehouse Stock...')
    const mainWarehouseId = 'd9b1edb8-4508-43e4-909b-2599a6502241'

    const { data: stock, error } = await supabase
        .from('stock')
        .select('product_id, stock, cost_price')
        .eq('store_id', mainWarehouseId)
        .gt('stock', 0)
        .limit(10)

    if (error) {
        console.error('❌ Error fetching stock:', error)
        return
    }

    console.log(`Found ${stock?.length} items for Main Warehouse`)
    console.log('Sample items:', stock)
}

checkMainWarehouseStock()
