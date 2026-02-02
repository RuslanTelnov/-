const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyFix() {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    // 1. Get Sales (non-cancelled)
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sum, is_cancelled')
        .gte('moment', startOfMonth.toISOString())

    if (salesError) {
        console.error('Sales Error:', salesError)
        return
    }

    const totalSales = (sales || []).reduce((acc, s) => acc + (s.sum || 0), 0)
    const cancelledSales = (sales || []).filter(s => s.is_cancelled).reduce((acc, s) => acc + (s.sum || 0), 0)
    const activeSales = totalSales - cancelledSales

    console.log(`Total Sales (DB): ${totalSales}`)
    console.log(`Cancelled Sales: ${cancelledSales}`)
    console.log(`Active Sales: ${activeSales}`)

    // 2. Get Returns
    const { data: returns } = await supabase
        .from('sales_returns')
        .select('sum')
        .gte('moment', startOfMonth.toISOString())

    const totalReturns = returns.reduce((acc, r) => acc + (r.sum || 0), 0)
    console.log(`Total Returns: ${totalReturns}`)

    // 3. Net Sales
    const netSales = activeSales - totalReturns
    console.log(`Net Sales (Active - Returns): ${netSales}`)

    const target = 296141
    console.log(`Target (App): ${target}`)
    console.log(`Difference: ${netSales - target}`)
}

verifyFix()
