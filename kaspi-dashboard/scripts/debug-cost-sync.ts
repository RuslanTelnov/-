
import { createMoySkladClient } from '../lib/moy-sklad/client'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function debugCostSync() {
    console.log('🔍 Debugging Cost Sync...')

    const client = createMoySkladClient({
        apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
        token: process.env.MOY_SKLAD_TOKEN,
        username: process.env.MOY_SKLAD_USERNAME,
        password: process.env.MOY_SKLAD_PASSWORD,
    })

    // Product: Dahao порошок от тараканов 1 шт
    // Article: 999999999
    // We'll search by this article or name to find the product in the report

    console.log('Fetching report/stock/all with stockDays=true...')

    // We can't filter report/stock/all by article directly in the client usually, 
    // but let's see if we can fetch a small batch and find it, or if we need to filter in memory.
    // The client.getStockAll might support filter?

    // Let's try to fetch with a limit and see raw data structure
    const data = await client.getStockAll({ limit: 100, offset: 0, stockDays: 'true' })

    if (!data.rows) {
        console.log('❌ No rows returned')
        return
    }

    console.log(`Received ${data.rows.length} rows. Searching for target product...`)

    const targetName = 'Dahao порошок от тараканов 1 шт'
    const target = data.rows.find((r: any) => r.name === targetName || r.article === '999999999')

    if (target) {
        console.log('✅ Found target product in report:')
        console.log(JSON.stringify(target, null, 2))
        console.log('--- Analysis ---')
        console.log(`Price (Cost): ${target.price / 100}`)
        console.log(`Stock Days: ${target.stockDays}`)
    } else {
        console.log('⚠️ Target product not found in first 100 rows.')
        console.log('Sample row:', JSON.stringify(data.rows[0], null, 2))
    }
}

debugCostSync()
