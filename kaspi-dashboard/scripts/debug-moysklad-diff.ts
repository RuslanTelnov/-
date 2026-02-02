
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { createMoySkladClient } from '../lib/moy-sklad/client'

// Load env
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ms = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function main() {
    const storeId = process.argv[2] // MoySklad Store ID
    const storeName = process.argv[3] || 'Unknown Store'

    if (!storeId) {
        console.error('Please provide MoySklad Store ID as argument')
        process.exit(1)
    }

    console.log(`🔍 Analyzing discrepancy for store: ${storeName} (${storeId})`)

    // 1. Fetch Report from MoySklad
    console.log('📥 Fetching stock report from MoySklad...')
    // We filter by storeId in the report
    const reportUrl = `/report/stock/all?filter=store=https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId}`

    // Note: getStockAll in client might not support filter string directly in options, 
    // but let's try to use the client's method if possible, or raw request.
    // The client.ts doesn't seem to expose raw request easily, but let's check getStockAll implementation.
    // Actually, let's just use the client to fetch all and filter in memory if needed, 
    // OR better, use the `fetch` method if available or just use the `stock` endpoint which supports filtering.
    // But `stock/all` is what we used for cost.

    // Let's try to fetch ALL stock from MS for this store using the report endpoint that gives us price.
    // The /report/stock/all endpoint supports `filter=store=...`

    // We will use a custom fetch since the typed client might limit us.
    const authHeader = process.env.MOY_SKLAD_TOKEN
        ? `Bearer ${process.env.MOY_SKLAD_TOKEN}`
        : `Basic ${Buffer.from(`${process.env.MOY_SKLAD_USERNAME}:${process.env.MOY_SKLAD_PASSWORD}`).toString('base64')}`

    const headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
    }

    const limit = 1000
    let offset = 0
    const msItems = new Map()

    while (true) {
        const url = `https://api.moysklad.ru/api/remap/1.2/report/stock/all?limit=${limit}&offset=${offset}&filter=store=https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId}`
        const res = await fetch(url, { headers })
        if (!res.ok) {
            throw new Error(`Failed to fetch MS report: ${res.status} ${res.statusText}`)
        }
        const data = await res.json()
        const rows = data.rows || []

        for (const row of rows) {
            // row.article, row.name, row.stock, row.price (cost), row.quantity
            // row.stock is "Остаток"
            // row.quantity might be different? In report/stock/all:
            // stock = physical stock
            // reserve = reserve
            // quantity = available? No, let's check.

            const article = row.article
            if (!article) continue

            msItems.set(article, {
                name: row.name,
                stock: row.stock || 0,
                reserve: row.reserve || 0,
                price: (row.price || 0) / 100, // Convert to base currency
                quantity: row.quantity || 0 // usually same as stock in this report?
            })
        }

        if (rows.length < limit) break
        offset += limit
        console.log(`   Fetched ${offset} items...`)
    }

    console.log(`✅ Fetched ${msItems.size} items from MoySklad report`)

    // 2. Fetch Data from Supabase
    console.log('📥 Fetching data from Supabase...')
    const { data: sbStock, error } = await supabase
        .from('stock')
        .select(`
      stock,
      reserve,
      cost_price,
      products!inner (
        article,
        name
      ),
      stores!inner (
        moy_sklad_id
      )
    `)
        .eq('stores.moy_sklad_id', storeId)

    if (error) throw error

    const sbItems = new Map()
    sbStock.forEach((item: any) => {
        const article = item.products.article
        if (!article) return

        sbItems.set(article, {
            name: item.products.name,
            stock: item.stock,
            reserve: item.reserve,
            cost_price: item.cost_price // Use stock-specific cost price
        })
    })

    console.log(`✅ Fetched ${sbItems.size} items from Supabase`)

    // 3. Compare
    console.log('\n📊 COMPARISON (Top Discrepancies by Value):')
    console.log('Article | Name | MS Stock | SB Stock | MS Price | SB Cost | MS Value | SB Value | Diff')
    console.log('-'.repeat(120))

    let totalMsValue = 0
    let totalSbValue = 0
    const diffs = []

    // Iterate over all unique articles
    const allArticles = new Set([...msItems.keys(), ...sbItems.keys()])

    for (const article of allArticles) {
        const msItem = msItems.get(article) || { stock: 0, price: 0, name: 'N/A' }
        const sbItem = sbItems.get(article) || { stock: 0, cost_price: 0, name: 'N/A' }

        const msVal = msItem.stock * msItem.price
        const sbVal = sbItem.stock * (sbItem.cost_price || 0)

        totalMsValue += msVal
        totalSbValue += sbVal

        const diff = sbVal - msVal
        if (Math.abs(diff) > 1) { // Filter small rounding errors
            diffs.push({
                article,
                name: msItem.name !== 'N/A' ? msItem.name : sbItem.name,
                msStock: msItem.stock,
                sbStock: sbItem.stock,
                msPrice: msItem.price,
                sbCost: sbItem.cost_price,
                msVal,
                sbVal,
                diff
            })
        }
    }

    // Sort by absolute difference
    diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

    // Print top 20
    diffs.slice(0, 20).forEach(d => {
        console.log(
            `${d.article.padEnd(10)} | ` +
            `${d.name.substring(0, 20).padEnd(20)} | ` +
            `${d.msStock.toString().padStart(5)} | ` +
            `${d.sbStock.toString().padStart(5)} | ` +
            `${d.msPrice.toFixed(2).padStart(8)} | ` +
            `${(d.sbCost || 0).toFixed(2).padStart(8)} | ` +
            `${d.msVal.toFixed(0).padStart(8)} | ` +
            `${d.sbVal.toFixed(0).padStart(8)} | ` +
            `${d.diff.toFixed(0).padStart(8)}`
        )
    })

    console.log('-'.repeat(120))
    console.log(`Total MS Value: ${totalMsValue.toLocaleString('ru-RU')}`)
    console.log(`Total SB Value: ${totalSbValue.toLocaleString('ru-RU')}`)
    console.log(`Difference:     ${(totalSbValue - totalMsValue).toLocaleString('ru-RU')}`)
}

main().catch(console.error)
