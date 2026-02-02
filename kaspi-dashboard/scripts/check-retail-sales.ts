
require('dotenv').config({ path: '.env.local' })
const { createMoySkladClient } = require('../lib/moy-sklad/client')

async function checkRetailSales() {
    const client = createMoySkladClient({
        apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
        token: process.env.MOY_SKLAD_TOKEN,
    })

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] + ' 00:00:00'

    console.log(`Checking Retail Sales (retaildemand) since ${startOfMonth}...`)

    try {
        const response = await client.client.get('/entity/retaildemand', {
            params: {
                filter: `moment>=${startOfMonth}`
            }
        })

        const rows = response.data.rows || []
        console.log(`Found ${rows.length} retail sales.`)

        let totalSum = 0
        rows.forEach((row: any) => {
            console.log(`- ${row.name} (${row.moment}): ${row.sum / 100}`)
            totalSum += (row.sum / 100)
        })
        console.log(`Total Retail Sum: ${totalSum}`)

    } catch (error) {
        console.error('Error checking retail sales:', error)
    }
}

checkRetailSales()
