const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function checkReturns() {
    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const filter = `moment>=${startOfMonth.toISOString().split('T')[0]} 00:00:00`

        console.log(`Checking returns since ${filter}...`)

        const returnData = await moySkladClient.getData('/entity/salesreturn', { filter })
        const returnSum = (returnData.rows || []).reduce((acc: number, item: any) => acc + (item.sum || 0), 0) / 100
        console.log(`Sales Return Count: ${returnData.meta.size}, Sum: ${returnSum}`)

    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

checkReturns()
