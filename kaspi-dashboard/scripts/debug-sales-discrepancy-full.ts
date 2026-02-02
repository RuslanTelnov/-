
require('dotenv').config({ path: '.env.local' })
const { createMoySkladClient } = require('../lib/moy-sklad/client')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugSalesDiscrepancy() {
    const client = createMoySkladClient({
        apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
        token: process.env.MOY_SKLAD_TOKEN,
    })

    // Start of month in format YYYY-MM-DD HH:mm:ss
    // Assuming server time is correct context.
    // Let's be safe and go back a bit more to catch timezone issues, then filter in memory.
    const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] + ' 00:00:00'

    console.log(`Fetching MoySklad demands since ${startOfMonthStr}...`)

    const msSalesMap = new Map()
    let offset = 0

    while (true) {
        const response = await client.getSales({
            limit: 100,
            offset,
            filter: `moment>=${startOfMonthStr}`,
            expand: 'customerOrder.state'
        })

        const rows = response.rows || []
        if (rows.length === 0) break

        for (const row of rows) {
            const sum = row.sum / 100
            const isCancelled = row.customerOrder?.state?.name?.toLowerCase().includes('отмен') ||
                row.customerOrder?.state?.name?.toLowerCase().includes('возврат')

            msSalesMap.set(row.id, {
                name: row.name,
                moment: row.moment,
                sum,
                isCancelled
            })
        }

        offset += 100
        if (rows.length < 100) break
    }

    console.log(`Fetched ${msSalesMap.size} sales from MoySklad.`)

    // Fetch DB Sales
    const { data: dbSales } = await supabase
        .from('sales')
        .select('*')
        .gte('moment', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    const dbSalesMap = new Map(dbSales.map((s: any) => [s.moy_sklad_id, s]))

    console.log(`Fetched ${dbSales.length} sales from DB.`)

    console.log('\n--- Discrepancies ---')

    // Check missing in DB
    for (const [id, msSale] of msSalesMap) {
        if (!dbSalesMap.has(id)) {
            console.log(`[MISSING IN DB] ${msSale.name} (${msSale.moment}) - Sum: ${msSale.sum} - Cancelled: ${msSale.isCancelled}`)
        } else {
            const dbSale = dbSalesMap.get(id)
            if (Math.abs(dbSale.sum - msSale.sum) > 0.01) {
                console.log(`[SUM MISMATCH] ${msSale.name}: MS=${msSale.sum}, DB=${dbSale.sum}`)
            }
            if (dbSale.is_cancelled !== msSale.isCancelled) {
                console.log(`[STATUS MISMATCH] ${msSale.name}: MS_Cancelled=${msSale.isCancelled}, DB_Cancelled=${dbSale.is_cancelled}`)
            }
        }
    }

    // Check extra in DB (shouldn't happen if sync is correct, but maybe old data)
    for (const [id, dbSale] of dbSalesMap) {
        if (!msSalesMap.has(id)) {
            console.log(`[EXTRA IN DB] ${dbSale.name} (${dbSale.moment}) - Sum: ${dbSale.sum}`)
        }
    }

    // Calculate Totals for MS
    let msTotal = 0
    let msCount = 0
    for (const val of msSalesMap.values()) {
        if (!val.isCancelled) {
            msTotal += val.sum
            msCount++
        }
    }
    console.log(`\nMoySklad Calculated Total (Active): Count=${msCount}, Sum=${msTotal}`)

}

debugSalesDiscrepancy()
