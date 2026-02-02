
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkStockDays() {
    console.log('Checking stock_days...')

    const { data, error } = await supabase
        .from('stock')
        .select('stock_days, stock, store_id')
        .gt('stock', 0)
        .limit(20)

    if (error) {
        console.error('Select Error:', error)
    } else {
        console.log('Sample stock items:', data)
        const nonZeroDays = data?.filter(i => i.stock_days > 0).length
        console.log(`Items with stock_days > 0 in sample: ${nonZeroDays}/${data?.length}`)
    }
}

checkStockDays()
