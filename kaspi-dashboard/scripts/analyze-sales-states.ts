const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function analyzeStates() {
    try {
        // Use the same filter as clean-and-sync
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        // Manually format to match what I think is happening
        const dateStr = startOfMonth.toISOString().replace('T', ' ').substring(0, 19)
        const filter = `moment>=${dateStr}`

        console.log(`Fetching sales since ${filter}...`)

        const data = await moySkladClient.getSales({ filter, limit: 100, expand: 'positions,state' })
        const data2 = await moySkladClient.getSales({ filter, limit: 100, offset: 100, expand: 'positions,state' })

        const allRows = [...(data.rows || []), ...(data2.rows || [])]

        if (allRows.length > 0) {
            console.log('First sale sample:', JSON.stringify(allRows[0], null, 2))
        }

        console.log(`Total fetched: ${allRows.length}`)

        let totalSum = 0
        let totalOverhead = 0
        const byApplicable: Record<string, { count: number, sum: number }> = {}

        for (const sale of allRows) {
            const sum = (sale.sum || 0) / 100
            const app = sale.applicable ? 'True' : 'False'

            if (!byApplicable[app]) {
                byApplicable[app] = { count: 0, sum: 0 }
            }
            byApplicable[app].count++
            byApplicable[app].sum += sum
        }

        console.log('Sales by Applicable:')
        console.table(byApplicable)

    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

analyzeStates()
