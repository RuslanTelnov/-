
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Copy of getWarehouseName from lib/utils/warehouse.ts
const getWarehouseName = (storeName: string): string => {
    if (!storeName || storeName.trim() === '') {
        return 'Основной склад'
    }

    const name = storeName.toLowerCase().trim()

    if (name.includes('китай') || name.includes('china') || name.includes('cn') ||
        name.includes('chinese') || name.includes('кит') || name.includes('cn-')) {
        return 'Склад Китай'
    }

    if (name.includes('предзаказ') || name.includes('preorder') || name.includes('pre-order') ||
        name.includes('пред') || name.includes('резерв') || name.includes('reserve')) {
        return 'Склад предзаказов'
    }

    if (name.includes('транзит') || name.includes('transit')) {
        return 'Склад транзит'
    }

    if (name.includes('в пути') || name.includes('доставка') || name.includes('delivery') || name.includes('в дороге')) {
        return 'Склад транзит'
    }

    if (name === 'основной склад' || name === 'main warehouse') {
        return 'Основной склад'
    }

    return 'Прочие'
}

async function simulateDashboard() {
    console.log('Fetching data...')
    const { data: stores } = await supabase.from('stores').select('*')
    const { data: stockData } = await supabase.from('stock').select('*')
    const { data: productsData } = await supabase.from('products').select('id, article, name, price, sale_price, buy_price, cost_price, kaspi_price')

    if (!stores || !stockData || !productsData) {
        console.error('Failed to fetch data')
        return
    }

    const productsMap = new Map(productsData.map((p: any) => [p.id, p]))
    const storesMap = new Map(stores.map((s: any) => [s.id, s]))

    const warehouseMap = new Map<string, any>()
    const warehouseNames = ['Склад Китай', 'Основной склад', 'Склад предзаказов', 'Склад транзит']

    warehouseNames.forEach(name => {
        warehouseMap.set(name, {
            name,
            nomenclatureCount: 0,
            quantityInPieces: 0,
            totalValue: 0,
        })
    })

    let skippedCount = 0
    let processedCount = 0
    let byWarehouse: Record<string, number> = {}

    stockData.forEach((stockItem: any) => {
        const product = productsMap.get(stockItem.product_id)
        if (!product || !product.article) {
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

        const quantity = parseFloat(stockItem.quantity || stockItem.stock || 0)

        if (quantity <= 0) {
            skippedCount++
            return
        }

        const warehouse = warehouseMap.get(targetWarehouse)
        if (!warehouse) {
            // console.warn('Warehouse not found:', targetWarehouse)
            return
        }

        warehouse.quantityInPieces += quantity
        processedCount++
    })

    console.log(`Processed: ${processedCount}, Skipped: ${skippedCount}`)
    console.log('Distribution:', byWarehouse)
    console.log('Warehouses:', Array.from(warehouseMap.values()))
}

simulateDashboard()
