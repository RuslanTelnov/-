
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkStockReserves() {
    const { data: stock } = await supabase.from('stock').select('stock, reserve')

    if (!stock) return

    let fullyReserved = 0
    let partiallyReserved = 0
    let noReserve = 0

    stock.forEach(item => {
        const qty = parseFloat(item.stock || 0)
        const res = parseFloat(item.reserve || 0)

        if (qty > 0) {
            if (res >= qty) fullyReserved++
            else if (res > 0) partiallyReserved++
            else noReserve++
        }
    })

    console.log(`Total Positive Stock: ${fullyReserved + partiallyReserved + noReserve}`)
    console.log(`Fully Reserved (Hidden): ${fullyReserved}`)
    console.log(`Partially Reserved: ${partiallyReserved}`)
    console.log(`No Reserve (Visible): ${noReserve}`)
}

checkStockReserves()
