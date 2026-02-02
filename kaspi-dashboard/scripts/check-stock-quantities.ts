
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkStockQuantities() {
    const { data: stock } = await supabase.from('stock').select('stock')

    if (!stock) return

    const positiveStock = stock.filter(s => (s.stock || 0) > 0)
    console.log(`Total Stock Rows: ${stock.length}`)
    console.log(`Rows with Stock > 0: ${positiveStock.length}`)
}

checkStockQuantities()
