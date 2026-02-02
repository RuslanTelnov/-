import { createMoySkladClient } from '../lib/moy-sklad/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function run() {
    const productId = '904de26e-0a49-11f0-0a80-03fe00111c33'
    console.log(`🔍 Checking historical cost for product ${productId}...`)

    try {
        // Fetch bulk Profit report
        const apiUrl = 'https://api.moysklad.ru/api/remap/1.2'

        // Date range: last 365 days
        const momentFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00'
        const momentTo = new Date().toISOString().split('T')[0] + ' 23:59:59'

        console.log(`Fetching Profit report for last 365 days (limit 20)...`)

        const response = await client.getData('/report/profit/byproduct', {
            momentFrom,
            momentTo,
            limit: 20
        })

        const rows = response.rows
        console.log(`Found ${rows.length} rows.`)

        for (const row of rows) {
            if (row.sellQuantity > 0) {
                const avgCost = (row.sellCostSum / 100) / row.sellQuantity
                console.log(`Product: ${row.assortment.name}`)
                console.log(`   Sell Qty: ${row.sellQuantity}`)
                console.log(`   Avg Cost: ${avgCost.toFixed(2)}`)
            }
        }

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message)
    }
}

run()
