
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkOrphans() {
    console.log('Checking for orphaned stock items...')

    // Get all stock product_ids
    const { data: stockItems, error: stockError } = await supabase
        .from('stock')
        .select('product_id')

    if (stockError) {
        console.error('Stock Error:', stockError)
        return
    }

    const stockProductIds = new Set(stockItems?.map(i => i.product_id))
    console.log(`Total stock items: ${stockItems?.length}`)
    console.log(`Unique product IDs in stock: ${stockProductIds.size}`)

    // Get all product IDs
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')

    if (productsError) {
        console.error('Products Error:', productsError)
        return
    }

    const productIds = new Set(products?.map(p => p.id))
    console.log(`Total products: ${products?.length}`)

    // Find orphans
    let orphans = 0
    stockProductIds.forEach(id => {
        if (!productIds.has(id)) {
            orphans++
            console.log(`❌ Orphan found: Stock references product_id ${id} which does not exist in products table`)
        }
    })

    if (orphans === 0) {
        console.log('✅ No orphans found. All stock items reference valid products.')
    } else {
        console.log(`❌ Found ${orphans} orphaned stock items.`)
    }
}

checkOrphans()
