import { createMoySkladClient } from './lib/moy-sklad/client'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const msClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: process.env.MOY_SKLAD_TOKEN,
    username: process.env.MOY_SKLAD_USERNAME,
    password: process.env.MOY_SKLAD_PASSWORD,
})

async function compareMargins() {
    console.log('🔍 Fetching Profit by Product from MoySklad API...')
    // Fetch last 30 days
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Format dates for MS API (YYYY-MM-DD HH:mm:ss)
    const fmt = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19)

    const msData = await msClient.getProfitByProduct({
        limit: 5,
        offset: 0,
        momentFrom: fmt(start),
        momentTo: fmt(end)
    })

    if (!msData.rows || msData.rows.length === 0) {
        console.log('❌ No data returned from MoySklad')
        return
    }

    console.log(`✅ Received ${msData.rows.length} rows from MoySklad. Comparing top 5...`)

    for (const msRow of msData.rows) {
        const productId = msRow.assortment.meta.href.split('/').pop()
        const msMargin = msRow.margin // Margin in % from MS
        const msProfit = msRow.profit / 100 // Profit in standard units
        const msSellSum = msRow.sellSum / 100
        const msCostSum = msRow.sellCostSum / 100

        // Fetch local data
        const { data: localData } = await supabase
            .from('profit_by_product')
            .select('*')
            .eq('product_id', productId)
            .order('period_end', { ascending: false })
            .limit(1)
            .single()

        if (!localData) {
            console.log(`⚠️ Product ${productId} not found in local DB`)
            continue
        }

        console.log(`\n📦 Product: ${msRow.assortment.name} (${msRow.assortment.article})`)
        console.log(`   MoySklad:`)
        console.log(`     Sell Sum: ${msSellSum}`)
        console.log(`     Cost Sum: ${msCostSum}`)
        console.log(`     Profit:   ${msProfit}`)
        console.log(`     Margin %: ${msMargin}`)

        console.log(`   Local DB:`)
        console.log(`     Sell Sum: ${localData.sell_sum}`)
        console.log(`     Cost Sum: ${localData.sell_cost_sum}`)
        console.log(`     Margin %: ${localData.sales_margin}`)

        // Verify calculation
        // Margin % = (Profit / Revenue) * 100 ? Or (Profit / Cost) * 100?
        // MoySklad typically uses (Profit / Revenue) * 100 for "Rentability" (Рентабельность)
        // and (Profit / Cost) * 100 for "Markup" (Наценка).
        // Let's check what 'margin' field in MS API represents.

        const calculatedMargin = msSellSum ? ((msSellSum - msCostSum) / msSellSum) * 100 : 0
        console.log(`   Calculated (Profit/Revenue): ${calculatedMargin.toFixed(2)}%`)

        const diff = Math.abs(msMargin - localData.sales_margin)
        if (diff > 0.1) {
            console.log(`❌ MISMATCH! Diff: ${diff.toFixed(2)}`)
        } else {
            console.log(`✅ MATCH`)
        }
    }
}

compareMargins()
