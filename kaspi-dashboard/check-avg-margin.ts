import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAvgMargin() {
    console.log('--- Checking Average Margin Logic ---')

    // 1. Current Logic: Arithmetic Mean of Stock Items
    // We need stock and products
    const { data: stock } = await supabase.from('stock').select('*')
    const { data: products } = await supabase.from('products').select('*')

    if (!stock || !products) {
        console.error('Failed to fetch stock or products')
        return
    }

    const productsMap = new Map(products.map(p => [p.id, p]))

    let totalMarginSum = 0
    let count = 0
    let zeroCostCount = 0

    // For Weighted Stock Margin
    let totalStockRevenue = 0
    let totalStockCost = 0

    stock.forEach(item => {
        if (item.quantity <= 0) return
        const product = productsMap.get(item.product_id)
        if (!product) return

        const salePrice = product.sale_price || 0
        const costPrice = product.cost_price || product.buy_price || 0

        if (salePrice > 0) {
            // Current Logic
            const margin = ((salePrice - costPrice) / salePrice) * 100
            totalMarginSum += margin
            count++

            if (costPrice === 0) zeroCostCount++

            // Weighted Logic
            totalStockRevenue += salePrice * item.quantity
            totalStockCost += costPrice * item.quantity
        }
    })

    const arithmeticAvg = count ? totalMarginSum / count : 0
    const weightedStockAvg = totalStockRevenue ? ((totalStockRevenue - totalStockCost) / totalStockRevenue) * 100 : 0

    console.log(`\n1. STOCK BASED (Current Implementation):`)
    console.log(`Count: ${count}`)
    console.log(`Zero Cost Items: ${zeroCostCount} (These give 100% margin)`)
    console.log(`Arithmetic Mean (Current): ${arithmeticAvg.toFixed(2)}%`)
    console.log(`Weighted Average (Potential): ${weightedStockAvg.toFixed(2)}%`)


    // 2. Sales Based (Real Performance)
    // We use profit_by_product table which aggregates sales
    const { data: profitData } = await supabase.from('profit_by_product').select('*')

    if (profitData) {
        let totalSalesRevenue = 0
        let totalSalesCost = 0
        let totalSalesMarginSum = 0
        let salesCount = 0

        profitData.forEach(item => {
            const revenue = item.sell_sum || 0
            const cost = item.sell_cost_sum || 0

            if (revenue > 0) {
                totalSalesRevenue += revenue
                totalSalesCost += cost

                const margin = ((revenue - cost) / revenue) * 100
                totalSalesMarginSum += margin
                salesCount++
            }
        })

        const weightedSalesAvg = totalSalesRevenue ? ((totalSalesRevenue - totalSalesCost) / totalSalesRevenue) * 100 : 0
        const arithmeticSalesAvg = salesCount ? totalSalesMarginSum / salesCount : 0

        console.log(`\n2. SALES BASED (Real Performance):`)
        console.log(`Weighted Average (Real): ${weightedSalesAvg.toFixed(2)}%`)
        console.log(`Arithmetic Mean (Real): ${arithmeticSalesAvg.toFixed(2)}%`)
    }
}

checkAvgMargin()
