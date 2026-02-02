
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
    console.log('🚀 Starting stock cost sync per store...')

    // 1. Get all stores
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, moy_sklad_id, name')

    if (storesError) {
        console.error('❌ Failed to fetch stores:', storesError)
        process.exit(1)
    }

    console.log(`📦 Found ${stores.length} stores`)

    // 2. Iterate stores and sync costs
    for (const store of stores) {
        if (!store.moy_sklad_id) {
            console.warn(`⚠️ Skipping store ${store.name} (no MoySklad ID)`)
            continue
        }

        console.log(`\n🔄 Syncing costs for store: ${store.name} (${store.moy_sklad_id})`)

        try {
            await syncStoreCosts(store.id, store.moy_sklad_id)
        } catch (err) {
            console.error(`❌ Error syncing store ${store.name}:`, err)
        }
    }

    console.log('\n✅ All stores processed')
}

async function syncStoreCosts(storeId: string, msStoreId: string) {
    const limit = 1000
    let offset = 0
    let totalUpdated = 0

    // Auth header for custom fetch
    const authHeader = process.env.MOY_SKLAD_TOKEN
        ? `Bearer ${process.env.MOY_SKLAD_TOKEN}`
        : `Basic ${Buffer.from(`${process.env.MOY_SKLAD_USERNAME}:${process.env.MOY_SKLAD_PASSWORD}`).toString('base64')}`

    const headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
    }

    while (true) {
        const url = `https://api.moysklad.ru/api/remap/1.2/report/stock/all?limit=${limit}&offset=${offset}&filter=store=https://api.moysklad.ru/api/remap/1.2/entity/store/${msStoreId}`

        const res = await fetch(url, { headers })
        if (!res.ok) {
            throw new Error(`Failed to fetch report: ${res.status} ${res.statusText}`)
        }

        const data = await res.json()
        const rows = data.rows || []

        if (rows.length === 0) break

        const updates = []

        // Batch process rows
        for (const row of rows) {
            const article = row.article
            if (!article) continue

            const costPrice = (row.price || 0) / 100 // Convert to base currency

            // Find product ID by article
            // Optimization: We could cache product map, but for now let's do it simply or use upsert with join?
            // Supabase doesn't support upsert with join easily.
            // Let's fetch product ID first.

            // Actually, fetching all products first is better.
        }

        // Optimization: Fetch all products for these articles
        const articles = rows.map((r: any) => r.article).filter(Boolean)
        const { data: products } = await supabase
            .from('products')
            .select('id, article')
            .in('article', articles)

        const productMap = new Map(products?.map(p => [p.article, p.id]))

        const stockUpdates = []
        for (const row of rows) {
            const productId = productMap.get(row.article)
            if (!productId) continue

            const costPrice = (row.price || 0) / 100

            stockUpdates.push({
                product_id: productId,
                store_id: storeId,
                cost_price: costPrice,
                stock: row.stock || 0,
                reserve: row.reserve || 0,
                stock_days: row.stockDays || 0,
                updated_at: new Date().toISOString()
            })
        }

        if (stockUpdates.length > 0) {
            const { error } = await supabase
                .from('stock')
                .upsert(stockUpdates, { onConflict: 'product_id,store_id' })

            if (error) {
                console.error('Error updating stock costs:', error)
            } else {
                totalUpdated += stockUpdates.length
            }
        }

        if (rows.length < limit) break
        offset += limit
        process.stdout.write(`   Processed ${offset} items...\r`)
    }

    console.log(`   ✅ Updated ${totalUpdated} items`)
}

main().catch(console.error)
