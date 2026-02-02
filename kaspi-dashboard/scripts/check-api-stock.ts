import { config } from 'dotenv'
config({ path: '.env.local' })

import { createMoySkladClient } from '../lib/moy-sklad/client'

async function run() {
    const client = createMoySkladClient({
        apiUrl: 'https://api.moysklad.ru/api/remap/1.2',
        token: process.env.MOY_SKLAD_TOKEN
    })

    console.log('Fetching stock from MoySklad...')
    const stockData = await client.getStock({ limit: 1000 })

    // Find Preorder store
    // We need to know the store ID or name from the response
    // The response structure is rows with stockByStore

    let totalReserve = 0
    let preorderStoreId = ''

    // First, let's find the store ID for "Склад предзаказов"
    // We can't easily map name to ID here without fetching stores, but let's look at the data

    const rows = stockData.rows || []
    console.log(`Received ${rows.length} stock rows`)

    // We need to identify the store. 
    // Let's just dump one row to see structure
    if (rows.length > 0) {
        // console.log('Sample row:', JSON.stringify(rows[0], null, 2))

        // stockByStore is an array of { meta: { href: ... }, stock: ..., reserve: ... }
        // We need to find the store href that corresponds to Preorder
    }

    // Let's fetch stores to find the ID
    const storesData = await client.getStores()
    console.log('Available stores:', storesData.rows.map((s: any) => s.name))
    const preorderStore = storesData.rows.find((s: any) => s.name === 'Склад Предзаказ' || s.name === 'Склад предзаказов')

    if (!preorderStore) {
        console.log('Preorder store not found in MoySklad')
        return
    }

    console.log(`Preorder Store: ${preorderStore.name} (${preorderStore.id})`)
    const storeHref = preorderStore.meta.href

    // Now iterate stock and sum reserve for this store
    rows.forEach((row: any) => {
        const stockByStore = row.stockByStore || []
        const storeStock = stockByStore.find((s: any) => s.meta.href === storeHref)

        if (storeStock) {
            totalReserve += storeStock.reserve || 0
        }
    })

    console.log(`Total Reserve in MoySklad API for Preorder: ${totalReserve}`)
}

run()
