const { config } = require('dotenv')
config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Mock getWarehouseName
function getWarehouseName(storeName: any) {
    if (!storeName) return 'Неизвестный склад'
    if (storeName.includes('Основной')) return 'Основной склад'
    if (storeName.includes('Китай')) return 'Склад Китай'
    if (storeName.includes('Предзаказ')) return 'Склад предзаказов'
    if (storeName.includes('Транзит')) return 'Склад транзит'
    return storeName
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    console.log('🔍 Analyzing Zero Cost Items...')

    // 1. Get Data
    const { data: stores } = await supabaseAdmin.from('stores').select('*')
    const storesMap = new Map((stores as any[])?.map((s: any) => [s.id, s]))

    const { data: stockItems } = await supabaseAdmin.from('stock').select('*')
    const { data: products } = await supabaseAdmin.from('products').select('*')
    const productsMap = new Map((products as any[])?.map((p: any) => [p.id, p]))

    let zeroCostItems: any[] = []
    let totalZeroCostQuantity = 0

        ; (stockItems as any[]).forEach((item: any) => {
            const product = productsMap.get(item.product_id)
            if (!product) return
            if (product.archived) return // Skip archived

            let storeName = ''
            if (item.store_id) {
                const foundStore = storesMap.get(item.store_id)
                storeName = foundStore?.name || ''
            }
            const targetWarehouse = getWarehouseName(storeName)

            // Skip Preorder warehouse if we want to focus on "real" stock issues, 
            // but user asked "how many", so let's include but label them, or maybe separate stats.
            // Actually, let's exclude Preorder from the "Problematic" list if that's the norm,
            // but usually 0 cost is bad everywhere. Let's list all but group by warehouse.

            const quantity = parseFloat(item.quantity || item.stock || 0)
            if (quantity <= 0) return

            let costPrice = 0
            const stockCost = parseFloat(item.cost_price || 0)

            if (stockCost > 0) {
                costPrice = stockCost
            } else {
                costPrice = parseFloat(product.cost_price || 0)
            }

            if (costPrice === 0) {
                zeroCostItems.push({
                    name: product.name,
                    article: product.article,
                    warehouse: targetWarehouse,
                    quantity,
                    salePrice: parseFloat(product.sale_price || product.price || 0)
                })
                totalZeroCostQuantity += quantity
            }
        })

    // Group by Warehouse
    const byWarehouse: Record<string, { count: number, quantity: number, items: any[] }> = {}

    zeroCostItems.forEach(item => {
        if (!byWarehouse[item.warehouse]) {
            byWarehouse[item.warehouse] = { count: 0, quantity: 0, items: [] }
        }
        byWarehouse[item.warehouse].count++
        byWarehouse[item.warehouse].quantity += item.quantity
        byWarehouse[item.warehouse].items.push(item)
    })

    console.log(`\nTotal Unique Items with 0 Cost: ${zeroCostItems.length}`)
    console.log(`Total Quantity of 0 Cost Items: ${totalZeroCostQuantity}`)

    console.log('\n--- Breakdown by Warehouse ---')
    Object.entries(byWarehouse).forEach(([wh, stats]) => {
        console.log(`\n📦 ${wh}:`)
        console.log(`   Items: ${stats.count}`)
        console.log(`   Total Quantity: ${stats.quantity}`)
        console.log('   Top 5 Examples:')
        stats.items.slice(0, 5).forEach(i => {
            console.log(`     - ${i.name} (Qty: ${i.quantity}, Sale: ${i.salePrice})`)
        })
    })
}

run()
