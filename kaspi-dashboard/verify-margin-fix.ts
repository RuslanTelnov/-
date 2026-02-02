import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyMarginCalculation() {
    // Fetch a few items with sales
    const { data: items } = await supabase
        .from('profit_by_product')
        .select('*')
        .gt('sell_quantity', 0)
        .limit(5)

    if (!items) return

    console.log('Verifying Manual Margin Calculation:')
    items.forEach(item => {
        const revenue = item.sell_sum || 0
        const cost = item.sell_cost_sum || 0
        const profit = revenue - cost

        // This is the formula I implemented in the UI
        const margin = revenue ? (profit / revenue) * 100 : 0

        console.log(`\nProduct: ${item.article}`)
        console.log(`Revenue: ${revenue}, Cost: ${cost}, Profit: ${profit}`)
        console.log(`Calculated Margin: ${margin.toFixed(1)}%`)

        if (margin > 100) {
            console.error('❌ Margin > 100% (Should not happen with Profit/Revenue formula unless cost is negative)')
        } else {
            console.log('✅ Margin <= 100%')
        }
    })
}

verifyMarginCalculation()
