const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugOrderLogic() {
    console.log('🔍 Debugging Order Logic...')

    // 1. Check total items in view
    const { count, error: countError } = await supabase
        .from('product_analytics')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error('Error counting items:', countError)
        return
    }
    console.log(`Total items in product_analytics: ${count}`)

    // 2. Check items with sales in last 90 days
    const { data: sales90, error: salesError } = await supabase
        .from('product_analytics')
        .select('product_id, name, sales_last_90_days, current_stock')
        .gt('sales_last_90_days', 0)
        .limit(5)

    if (salesError) console.error('Error fetching sales90:', salesError)
    else console.log(`Sample items with sales > 0 (90 days):`, sales90)

    // 3. Check items that SHOULD be ordered (stock = 0 AND sales > 0)
    const { data: candidates, error: candError } = await supabase
        .from('product_analytics')
        .select('product_id, name, sales_last_90_days, current_stock, days_of_stock')
        .eq('current_stock', 0)
        .gt('sales_last_90_days', 0)

    if (candError) console.error('Error fetching candidates:', candError)
    else {
        console.log(`Found ${candidates?.length} candidates with Stock=0 and Sales(90d)>0:`)
        candidates?.forEach((c: any) => console.log(`- ${c.name}: Stock=${c.current_stock}, Sales90=${c.sales_last_90_days}, DaysStock=${c.days_of_stock}`))
    }

    // 4. Check items with low stock (days_of_stock < 14)
    const { data: lowStock, error: lowStockError } = await supabase
        .from('product_analytics')
        .select('product_id, name, sales_last_90_days, current_stock, days_of_stock')
        .lt('days_of_stock', 14)
        .gt('current_stock', 0) // Exclude 0 stock as we checked them above

    if (lowStockError) console.error('Error fetching low stock:', lowStockError)
    else {
        console.log(`Found ${lowStock?.length} candidates with Low Stock (<14 days):`)
        lowStock?.forEach((c: any) => console.log(`- ${c.name}: Stock=${c.current_stock}, Sales90=${c.sales_last_90_days}, DaysStock=${c.days_of_stock}`))
    }

}

debugOrderLogic()
