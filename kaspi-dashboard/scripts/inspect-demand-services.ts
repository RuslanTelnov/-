const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function inspectDemandPositions() {
    try {
        console.log('Fetching recent sales (demand)...')
        const data = await moySkladClient.getSales({ limit: 10, expand: 'positions' })

        if (data.rows && data.rows.length > 0) {
            let serviceCount = 0
            let productCount = 0
            let unknownCount = 0

            for (const sale of data.rows) {
                if (sale.positions && sale.positions.rows) {
                    for (const pos of sale.positions.rows) {
                        const href = pos.assortment?.meta?.href || ''
                        if (href.includes('/entity/service/')) {
                            console.log(`Found Service in Sale ${sale.name}: ${href}`)
                            serviceCount++
                        } else if (href.includes('/entity/product/')) {
                            productCount++
                        } else if (href.includes('/entity/variant/')) {
                            productCount++
                        } else {
                            console.log(`Found Unknown Entity in Sale ${sale.name}: ${href}`)
                            unknownCount++
                        }
                    }
                }
            }

            console.log('Summary:')
            console.log(`Products/Variants: ${productCount}`)
            console.log(`Services: ${serviceCount}`)
            console.log(`Unknown: ${unknownCount}`)

        } else {
            console.log('No sales found.')
        }
    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

inspectDemandPositions()
