const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function inspectById() {
    try {
        const ids = [
            'c27bb9b7-d11b-11f0-0a80-09f7002090a2' // 09388
        ]

        for (const id of ids) {
            console.log(`Fetching sale ${id}...`)
            // Fetch directly by ID
            const sale = await moySkladClient.client.get(`/entity/demand/${id}?expand=positions,state`).then(r => r.data)

            console.log(`Sale ${sale.name}:`)
            console.log(`  Sum: ${(sale.sum || 0) / 100}`)
            console.log(`  Payed Sum: ${(sale.payedSum || 0) / 100}`)
            console.log(`  Overhead: ${(sale.overhead?.sum || 0) / 100}`)
            // Fetch agent details
            if (sale.agent?.meta?.href) {
                const agent = await moySkladClient.client.get(sale.agent.meta.href).then(r => r.data)
                console.log(`  Agent Name: ${agent.name}`)
            }

            // Fetch linked Customer Order
            if (sale.customerOrder?.meta?.href) {
                const order = await moySkladClient.client.get(sale.customerOrder.meta.href + '?expand=state').then(r => r.data)
                console.log(`  Linked Order: ${order.name}`)
                console.log(`  Order State: ${order.state?.name}`)
                console.log(`  Order Sum: ${(order.sum || 0) / 100}`)
            } else {
                console.log('  No linked Customer Order.')
            }

            console.log(`  Store: ${sale.store?.meta?.href}`)
            console.log(`  Positions Meta Size: ${sale.positions?.meta?.size}`)

            if (sale.positions && sale.positions.rows) {
                for (const pos of sale.positions.rows) {
                    const type = pos.assortment?.meta?.type
                    const href = pos.assortment?.meta?.href
                    console.log(`    - Type: ${type}, Href: ${href}, Price: ${pos.price / 100}, Qty: ${pos.quantity}`)
                }
            } else {
                console.log('    No rows in positions.')
            }
        }

        // Check a normal sale
        console.log('Fetching a normal sale...')
        const normalSale = await moySkladClient.getSales({ limit: 1, expand: 'agent' }).then(r => r.rows[0])
        console.log(`Normal Sale ${normalSale.name}:`)
        console.log(`  Sum: ${(normalSale.sum || 0) / 100}`)
        console.log(`  Agent Name: ${normalSale.agent?.name}`)

    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

inspectById()
