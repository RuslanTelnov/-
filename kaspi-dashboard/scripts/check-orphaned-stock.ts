
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkOrphanedStock() {
    // Get all product IDs
    const { data: products } = await supabase.from('products').select('id')
    const productIds = new Set(products?.map(p => p.id))

    // Get all stock
    const { data: stock } = await supabase.from('stock').select('product_id')

    if (!stock) return

    let orphaned = 0
    let valid = 0

    stock.forEach(item => {
        if (productIds.has(item.product_id)) {
            valid++
        } else {
            orphaned++
        }
    })

    console.log(`Valid Stock Items: ${valid}`)
    console.log(`Orphaned Stock Items: ${orphaned}`)
}

checkOrphanedStock()
