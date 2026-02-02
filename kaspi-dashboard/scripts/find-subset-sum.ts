const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function findSubset() {
    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const dateStr = startOfMonth.toISOString().replace('T', ' ').substring(0, 19)
        const filter = `moment>=${dateStr}`

        console.log(`Fetching sales since ${filter}...`)

        const data = await moySkladClient.getSales({ filter, limit: 100 })
        const data2 = await moySkladClient.getSales({ filter, limit: 100, offset: 100 })
        const allRows = [...(data.rows || []), ...(data2.rows || [])]

        const sales = allRows.map(s => ({
            name: s.name,
            sum: (s.sum || 0) / 100,
            id: s.id
        }))

        const target1 = 12046
        const target2 = 9401 // 12046 - 2645 (Returns)

        console.log(`Searching for subset sum matching ${target1} or ${target2}...`)

        // Check 1 item
        for (const s of sales) {
            if (Math.abs(s.sum - target1) < 1) console.log(`Found match (1 item): ${s.name} = ${s.sum}`)
            if (Math.abs(s.sum - target2) < 1) console.log(`Found match (1 item - returns): ${s.name} = ${s.sum}`)
        }

        // Check 2 items
        for (let i = 0; i < sales.length; i++) {
            for (let j = i + 1; j < sales.length; j++) {
                const sum = sales[i].sum + sales[j].sum
                if (Math.abs(sum - target1) < 1) console.log(`Found match (2 items): ${sales[i].name} (${sales[i].sum}) + ${sales[j].name} (${sales[j].sum})`)
                if (Math.abs(sum - target2) < 1) console.log(`Found match (2 items - returns): ${sales[i].name} (${sales[i].sum}) + ${sales[j].name} (${sales[j].sum})`)
            }
        }

        // Check 3 items (limited)
        for (let i = 0; i < sales.length; i++) {
            for (let j = i + 1; j < sales.length; j++) {
                for (let k = j + 1; k < sales.length; k++) {
                    const sum = sales[i].sum + sales[j].sum + sales[k].sum
                    if (Math.abs(sum - target1) < 1) console.log(`Found match (3 items): ${sales[i].name} + ${sales[j].name} + ${sales[k].name}`)
                    if (Math.abs(sum - target2) < 1) console.log(`Found match (3 items - returns): ${sales[i].name} + ${sales[j].name} + ${sales[k].name}`)
                }
            }
        }

    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

findSubset()
