
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCurrentMonthSales() {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

    console.log(`Checking sales from ${startOfMonth} to ${endOfMonth}`)

    // 1. Get Sales (excluding cancelled)
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sum, quantity, is_cancelled, name, moy_sklad_id')
        .gte('moment', startOfMonth)
        .lte('moment', endOfMonth)

    if (salesError) {
        console.error('Error fetching sales:', salesError)
        return
    }

    // 2. Get Returns
    const { data: returns, error: returnsError } = await supabase
        .from('sales_returns')
        .select('sum, moment')
        .gte('moment', startOfMonth)
        .lte('moment', endOfMonth)

    if (returnsError) {
        console.error('Error fetching returns:', returnsError)
        return
    }

    const activeSales = sales.filter((s: any) => !s.is_cancelled)
    const cancelledSales = sales.filter((s: any) => s.is_cancelled)

    const totalSalesSum = activeSales.reduce((acc: number, s: any) => acc + (s.sum || 0), 0)
    // Calculate quantity from positions
    if (activeSales.length > 0) {
        const sampleSaleId = activeSales[0].moy_sklad_id
        console.log(`Checking positions for sale ID: ${sampleSaleId}`)
        const { data: samplePositions } = await supabase
            .from('sales_positions')
            .select('*')
            .eq('sales_doc_id', sampleSaleId)
        console.log(`Positions for sample sale: ${samplePositions?.length}`)
    }

    const { data: positions, error: posError } = await supabase
        .from('sales_positions')
        .select('quantity, sales_doc_id, product_id')
        .in('sales_doc_id', activeSales.map((s: any) => s.moy_sklad_id))

    if (posError) {
        console.error('Error fetching positions:', posError)
    } else {
        console.log(`Fetched ${positions?.length} positions.`)
    }

    const totalSalesQty = positions?.reduce((acc: number, p: any) => acc + (p.quantity || 0), 0) || 0

    // Debug specific bundle sale
    const debugSaleId = 'c27bb9b7-d11b-11f0-0a80-09f7002090a2'
    const debugPositions = positions?.filter((p: any) => p.sales_doc_id === debugSaleId)
    if (debugPositions?.length > 0) {
        console.log(`Debug Sale 09388 Positions:`, debugPositions)
        const prodIds = debugPositions.map((p: any) => p.product_id)
        const { data: debugProds } = await supabase.from('products').select('*').in('id', prodIds)
        console.log(`Debug Sale 09388 Products:`, debugProds)
    }

    // Check for sales with bundles
    // We need to fetch product info for positions
    const { data: products } = await supabase
        .from('products')
        .select('id, is_bundle, name')
        .in('id', positions?.map((p: any) => p.product_id) || [])

    const productMap = new Map(products?.map((p: any) => [p.id, p]))

    const bundleSales = new Set()
    positions?.forEach((p: any) => {
        const prod = productMap.get(p.product_id)
        if (prod?.is_bundle) {
            bundleSales.add(p.sales_doc_id)
        }
    })

    if (bundleSales.size > 0) {
        console.log(`\n--- Sales with Bundles (${bundleSales.size}) ---`)
        const bundleSalesList = activeSales.filter((s: any) => bundleSales.has(s.moy_sklad_id))
        let bundleSum = 0
        let bundleQty = 0
        bundleSalesList.forEach((s: any) => {
            const sPositions = positions?.filter((p: any) => p.sales_doc_id === s.moy_sklad_id)
            const sQty = sPositions?.reduce((acc: number, p: any) => acc + (p.quantity || 0), 0) || 0
            console.log(`${s.name} - Sum: ${s.sum} - Qty: ${sQty} - UUID: ${s.moy_sklad_id}`)
            bundleSum += (s.sum || 0)
            bundleQty += sQty
        })
        console.log(`Total Bundle Sales Sum: ${bundleSum}`)
        console.log(`Total Bundle Sales Qty: ${bundleQty}`)
    }

    // Check for sales with no positions
    const salesWithPositions = new Set(positions?.map((p: any) => p.sales_doc_id))
    const salesWithoutPositions = activeSales.filter((s: any) => !salesWithPositions.has(s.moy_sklad_id))

    if (salesWithoutPositions.length > 0) {
        console.log(`\n--- Sales with NO positions (${salesWithoutPositions.length}) ---`)
        salesWithoutPositions.forEach((s: any) => console.log(`${s.name} - Sum: ${s.sum} - UUID: ${s.moy_sklad_id}`))
    }


    const totalReturnsSum = returns.reduce((acc: number, r: any) => acc + (r.sum || 0), 0)
    // Note: Returns usually don't have quantity in the main table easily accessible without positions, 
    // but for "Sum" comparison we focus on money. 
    // If we need quantity of returns, we might need to fetch positions or assume 1 return = ? 
    // But usually "Sales Quantity" in reports is (Sold Qty - Returned Qty).
    // Let's check if we have quantity in sales_returns. 
    // The sync script didn't seem to put quantity in sales_returns main table? 
    // Let's check the schema or sync script again. 
    // In sync-fix.ts -> syncSalesReturns -> upsert -> no quantity field.

    // So for now, let's just look at the Sum.

    const netSum = totalSalesSum - totalReturnsSum

    console.log('--- Results ---')
    console.log(`Total Active Sales Count: ${activeSales.length}`)
    console.log(`Total Cancelled Sales Count: ${cancelledSales.length}`)
    console.log(`Total Active Sales Sum: ${totalSalesSum.toFixed(2)}`)
    console.log(`Total Active Sales Quantity: ${totalSalesQty}`)
    console.log(`Total Returns Count: ${returns.length}`)
    console.log(`Total Returns Sum: ${totalReturnsSum.toFixed(2)}`)
    console.log(`Net Sum (Sales - Returns): ${netSum.toFixed(2)}`)

    console.log('\n--- Cancelled Sales ---')
    cancelledSales.forEach((s: any) => console.log(`${s.name}: ${s.sum}`))

}

checkCurrentMonthSales()
