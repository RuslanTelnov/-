
require('dotenv').config({ path: '.env.local' })
const { createMoySkladClient } = require('../lib/moy-sklad/client')

async function findSaleBySum() {
    const client = createMoySkladClient({
        apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
        token: process.env.MOY_SKLAD_TOKEN,
    })

    // Search from Nov 25 to Dec 5
    const start = '2025-11-25 00:00:00'
    const end = '2025-12-05 23:59:59'

    console.log(`Searching for sales with sum ~839 between ${start} and ${end}...`)

    let offset = 0
    while (true) {
        const response = await client.getSales({
            limit: 100,
            offset,
            filter: `moment>=${start};moment<=${end}`,
        })

        const rows = response.rows || []
        if (rows.length === 0) break

        for (const row of rows) {
            const sum = row.sum / 100
            if (Math.abs(sum - 839) < 10) { // Tolerance of 10
                console.log(`FOUND CANDIDATE: ${row.name} (${row.moment}) - Sum: ${sum} - ID: ${row.id}`)
            }
        }

        offset += 100
        if (rows.length < 100) break
    }
}

findSaleBySum()
