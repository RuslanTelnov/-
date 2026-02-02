const { createMoySkladClient } = require('../lib/moy-sklad/client')
require('dotenv').config({ path: '.env.local' })

const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function debugSales() {
    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const filter = `moment>=${startOfMonth.toISOString().split('T')[0]} 00:00:00`

        console.log(`Checking data since ${filter}...`)

        // 1. Demand (Sales)
        const demandData = await moySkladClient.getSales({ filter })
        const demandSum = (demandData.rows || []).reduce((acc: number, item: any) => acc + (item.sum || 0), 0) / 100
        console.log(`Demand (Otgruzka) Count: ${demandData.meta.size}, Sum: ${demandSum}`)

        // 2. Retail Demand (Retail Sales)
        const retailData = await moySkladClient.getData('/entity/retaildemand', { filter })
        const retailSum = (retailData.rows || []).reduce((acc: number, item: any) => acc + (item.sum || 0), 0) / 100
        console.log(`Retail Demand Count: ${retailData.meta.size}, Sum: ${retailSum}`)

        // 3. Customer Orders
        const orderData = await moySkladClient.getCustomerOrders({ filter })
        const orderSum = (orderData.rows || []).reduce((acc: number, item: any) => acc + (item.sum || 0), 0) / 100
        console.log(`Customer Orders Count: ${orderData.meta.size}, Sum: ${orderSum}`)

        // 4. Invoice Out
        const invoiceData = await moySkladClient.getData('/entity/invoiceout', { filter })
        const invoiceSum = (invoiceData.rows || []).reduce((acc: number, item: any) => acc + (item.sum || 0), 0) / 100
        console.log(`Invoice Out Count: ${invoiceData.meta.size}, Sum: ${invoiceSum}`)

        console.log('--------------------------------')
        console.log(`Total Demand + Retail: ${demandSum + retailSum}`)
        console.log(`Total Demand + Orders: ${demandSum + orderSum}`)

    } catch (error: any) {
        console.error('Error:', error.message)
    }
}

debugSales()
