
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use ANON key to simulate client
)

// Copy of getWarehouseName
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

async function debugModalFetch() {
    console.log('🔍 Debugging Modal Fetch Logic...')
    const warehouseName = 'Склад Китай' // Target warehouse
    console.log(`Target Warehouse: "${warehouseName}"`)

    // 1. Get all stores
    const { data: stores, error: storesError } = await supabase.from('stores').select('id, name')
    if (storesError) {
        console.error('❌ Error fetching stores:', storesError)
        return
    }
    console.log(`✅ Fetched ${stores?.length} stores`)

    // 2. Filter stores
    const targetStoreIds = stores
        .filter(s => {
            const wName = getWarehouseName(s.name)
            console.log(`  Store: "${s.name}" -> Warehouse: "${wName}"`)
            return wName === warehouseName
        })
        .map(s => s.id)

    console.log(`🎯 Target Store IDs:`, targetStoreIds)

    if (targetStoreIds.length === 0) {
        console.error('❌ No stores found for warehouse!')
        return
    }

    // 3. Fetch stock
    let query = supabase
        .from('stock')
        .select(`
            id,
            product_id,
            store_id,
            stock,
            stock_days,
            product:products (
              name,
              cost_price
            )
        `)
        .in('store_id', targetStoreIds)
        .gt('stock', 0)

    const { data: stockData, error: stockError } = await query

    if (stockError) {
        console.error('❌ Error fetching stock:', stockError)
        return
    }

    console.log(`✅ Fetched ${stockData?.length} stock items`)

    if (stockData && stockData.length > 0) {
        console.log('Sample item:', JSON.stringify(stockData[0], null, 2))

        // Check days
        const withDays = stockData.filter((i: any) => i.stock_days > 0).length
        console.log(`Items with stock_days > 0: ${withDays}`)
    }
}

debugModalFetch()
