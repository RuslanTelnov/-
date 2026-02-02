
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
    if (!storeName || storeName.trim() === '') {
        return 'Основной склад'
    }

    const name = storeName.toLowerCase().trim()

    // Склад Китай - различные варианты
    if (name.includes('китай') || name.includes('china') || name.includes('cn') ||
        name.includes('chinese') || name.includes('кит') || name.includes('cn-')) {
        return 'Склад Китай'
    }

    // Склад предзаказов
    if (name.includes('предзаказ') || name.includes('preorder') || name.includes('pre-order') ||
        name.includes('пред') || name.includes('резерв') || name.includes('reserve')) {
        return 'Склад предзаказов'
    }

    // Склад транзит
    if (name.includes('транзит') || name.includes('transit')) {
        return 'Склад транзит'
    }

    // Товар в пути (исключаем из Основного склада и Склада транзит)
    if (name.includes('в пути') || name.includes('доставка') || name.includes('delivery') || name.includes('в дороге')) {
        return 'В пути'
    }

    // Основной склад (строгое соответствие)
    if (name === 'основной склад' || name === 'main warehouse') {
        return 'Основной склад'
    }

    // Все остальные склады
    return 'Прочие'
}

async function debugDashboard() {
    console.log('🚀 Starting Dashboard Logic Debug...')

    // 1. Fetch Data (Mimic Dashboard.tsx)
    console.log('Fetching data...')
    const [storesResult, stockResult, productsResult] = await Promise.all([
        supabase.from('stores').select('*').order('name'),
        supabase.from('stock').select('*'),
        supabase.from('products').select('id, article, name, price, sale_price, buy_price, cost_price, kaspi_price, archived').eq('archived', false),
    ])

    const stores = storesResult.data || []
    const stockData = stockResult.data || []
    const productsData = productsResult.data || []

    console.log(`Stores: ${stores.length}`)
    console.log(`Stock Items: ${stockData.length}`)
    console.log(`Products: ${productsData.length}`)

    // 2. Build Maps
    const productsMap = new Map(productsData.map(p => [p.id, p]))
    const storesMap = new Map(stores.map(s => [s.id, s]))

    // 3. Initialize Warehouses
    const warehouseNames = ['Склад Китай', 'Основной склад', 'Склад предзаказов', 'Склад транзит']
    const warehouseMap = new Map()
    warehouseNames.forEach(name => {
        warehouseMap.set(name, {
            name,
            nomenclatureCount: 0,
            quantityInPieces: 0,
            totalValue: 0,
        })
    })

    // 4. Process Stock
    let processedCount = 0
    let skippedCount = 0
    let byWarehouse: Record<string, number> = {}

    console.log('\nProcessing Stock...')
    stockData.forEach((stockItem: any) => {
        const product = productsMap.get(stockItem.product_id)
        if (!product) {
            // console.log(`Skip: Product not found for stock ${stockItem.id}`)
            skippedCount++
            return
        }

        let storeName = ''
        if (stockItem.store_id) {
            const foundStore = storesMap.get(stockItem.store_id)
            storeName = foundStore?.name || ''
        }

        const targetWarehouse = getWarehouseName(storeName)
        byWarehouse[targetWarehouse] = (byWarehouse[targetWarehouse] || 0) + 1

        const quantity = parseFloat(
            stockItem.quantity ||
            stockItem.stock ||
            stockItem.available ||
            0
        )

        if (quantity <= 0) {
            // console.log(`Skip: Zero quantity for ${product.name} in ${storeName}`)
            skippedCount++
            return
        }

        const warehouse = warehouseMap.get(targetWarehouse)
        if (!warehouse) {
            console.log(`Skip: Warehouse ${targetWarehouse} not in display list (Store: ${storeName})`)
            return
        }

        let price = 0
        if (targetWarehouse === 'Склад предзаказов') {
            price = parseFloat(product.sale_price || product.price || 0)
        } else {
            if (stockItem.cost_price !== null && stockItem.cost_price !== undefined) {
                price = parseFloat(stockItem.cost_price)
            } else {
                price = parseFloat(product.cost_price || 0)
            }
        }

        const totalValue = quantity * price

        warehouse.nomenclatureCount++
        warehouse.quantityInPieces += quantity
        warehouse.totalValue += totalValue
        processedCount++

        if (processedCount <= 5) {
            console.log(`Sample Processed: ${product.name} | Store: ${storeName} -> ${targetWarehouse} | Qty: ${quantity} | Price: ${price} | Value: ${totalValue}`)
        }
    })

    console.log(`\n✅ Processed: ${processedCount}`)
    console.log(`❌ Skipped: ${skippedCount}`)
    console.log('Distribution:', byWarehouse)

    console.log('\nFinal Warehouse Data:')
    warehouseNames.forEach(name => {
        const wh = warehouseMap.get(name)
        console.log(`${name}: Qty=${wh.quantityInPieces}, Value=${wh.totalValue}`)
    })
}

debugDashboard()
