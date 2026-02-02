
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Copy of getWarehouseName
const getWarehouseName = (storeName: string): string => {
    if (!storeName || storeName.trim() === '') return 'Основной склад'
    const name = storeName.toLowerCase().trim()
    if (name.includes('китай') || name.includes('china') || name.includes('cn') || name.includes('chinese') || name.includes('кит') || name.includes('cn-')) return 'Склад Китай'
    if (name.includes('предзаказ') || name.includes('preorder') || name.includes('pre-order') || name.includes('пред') || name.includes('резерв') || name.includes('reserve')) return 'Склад предзаказов'
    if (name.includes('транзит') || name.includes('transit')) return 'Склад транзит'
    if (name.includes('в пути') || name.includes('доставка') || name.includes('delivery') || name.includes('в дороге')) return 'Склад транзит'
    if (name === 'основной склад' || name === 'main warehouse') return 'Основной склад'
    return 'Прочие'
}

async function auditDashboard() {
    console.log('📊 Starting Comprehensive Dashboard Audit...\n')

    // 1. Finance
    console.log('--- 1. Finance ---')
    const { data: money } = await supabase
        .from('money_by_account')
        .select('balance, income, outcome, period_end')
        .order('period_end', { ascending: false })
        .limit(1)

    if (money && money.length > 0) {
        console.log(`Balance: ${money[0].balance.toLocaleString()} ₸`)
        console.log(`Income: ${money[0].income.toLocaleString()} ₸`)
        console.log(`Outcome: ${money[0].outcome.toLocaleString()} ₸`)
        console.log(`Period End: ${money[0].period_end}`)
    } else {
        console.log('❌ No finance data found in money_by_account')
    }
    console.log('')

    // 2. Average Margin
    console.log('--- 2. Average Margin ---')
    const { data: profit } = await supabase
        .from('profit_by_product')
        .select('sell_sum, sell_cost_sum')
        .gt('sell_sum', 0)

    if (profit && profit.length > 0) {
        const totalRevenue = profit.reduce((sum, item) => sum + (item.sell_sum || 0), 0)
        const totalCost = profit.reduce((sum, item) => sum + (item.sell_cost_sum || 0), 0)
        const totalProfit = totalRevenue - totalCost
        const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

        console.log(`Total Revenue (Profit Table): ${totalRevenue.toLocaleString()} ₸`)
        console.log(`Total Cost (Profit Table): ${totalCost.toLocaleString()} ₸`)
        console.log(`Total Profit: ${totalProfit.toLocaleString()} ₸`)
        console.log(`Calculated Margin: ${margin.toFixed(2)}%`)
        console.log(`Records analyzed: ${profit.length}`)
    } else {
        console.log('❌ No profit data found')
    }
    console.log('')

    // 3. Stock Value & Quantity by Warehouse
    console.log('--- 3. Stock Value & Quantity ---')

    // Fetch necessary data
    const { data: stores } = await supabase.from('stores').select('id, name')
    const { data: stock } = await supabase.from('stock').select('*')
    const { data: products } = await supabase.from('products').select('id, cost_price, sale_price, price')

    if (!stores || !stock || !products) {
        console.log('❌ Error fetching stock data')
        return
    }

    const storesMap = new Map(stores.map(s => [s.id, s]))
    const productsMap = new Map(products.map(p => [p.id, p]))

    const warehouses: Record<string, { qty: number; value: number }> = {
        'Склад Китай': { qty: 0, value: 0 },
        'Основной склад': { qty: 0, value: 0 },
        'Склад предзаказов': { qty: 0, value: 0 },
        'Склад транзит': { qty: 0, value: 0 },
        'Прочие': { qty: 0, value: 0 }
    }

    stock.forEach(item => {
        const store = storesMap.get(item.store_id)
        const warehouseName = store ? getWarehouseName(store.name) : 'Прочие'
        const product = productsMap.get(item.product_id)

        if (!product) return

        let qty = item.stock || 0
        let price = 0

        // Logic from Dashboard.tsx
        if (warehouseName === 'Склад предзаказов') {
            qty = item.reserve || 0 // Use reserve for Preorder
            price = product.sale_price || product.price || 0
        } else {
            // Use stock cost_price if available, else product cost_price
            price = item.cost_price ?? product.cost_price ?? 0
        }

        if (qty > 0) {
            if (warehouses[warehouseName]) {
                warehouses[warehouseName].qty += qty
                warehouses[warehouseName].value += qty * price
            } else {
                warehouses['Прочие'].qty += qty
                warehouses['Прочие'].value += qty * price
            }
        }
    })

    Object.entries(warehouses).forEach(([name, data]) => {
        console.log(`${name}:`)
        console.log(`  Qty: ${data.qty}`)
        console.log(`  Value: ${data.value.toLocaleString()} ₸`)
    })
    console.log('')

    // 4. Top Assets (Top 5 by Value)
    console.log('--- 4. Top Assets (by Value) ---')
    // We need to aggregate by product across all warehouses (or just Main?)
    // Usually Top Assets is global or Main Warehouse. Let's assume Main Warehouse for now as it's most common.
    // Actually, let's calculate global stock value per product.

    const productStats = new Map<string, number>() // productId -> totalValue

    stock.forEach(item => {
        const product = productsMap.get(item.product_id)
        if (!product) return

        const store = storesMap.get(item.store_id)
        const warehouseName = store ? getWarehouseName(store.name) : 'Прочие'

        // Skip Preorder for asset valuation? Usually yes, but let's include everything for now
        // Or maybe strictly follow Dashboard logic?
        // Dashboard doesn't seem to have a "Top Assets" list in the code I saw.
        // But let's calculate global value.

        let qty = item.stock || 0
        let price = item.cost_price ?? product.cost_price ?? 0

        if (qty > 0) {
            const val = qty * price
            productStats.set(item.product_id, (productStats.get(item.product_id) || 0) + val)
        }
    })

    // Sort
    const sortedAssets = [...productStats.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

    for (const [pid, val] of sortedAssets) {
        const { data: p } = await supabase.from('products').select('name').eq('id', pid).single()
        console.log(`  ${p?.name}: ${val.toLocaleString()} ₸`)
    }
}

auditDashboard()
