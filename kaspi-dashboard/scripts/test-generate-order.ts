
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// We can't easily fetch the Next.js API route from a script without the server running and accessible.
// However, we can simulate the logic by importing the function if we refactor, OR we can just replicate the logic in this script to verify it produces expected results against the DB.
// Let's replicate the logic to verify the algorithm against real DB data.

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testGenerateOrder() {
    console.log('🧪 Testing Order Generation Logic...')
    const daysToCover = 14

    // 1. Fetch data
    const { data: analytics, error } = await supabase
        .from('product_analytics')
        .select('*')

    if (error) {
        console.error('❌ Error fetching analytics:', error)
        return
    }

    console.log(`Fetched ${analytics?.length} items`)

    // 2. Apply Logic
    const orderItems = []
    let totalCost = 0

    for (const item of analytics || []) {
        const avgDailySales = parseFloat(item.avg_daily_sales || 0)
        const currentStock = parseFloat(item.current_stock || 0)
        const daysOfStock = parseFloat(item.days_of_stock || 999)

        if (daysOfStock < daysToCover) {
            let neededQty = Math.ceil((avgDailySales * daysToCover) - currentStock)
            if (neededQty <= 0) continue

            const costPrice = parseFloat(item.cost_price || 0)
            const estimatedItemCost = neededQty * costPrice

            let priority = 'medium'
            if (currentStock === 0) priority = 'critical'
            else if (daysOfStock < 3) priority = 'high'

            orderItems.push({
                name: item.name,
                current: currentStock,
                daily: avgDailySales.toFixed(2),
                days: daysOfStock.toFixed(1),
                need: neededQty,
                priority
            })
            totalCost += estimatedItemCost
        }
    }

    // Sort
    orderItems.sort((a, b) => {
        const pScore = { critical: 3, high: 2, medium: 1 } as any
        return pScore[b.priority] - pScore[a.priority]
    })

    console.log(`✅ Generated Order: ${orderItems.length} items`)
    console.log(`💰 Total Estimated Cost: ${totalCost.toLocaleString()} ₸`)

    if (orderItems.length > 0) {
        console.log('📋 Top 5 Items to Order:')
        console.table(orderItems.slice(0, 5))
    } else {
        console.log('🎉 No items need reordering!')
    }
}

testGenerateOrder()
