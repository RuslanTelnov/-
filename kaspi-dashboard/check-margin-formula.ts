import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMarginVsMarkup() {
    // Fetch a few items with sales
    const { data: items } = await supabase
        .from('profit_by_product')
        .select('*')
        .gt('sell_quantity', 0)
        .limit(5)

    if (!items) return

    console.log('Checking Margin vs Markup formulas:')
    items.forEach(item => {
        const revenue = item.sell_sum || 0
        const cost = item.sell_cost_sum || 0
        const profit = revenue - cost
        const msMargin = item.sales_margin || 0

        const calcMargin = revenue ? (profit / revenue) * 100 : 0
        const calcMarkup = cost ? (profit / cost) * 100 : 0

        console.log(`\nProduct: ${item.article}`)
        console.log(`Revenue: ${revenue}, Cost: ${cost}, Profit: ${profit}`)
        console.log(`MS Margin Field: ${msMargin} (displayed as ${(msMargin * 100).toFixed(1)}%)`)
        console.log(`Calc Margin (P/R): ${calcMargin.toFixed(1)}%`)
        console.log(`Calc Markup (P/C): ${calcMarkup.toFixed(1)}%`)

        if (Math.abs((msMargin * 100) - calcMarkup) < 1) {
            console.log('=> MS Field matches MARKUP formula')
        } else if (Math.abs((msMargin * 100) - calcMargin) < 1) {
            console.log('=> MS Field matches MARGIN formula')
        } else {
            console.log('=> MS Field matches NEITHER (or is raw ratio)')
            // Check raw ratio
            if (Math.abs(msMargin - calcMarkup / 100) < 0.01) {
                console.log('=> MS Field is MARKUP ratio')
            } else if (Math.abs(msMargin - calcMargin / 100) < 0.01) {
                console.log('=> MS Field is MARGIN ratio')
            }
        }
    })
}

checkMarginVsMarkup()
