const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function inspectSales() {
    try {
        const names = ['09394', '09369']

        for (const name of names) {
            console.log(`Fetching sale ${name}...`)
            const data = await moySkladClient.getSales({ filter: `name=${name}`, expand: 'positions,state' })
            if (data.rows && data.rows.length > 0) {
                const sale = data.rows[0]
                console.log(`Sale ${name}:`)
                console.log(`  ID: ${sale.id}`)
                console.log(`  Sum: ${(sale.sum || 0) / 100}`)
                console.log(`  Payed Sum: ${(sale.payedSum || 0) / 100}`)
                console.log(`  State: ${sale.state?.name}`)
                console.log(`  Applicable: ${sale.applicable}`)
                console.log(`  Created: ${sale.created}`)
                console.log(`  Positions:`)
                if (sale.positions) {
                    // console.log(JSON.stringify(sale.positions, null, 2))
                    if (sale.positions.rows) {
                        for (const pos of sale.positions.rows) {
                            console.log(`    - ${pos.assortment?.meta?.href} (Price: ${pos.price / 100}, Qty: ${pos.quantity})`)
                        }
                    } else {
                        console.log('    No rows in positions.')
                    }
                } else {
                    console.log('    No positions field.')
                }
            } else {
                console.log(`Sale ${name} not found.`)
            }
        }

    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

inspectSales()
