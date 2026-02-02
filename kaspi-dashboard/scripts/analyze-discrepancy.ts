
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDiscrepancy() {
    console.log('🔍 Analyzing Dashboard Data Discrepancy...')

    // 1. Fetch all necessary data
    const { data: stores } = await supabase.from('stores').select('id, name')
    const { data: stockItems } = await supabase.from('stock').select('*')
    const { data: products } = await supabase.from('products').select('id, name, article, cost_price, buy_price')

    if (!stores || !stockItems || !products) {
        console.error('❌ Failed to fetch data')
        return
    }

    const productMap = new Map(products.map(p => [p.id, p]))
    const storeMap = new Map(stores.map(s => [s.id, s.name]))

    console.log(`\n📊 Global Stats:`)
    console.log(`- Total Stores: ${stores.length}`)
    console.log(`- Total Products in DB: ${products.length}`)
    console.log(`- Total Stock Entries: ${stockItems.length}`)

    // 2. Aggregate by Store (mimicking Dashboard logic)
    const storeStats = new Map<string, {
        name: string,
        nomenclatureCount: number,
        totalStock: number,
        totalValue: number,
        missingProducts: number,
        zeroCostItems: number
    }>()

    // Initialize stats for known stores
    stores.forEach(s => {
        storeStats.set(s.id, {
            name: s.name,
            nomenclatureCount: 0,
            totalStock: 0,
            totalValue: 0,
            missingProducts: 0,
            zeroCostItems: 0
        })
    })

    // Process stock items
    stockItems.forEach(item => {
        // Skip if quantity is 0 (Dashboard usually filters these for display, but let's check)
        if (item.quantity <= 0) return

        const storeId = item.store_id
        const stats = storeStats.get(storeId)

        if (!stats) {
            // console.warn(`⚠️ Stock item for unknown store: ${storeId}`)
            return
        }

        const product = productMap.get(item.product_id)

        if (!product) {
            stats.missingProducts++
            return
        }

        // Calculate Price
        // Priority: cost_price -> buy_price -> 0
        const price = Number(product.cost_price) || Number(product.buy_price) || 0

        if (price === 0) {
            stats.zeroCostItems++
        }

        stats.nomenclatureCount++
        stats.totalStock += item.quantity
        stats.totalValue += item.quantity * price
    })

    // 3. Output Results
    console.log('\n🏭 Store Breakdown (Dashboard Logic):')
    storeStats.forEach((stats, id) => {
        console.log(`\n[${stats.name}]`)
        console.log(`  - Nomenclature (Items > 0): ${stats.nomenclatureCount}`)
        console.log(`  - Total Stock (Qty): ${stats.totalStock}`)
        console.log(`  - Total Value: ${stats.totalValue.toLocaleString('ru-RU')} ₸`)

        if (stats.missingProducts > 0) {
            console.log(`  ⚠️ MISSING PRODUCTS (in stock but not in products table): ${stats.missingProducts}`)
        }
        if (stats.zeroCostItems > 0) {
            console.log(`  ⚠️ ITEMS WITH ZERO COST (price=0): ${stats.zeroCostItems}`)
        }
    })

    // 4. Deep Dive into "Main Warehouse" (Основной склад) if discrepancies are high
    const mainStore = stores.find(s => s.name.toLowerCase().includes('основной'))
    if (mainStore) {
        console.log(`\n🕵️ Deep Dive: ${mainStore.name}`)
        const stats = storeStats.get(mainStore.id)
        if (stats && stats.zeroCostItems > 0) {
            console.log('  Top 5 Zero Cost Items (by Quantity):')
            const zeroCost = stockItems
                .filter(i => i.store_id === mainStore.id && i.quantity > 0)
                .map(i => {
                    const p = productMap.get(i.product_id)
                    return { ...i, product: p }
                })
                .filter(i => i.product && (Number(i.product.cost_price) || Number(i.product.buy_price) || 0) === 0)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5)

            zeroCost.forEach(i => {
                console.log(`    - ${i.product?.name} (Art: ${i.product?.article}): Qty ${i.quantity}`)
            })
        }
    }
}

analyzeDiscrepancy()
