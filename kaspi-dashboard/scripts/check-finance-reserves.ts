
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkFinanceAndReserves() {
    console.log('Checking Finance and Reserves...')

    // 1. Payments
    const { count: paymentsInCount } = await supabase.from('payments_in').select('*', { count: 'exact', head: true })
    const { count: paymentsOutCount } = await supabase.from('payments_out').select('*', { count: 'exact', head: true })

    console.log(`Payments In: ${paymentsInCount}`)
    console.log(`Payments Out: ${paymentsOutCount}`)

    // 2. Reserves
    const { data: reserves, error } = await supabase
        .from('stock')
        .select('id, reserve, stock, store_id')
        .gt('reserve', 0)
        .limit(10)

    if (error) {
        console.error('Stock Error:', error)
    } else {
        console.log(`Items with reserve > 0: ${reserves?.length > 0 ? 'Yes' : 'No'}`)
        if (reserves && reserves.length > 0) {
            console.log('Sample reserve item:', reserves[0])

            // Check store name for this item
            const { data: store } = await supabase.from('stores').select('name').eq('id', reserves[0].store_id).single()
            console.log('Store Name:', store?.name)
        }
    }
}

checkFinanceAndReserves()
