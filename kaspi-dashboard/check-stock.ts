import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STORE_ID = 'de940fd4-23f4-11ef-0a80-0eb00010b17c' // Основной склад

async function checkStock() {
    const { count, error } = await supabase
        .from('stock')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', STORE_ID)

    if (error) {
        console.error('Error fetching stock:', error)
        return
    }

    console.log(`Stock items for store ${STORE_ID}: ${count}`)

    // Check a few items to see if they have positive stock
    const { data: items } = await supabase
        .from('stock')
        .select('stock, reserve, product_id')
        .eq('store_id', STORE_ID)
        .gt('stock', 0)
        .limit(5)

    console.log('Sample items with stock > 0:', items)
}

checkStock()
