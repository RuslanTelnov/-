import { config } from 'dotenv'
config({ path: '.env.local' })

import { createMoySkladClient } from '../lib/moy-sklad/client'

async function run() {
    const client = createMoySkladClient({
        apiUrl: 'https://api.moysklad.ru/api/remap/1.2',
        token: process.env.MOY_SKLAD_TOKEN
    })

    console.log('Fetching stock from MoySklad API...')

    // Get all stock with price
    // /report/stock/all gives us stock, reserve, price, salePrice, etc.
    // We need to filter by store.

    // First get store href
    const storesData = await client.getStores()
    const preorderStore = storesData.rows.find((s: any) => s.name === 'Склад Предзаказ' || s.name === 'Склад предзаказов')

    if (!preorderStore) {
        console.log('Preorder store not found')
        return
    }
    const storeId = preorderStore.id
    console.log(`Store: ${preorderStore.name} (${storeId})`)

    // Fetch stock report filtered by store
    // Note: /report/stock/all supports filter by storeId? No, it supports store.id parameter

    let offset = 0
    let totalReserve = 0
    let totalReserveValue = 0

    console.log('Fetching report/stock/all...')

    while (true) {
        const data = await client.getStockAll({
            limit: 1000,
            offset,
            // filter: `store=https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId}` // This filter might not work directly in getStockAll wrapper if it doesn't pass params correctly or if API expects different format
            // Actually, report/stock/all has 'store.id' parameter
        } as any)

        // Wait, getStockAll in client.ts takes params. Let's check if we can pass storeId
        // The API doc says: filter=store=...

        const rows = data.rows || []
        if (rows.length === 0) break

        rows.forEach((row: any) => {
            // row contains stock, reserve, price, salePrice, etc.
            // But report/stock/all returns aggregated data if not filtered by store?
            // If we don't filter by store, it returns total stock.
            // We MUST filter by store to get correct reserve for THIS store.

            // Let's try to filter in client side if API filter fails, but report/stock/all aggregates...
            // Actually, report/stock/bystore gives breakdown but maybe not prices?
            // report/stock/all gives prices.

            // Let's assume we need to filter by store in the request.
        })

        break // Stop for now, let's verify if we can filter
    }

    // Let's try to use the client.getData directly to pass specific params
    const reportUrl = '/report/stock/all'
    const filter = `store=https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId}`

    console.log(`Requesting ${reportUrl} with filter ${filter}`)

    offset = 0
    while (true) {
        const data = await client.getData(reportUrl, {
            limit: 1000,
            offset,
            filter
        })

        const rows = data.rows || []
        if (rows.length === 0) break

        console.log(`Received ${rows.length} rows`)

        rows.forEach((row: any) => {
            const reserve = row.reserve || 0
            if (reserve > 0) {
                const price = row.salePrice || row.price || 0
                const reserveValue = (reserve * price) / 100

                totalReserve += reserve
                totalReserveValue += reserveValue

                console.log(`[API] ${row.name} (${row.article || row.code}) | ${reserve} * ${price / 100} = ${reserveValue}`)
            }
        })

        offset += 1000
        if (rows.length < 1000) break
    }

    console.log(`\n--- MoySklad API Summary ---`)
    console.log(`Total Reserve: ${totalReserve}`)
    console.log(`Total Reserve Value: ${totalReserveValue.toLocaleString('ru-RU')} ₸`)
}

run()
