
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Copy of getWarehouseName from lib/utils/warehouse.ts
const getWarehouseName = (storeName: string): string => {
    if (!storeName || storeName.trim() === '') return 'Основной склад'
    const name = storeName.toLowerCase().trim()
    if (name.includes('китай') || name.includes('china') || name.includes('cn') || name.includes('chinese') || name.includes('кит') || name.includes('cn-')) return 'Склад Китай'
    if (name.includes('предзаказ') || name.includes('preorder') || name.includes('pre-order') || name.includes('пред') || name.includes('резерв') || name.includes('reserve')) return 'Склад предзаказов'
    if (name.includes('транзит') || name.includes('transit')) return 'Склад транзит'
    if (name.includes('в пути') || name.includes('доставка') || name.includes('delivery') || name.includes('в дороге')) return 'Склад транзит'
    if (name === 'основной склад' || name === 'main warehouse') return 'Основной склад'
    return 'Прочие'
}

async function auditWarehouses() {
    console.log('🚀 Starting Warehouse Audit...')

    // Fetch Data
    const [storesResult, stockResult, productsResult] = await Promise.all([
        supabase.from('stores').select('*').order('name'),
        supabase.from('stock').select('*'),
        supabase.from('products').select('id, article, name, price, sale_price, cost_price, archived').eq('archived', false),
    ])

    const stores = storesResult.data || []
    const stockData = stockResult.data || []
    const productsData = productsResult.data || []

    const productsMap = new Map(productsData.map(p => [p.id, p]))
    const storesMap = new Map(stores.map(s => [s.id, s]))

    // Analysis Containers
    const storeAnalysis: Record<string, any> = {}
    const warehouseAnalysis: Record<string, any> = {}
    const zeroPriceItems: any[] = []
    const unmappedStores: Set<string> = new Set()

    // Initialize Warehouse Analysis
    const warehouseNames = ['Склад Китай', 'Основной склад', 'Склад предзаказов', 'Склад транзит', 'В пути', 'Прочие']
    warehouseNames.forEach(name => {
        warehouseAnalysis[name] = { count: 0, value: 0, items: 0, zeroPriceCount: 0 }
    })

    console.log(`\n📊 Analyzing ${stockData.length} stock items...`)

    stockData.forEach((stockItem: any) => {
        const product = productsMap.get(stockItem.product_id)
        if (!product) return // Skip if product not found (or archived)

        let storeName = 'Unknown'
        if (stockItem.store_id) {
            const foundStore = storesMap.get(stockItem.store_id)
            storeName = foundStore?.name || 'Unknown ID'
        }

        const warehouse = getWarehouseName(storeName)

        // Track unmapped
        if (warehouse === 'Прочие') unmappedStores.add(storeName)

        const quantity = parseFloat(stockItem.quantity || stockItem.stock || 0)
        if (quantity <= 0) return

        // Determine Price
        let price = 0
        let priceSource = 'none'

        if (warehouse === 'Склад предзаказов') {
            price = parseFloat(product.sale_price || product.price || 0)
            priceSource = 'sale_price'
        } else {
            if (stockItem.cost_price !== null && stockItem.cost_price !== undefined) {
                price = parseFloat(stockItem.cost_price)
                priceSource = 'stock_cost'
            } else {
                price = parseFloat(product.cost_price || 0)
                priceSource = 'product_cost'
            }
        }

        const totalValue = quantity * price

        // Update Warehouse Stats
        if (warehouseAnalysis[warehouse]) {
            warehouseAnalysis[warehouse].count += quantity
            warehouseAnalysis[warehouse].value += totalValue
            warehouseAnalysis[warehouse].items += 1
            if (price === 0) warehouseAnalysis[warehouse].zeroPriceCount += 1
        }

        // Update Store Stats
        if (!storeAnalysis[storeName]) {
            storeAnalysis[storeName] = { warehouse, count: 0, value: 0, items: 0 }
        }
        storeAnalysis[storeName].count += quantity
        storeAnalysis[storeName].value += totalValue
        storeAnalysis[storeName].items += 1

        // Log Zero Price Items (limit to 10)
        if (price === 0 && zeroPriceItems.length < 10) {
            zeroPriceItems.push({
                product: product.name,
                store: storeName,
                warehouse,
                quantity
            })
        }
    })

    // Output Results
    console.log('\n=== 🏭 Warehouse Summary ===')
    console.table(Object.entries(warehouseAnalysis).map(([name, data]) => ({
        Warehouse: name,
        'Items (Rows)': data.items,
        'Total Qty': data.count.toFixed(0),
        'Total Value': Math.round(data.value).toLocaleString() + ' ₸',
        'Zero Price Items': data.zeroPriceCount
    })))

    console.log('\n=== 🏪 Store Breakdown ===')
    console.table(Object.entries(storeAnalysis).map(([name, data]) => ({
        Store: name,
        'Mapped To': data.warehouse,
        'Items': data.items,
        'Value': Math.round(data.value).toLocaleString() + ' ₸'
    })).sort((a, b) => b.Items - a.Items))

    if (unmappedStores.size > 0) {
        console.log('\n=== ⚠️ Unmapped Stores (in "Прочие") ===')
        unmappedStores.forEach(s => console.log(`- ${s}`))
    }

    if (zeroPriceItems.length > 0) {
        console.log('\n=== ⚠️ Sample Zero Price Items ===')
        zeroPriceItems.forEach(item => {
            console.log(`- ${item.product} (${item.quantity} pcs) in ${item.store}`)
        })
    }
}

auditWarehouses()
