const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function inspectRetailDemand() {
    try {
        console.log('Fetching retail demand...')
        // Use getData to fetch retaildemand without modifying client yet
        const data = await moySkladClient.getData('/entity/retaildemand', { limit: 1, expand: 'positions' })

        if (data.rows && data.rows.length > 0) {
            const sale = data.rows[0]
            console.log('Retail Demand Sample:')
            console.log(JSON.stringify(sale, null, 2))

            if (sale.positions && sale.positions.rows && sale.positions.rows.length > 0) {
                console.log('Position Sample:')
                console.log(JSON.stringify(sale.positions.rows[0], null, 2))
            }
        } else {
            console.log('No retail demand found.')
        }
    } catch (error: any) {
        console.error('Error:', error.message)
        if (error.response) {
            console.error('Response data:', error.response.data)
        }
    }
}

inspectRetailDemand()
