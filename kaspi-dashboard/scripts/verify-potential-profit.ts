const { config } = require('dotenv')
config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Mock getWarehouseName since we can't easily import it if it's ESM
function getWarehouseName(storeName: any) {
    if (!storeName) return 'Неизвестный склад'
    if (storeName.includes('Основной')) return 'Основной склад'
    if (storeName.includes('Китай')) return 'Склад Китай'
    if (storeName.includes('Предзаказ')) return 'Склад предзаказов'
    if (storeName.includes('Транзит')) return 'Склад транзит'
    return storeName
}

// Create Supabase client directly here to avoid importing from lib
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    console.log('📊 Verifying Potential Profit Calculation...')

    // 1. Get Stores
    const { data: stores } = await supabaseAdmin.from('stores').select('*')
    const storesMap = new Map((stores as any[])?.map((s: any) => [s.id, s]))

    // 2. Get Stock Items
    const { data: stockItems } = await supabaseAdmin
        .from('stock')
        .select('*')

    if (!stockItems || stockItems.length === 0) {
        console.log('No stock items found')
        return
    }

    // 3. Get Products
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, article, price, sale_price, cost_price, archived')

    const productsMap = new Map((products as any[])?.map((p: any) => [p.id, p]))

    let totalPotentialProfit = 0
    let processedCount = 0

    console.log('\n--- Detailed Breakdown (Sample) ---')

        ; (stockItems as any[]).forEach((item: any, index: any) => {
            const product = productsMap.get(item.product_id)
            if (!product) return
            if (product.archived) return

            let storeName = ''
            if (item.store_id) {
                const foundStore = storesMap.get(item.store_id)
                storeName = foundStore?.name || ''
            }
            const targetWarehouse = getWarehouseName(storeName)

            const quantity = parseFloat(item.quantity || item.stock || 0)
            if (quantity <= 0) return

            // Logic from Dashboard.tsx (UPDATED)
            // 1. Exclude Preorder Warehouse from Potential Profit
            if (targetWarehouse === 'Склад предзаказов') return

            const salePrice = parseFloat(product.sale_price || product.price || 0)

            let costPrice = 0
            // For normal warehouses, 'price' variable holds the cost/buy price
            // But here in script we access item.cost_price directly or product.cost_price
            const stockCost = parseFloat(item.cost_price || 0)
            if (stockCost > 0) {
                costPrice = stockCost
            } else {
                costPrice = parseFloat(product.cost_price || 0)
            }

            // 2. Exclude items with zero cost
            if (costPrice <= 0) return

            const potentialProfit = (salePrice - costPrice) * quantity

            if (potentialProfit > 0) {
                totalPotentialProfit += potentialProfit
                if (processedCount < 10) {
                    console.log(`[${targetWarehouse}] ${product.name}: (${salePrice} - ${costPrice}) * ${quantity} = ${potentialProfit.toFixed(2)}`)
                }
            }
            processedCount++
        })

    console.log('\n--- Summary ---')
    console.log(`Total Potential Profit: ${totalPotentialProfit.toLocaleString('ru-RU')} ₸`)
}

run()
