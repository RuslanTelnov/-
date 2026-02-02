
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSystemHealth() {
    console.log('🏥 Starting Full System Health Check...\n')

    // 1. Products
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, cost_price, sale_price, buy_price, kaspi_price, archived')

    if (prodError) console.error('❌ Products Error:', prodError.message)
    else {
        const active = products.filter(p => !p.archived)
        const missingCost = active.filter(p => !p.cost_price || p.cost_price === 0)
        console.log('📦 Products:')
        console.log(`   - Total: ${products.length}`)
        console.log(`   - Active: ${active.length}`)
        console.log(`   - Missing Cost: ${missingCost.length}`)
        console.log(`   - Has Kaspi Price: ${active.filter(p => p.kaspi_price > 0).length}`)
    }

    // 2. Stock
    const { data: stock, error: stockError } = await supabase
        .from('stock')
        .select('*')

    if (stockError) console.error('❌ Stock Error:', stockError.message)
    else {
        const totalQty = stock.reduce((sum, item) => sum + (item.quantity || item.stock || 0), 0)
        const totalCost = stock.reduce((sum, item) => sum + (item.cost_price || 0) * (item.quantity || item.stock || 0), 0)
        console.log('\n🏭 Stock:')
        console.log(`   - Total Records: ${stock.length}`)
        console.log(`   - Total Quantity: ${totalQty}`)
        console.log(`   - Total Value (approx): ${Math.round(totalCost).toLocaleString()} ₸`)
        console.log(`   - Missing Store ID: ${stock.filter(s => !s.store_id).length}`)
    }

    // 3. Sales
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sum, moment')
        .order('moment', { ascending: false })
        .limit(1)

    const { count: salesCount } = await supabase.from('sales').select('*', { count: 'exact', head: true })

    if (salesError) console.error('❌ Sales Error:', salesError.message)
    else {
        console.log('\n💰 Sales:')
        console.log(`   - Total Transactions: ${salesCount}`)
        console.log(`   - Last Transaction: ${sales[0]?.moment || 'Never'}`)
    }

    // 4. Profit
    const { count: profitCount } = await supabase.from('profit_by_product').select('*', { count: 'exact', head: true })
    console.log('\n📈 Profit Metrics:')
    console.log(`   - Profit Records: ${profitCount}`)

    // 5. Schema Check for "Days in Stock"
    // We can't easily check schema via JS client without admin API, but we can check if we have data
    // Let's check if 'stock' table has 'stock_days' or similar
    // Actually, we'll check via SQL tool later if needed, but let's check if we can select it
    const { data: stockSample, error: schemaError } = await supabase
        .from('stock')
        .select('stock_days')
        .limit(1)

    console.log('\n🗓️ Days in Stock:')
    if (schemaError) {
        console.log(`   - ❌ Column 'stock_days' likely missing in 'stock' table: ${schemaError.message}`)
    } else {
        console.log(`   - ✅ Column 'stock_days' exists`)
    }
}

checkSystemHealth()
