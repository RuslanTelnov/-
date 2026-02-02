
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function analyzeFilters() {
    const { data: analytics } = await supabase.from('product_analytics').select('*')

    if (!analytics) return

    let total = analytics.length
    let activeSales = 0
    let profitable = 0
    let needRestock = 0
    let final = 0

    for (const item of analytics) {
        const velocity = parseFloat(item.velocity_14_days || 0)
        if (velocity <= 0) continue
        activeSales++

        const costPrice = parseFloat(item.cost_price || 0)
        const kaspiPrice = item.kaspi_price ? parseFloat(item.kaspi_price) : null

        let isProfitable = false
        if (kaspiPrice && costPrice > 0) {
            const margin = kaspiPrice - costPrice
            const marginPercent = (margin / kaspiPrice) * 100
            if (marginPercent >= 30) isProfitable = true
        }

        if (!isProfitable) continue
        profitable++

        const currentStock = parseFloat(item.current_stock || 0)
        const daysOfStock = velocity > 0 ? currentStock / velocity : 999

        if (daysOfStock < 14) {
            needRestock++
            final++
        }
    }

    console.log(`Total Products: ${total}`)
    console.log(`With Sales (14 days): ${activeSales}`)
    console.log(`Profitable (>30%): ${profitable} (Lost ${activeSales - profitable} due to margin)`)
    console.log(`Need Restock (<14 days): ${needRestock}`)
    console.log(`Final List: ${final}`)
}

analyzeFilters()
