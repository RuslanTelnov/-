
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuration
const LEAD_TIME_DAYS = 14
const REVIEW_PERIOD_DAYS = 7
const SAFETY_STOCK_DAYS = 7
const TARGET_COVERAGE_DAYS = LEAD_TIME_DAYS + REVIEW_PERIOD_DAYS + SAFETY_STOCK_DAYS // 28 days

async function calculateProcurement() {
    console.log('🚀 Starting Procurement Calculation...')
    console.log(`Configuration: Lead Time=${LEAD_TIME_DAYS}, Review=${REVIEW_PERIOD_DAYS}, Safety=${SAFETY_STOCK_DAYS}`)

    // 1. Fetch Products with Cost Price
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, article, cost_price, sale_price')
        .eq('archived', false)

    if (prodError) throw prodError
    console.log(`📦 Found ${products.length} active products`)

    // 2. Fetch Sales (Last 30 Days) from profit_by_product
    // This table contains aggregated sales for the period.
    // We assume the latest sync covers the last 30 days.

    const { data: profitData, error: profitError } = await supabase
        .from('profit_by_product')
        .select('product_id, sell_quantity, period_end')
        .order('period_end', { ascending: false })

    if (profitError) throw profitError

    // Group by product (take the most recent period if multiple)
    const salesMap = new Map<string, number>()
    const processedProducts = new Set<string>()

    profitData.forEach(item => {
        if (processedProducts.has(item.product_id)) return

        salesMap.set(item.product_id, item.sell_quantity || 0)
        processedProducts.add(item.product_id)
    })

    // 3. Fetch Stock (Main + Transit)
    // We need to know which stores are "Main" and "Transit".
    // For now, let's sum ALL stock for the product.
    // Ideally, we should exclude "Defect" or "Return" warehouses if they exist.
    // Based on previous audit: "Склад брака" (Defect) exists.

    // Let's fetch all stock and filter in JS
    const { data: stockItems, error: stockError } = await supabase
        .from('stock')
        .select('product_id, stock, store_id')

    if (stockError) throw stockError

    // Fetch stores to identify types
    const { data: stores } = await supabase.from('stores').select('id, name')
    const defectStoreIds = stores?.filter(s => s.name.toLowerCase().includes('брак')).map(s => s.id) || []

    const stockMap = new Map<string, number>()
    stockItems.forEach(item => {
        if (defectStoreIds.includes(item.store_id)) return // Skip defect stock

        const current = stockMap.get(item.product_id) || 0
        stockMap.set(item.product_id, current + item.stock)
    })

    // 4. Calculate Recommendations
    const recommendations = []

    for (const product of products) {
        const totalSales30d = salesMap.get(product.id) || 0
        const avgDailySales = totalSales30d / 30
        const currentStock = stockMap.get(product.id) || 0

        // If no sales and no stock, skip? Or recommend if it's a new product?
        // For now, if avgDailySales is 0, we can't recommend anything based on velocity.
        if (avgDailySales === 0 && currentStock === 0) continue

        let daysUntilStockout = 999
        if (avgDailySales > 0) {
            daysUntilStockout = currentStock / avgDailySales
        }

        const targetStockQty = avgDailySales * TARGET_COVERAGE_DAYS
        let recommendedQty = targetStockQty - currentStock

        // Round up to nearest integer
        recommendedQty = Math.ceil(recommendedQty)

        if (recommendedQty < 0) recommendedQty = 0

        // Determine Priority
        let priority = 'low'
        if (recommendedQty > 0) {
            if (daysUntilStockout < LEAD_TIME_DAYS) {
                priority = 'critical' // Will run out before delivery!
            } else if (daysUntilStockout < (LEAD_TIME_DAYS + REVIEW_PERIOD_DAYS)) {
                priority = 'high' // Will run out before NEXT delivery
            } else if (daysUntilStockout < TARGET_COVERAGE_DAYS) {
                priority = 'medium' // Below optimal level
            }
        }

        // Calculate Financials
        const unitCost = product.cost_price || 0
        const totalCost = recommendedQty * unitCost
        const expectedRevenue = recommendedQty * (product.sale_price || 0)
        const expectedProfit = expectedRevenue - totalCost

        recommendations.push({
            product_id: product.id,
            current_stock: currentStock,
            avg_daily_sales: avgDailySales,
            days_until_stockout: daysUntilStockout === 999 ? 9999 : daysUntilStockout, // Avoid Infinity for DB
            recommended_qty: recommendedQty,
            priority: priority,
            lead_time_days: LEAD_TIME_DAYS,
            review_period_days: REVIEW_PERIOD_DAYS,
            safety_stock_days: SAFETY_STOCK_DAYS,
            unit_cost: unitCost,
            total_cost: totalCost,
            expected_revenue: expectedRevenue,
            expected_profit: expectedProfit,
            calculated_at: new Date().toISOString()
        })
    }

    console.log(`💡 Generated ${recommendations.length} recommendations`)

    // 5. Upsert into DB
    if (recommendations.length > 0) {
        // Batch upsert (Supabase limit is usually high, but let's chunk if huge)
        const { error } = await supabase
            .from('procurement_recommendations')
            .upsert(recommendations, { onConflict: 'product_id' })

        if (error) {
            console.error('❌ Error saving recommendations:', error)
        } else {
            console.log('✅ Recommendations saved successfully')
        }
    }
}

calculateProcurement().catch(err => console.error('Fatal Error:', err))
