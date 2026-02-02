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
    console.log('🔍 Diagnosing High Potential Profit...')

    // 1. Get Data
    const { data: stores } = await supabaseAdmin.from('stores').select('*')
    const storesMap = new Map((stores as any[])?.map((s: any) => [s.id, s]))

    const { data: stockItems } = await supabaseAdmin.from('stock').select('*')
    const { data: products } = await supabaseAdmin.from('products').select('*')
    const productsMap = new Map((products as any[])?.map((p: any) => [p.id, p]))

    let items: any[] = []
    let zeroCostItems: any[] = []

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

            const quantity = parseFloat(item.quantity || item.stock || 0)
            if (quantity <= 0) return

            // Logic from Dashboard.tsx
            const salePrice = parseFloat(product.sale_price || product.price || 0)

            let costPrice = 0
            if (targetWarehouse === 'Склад предзаказов') {
                costPrice = parseFloat(product.cost_price || 0)
            } else {
                const stockCost = parseFloat(item.cost_price || 0)
                if (stockCost > 0) {
                    costPrice = stockCost
                } else {
                    costPrice = parseFloat(product.cost_price || 0)
                }
            }

            const potentialProfit = (salePrice - costPrice) * quantity

            if (potentialProfit > 0) {
                items.push({
                    name: product.name,
                    article: product.article,
                    warehouse: targetWarehouse,
                    quantity,
                    salePrice,
                    costPrice,
                    profit: potentialProfit
                })

                if (costPrice === 0) {
                    zeroCostItems.push({
                        name: product.name,
                        article: product.article,
                        warehouse: targetWarehouse,
                        quantity,
                        salePrice,
                        profit: potentialProfit
                    })
                }
            }
        })

    // Sort by profit desc
    items.sort((a, b) => b.profit - a.profit)
    zeroCostItems.sort((a, b) => b.profit - a.profit)

    console.log('\n--- TOP 20 Profit Contributors ---')
    console.table(items.slice(0, 20).map(i => ({
        Name: i.name.substring(0, 30),
        Wh: i.warehouse,
        Qty: i.quantity,
        Sale: i.salePrice,
        Cost: i.costPrice,
        Profit: Math.round(i.profit).toLocaleString('ru-RU')
    })))

    console.log('\n--- TOP 10 Zero Cost Items (Inflating Profit) ---')
    if (zeroCostItems.length > 0) {
        console.table(zeroCostItems.slice(0, 10).map(i => ({
            Name: i.name.substring(0, 30),
            Wh: i.warehouse,
            Qty: i.quantity,
            Sale: i.salePrice,
            Profit: Math.round(i.profit).toLocaleString('ru-RU')
        })))
        const totalZeroCostProfit = zeroCostItems.reduce((sum, i) => sum + i.profit, 0)
        console.log(`\nTotal Profit from Zero Cost Items: ${Math.round(totalZeroCostProfit).toLocaleString('ru-RU')} ₸`)
    } else {
        console.log('No items with 0 cost price found contributing to profit.')
    }

    const totalProfit = items.reduce((sum, i) => sum + i.profit, 0)
    console.log(`\nTotal Potential Profit: ${Math.round(totalProfit).toLocaleString('ru-RU')} ₸`)
}

run()
