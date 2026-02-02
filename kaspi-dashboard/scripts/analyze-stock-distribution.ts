
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function analyzeStockDistribution() {
    // Get all stores
    const { data: stores } = await supabase.from('stores').select('id, name')
    const storesMap = new Map(stores?.map(s => [s.id, s.name]))

    // Get all stock
    const { data: stock } = await supabase.from('stock').select('store_id, stock')

    if (!stock) return

    const distribution: Record<string, number> = {}
    let totalStock = 0

    stock.forEach(item => {
        const storeName = storesMap.get(item.store_id) || 'Unknown Store (' + item.store_id + ')'
        const qty = parseFloat(item.stock || 0)

        if (qty > 0) {
            distribution[storeName] = (distribution[storeName] || 0) + qty
            totalStock += qty
        }
    })

    console.log('Stock Distribution:')
    Object.entries(distribution).forEach(([name, qty]) => {
        console.log(`${name}: ${qty}`)
    })
    console.log(`Total Stock: ${totalStock}`)
}

analyzeStockDistribution()
