
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { sendTelegramMessage } from '../lib/notifications/telegram'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function generateAlerts() {
    console.log('🔔 Starting Alert Generation...')
    let newAlertsCount = 0

    // 1. Critical Stock Alerts
    // We can reuse data from procurement_recommendations where priority = 'critical'
    console.log('Checking Critical Stock...')
    const { data: criticalItems } = await supabase
        .from('procurement_recommendations')
        .select('product_id, recommended_qty, days_until_stockout, product:products(name, article)')
        .eq('priority', 'critical')
        .gt('recommended_qty', 0)

    if (criticalItems && criticalItems.length > 0) {
        console.log(`Found ${criticalItems.length} critical items.`)

        // Group into one summary alert if too many, or individual if few?
        // Let's create one summary alert for the dashboard, and maybe individual for DB?
        // Actually, let's create one "Critical Stock Report" alert.

        const message = `🚨 Критический остаток: ${criticalItems.length} товаров требуют срочной закупки.`
        const data = { count: criticalItems.length, items: criticalItems.slice(0, 5).map(i => (i.product as any)?.name || 'Неизвестно') } // Store top 5 names

        await createAlert('critical_stock', message, data)
    }

    // 2. Sales Anomalies
    console.log('Checking Sales Anomalies...')
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 45)

    const { data: salesData } = await supabase
        .from('sales')
        .select('product_id, moment, quantity')
        .gte('moment', thirtyDaysAgo.toISOString())
        .order('moment', { ascending: true })

    if (salesData && salesData.length > 0) {
        const productSales = new Map<string, { total: number, days: Set<string>, daily: Map<string, number> }>()

        salesData.forEach(sale => {
            if (!productSales.has(sale.product_id)) {
                productSales.set(sale.product_id, { total: 0, days: new Set(), daily: new Map() })
            }
            const entry = productSales.get(sale.product_id)!
            entry.total += sale.quantity
            const day = sale.moment.split('T')[0]
            entry.days.add(day)
            entry.daily.set(day, (entry.daily.get(day) || 0) + sale.quantity)
        })

        const anomalies = []
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        for (const [productId, stats] of productSales.entries()) {
            const avgDaily = stats.total / 30 // Simple average over 30 days
            const yesterdaySales = stats.daily.get(yesterdayStr) || 0

            // Check for spike (only if avg > 1 to avoid noise)
            if (avgDaily > 1 && yesterdaySales > avgDaily * 1.5) {
                // Fetch product name
                const { data: p } = await supabase.from('products').select('name').eq('id', productId).single()
                anomalies.push({ name: p?.name || 'Неизвестно', type: 'spike', val: yesterdaySales, avg: avgDaily.toFixed(1) })
            }
            // Check for drop (only if avg > 2)
            if (avgDaily > 2 && yesterdaySales < avgDaily * 0.5) {
                const { data: p } = await supabase.from('products').select('name').eq('id', productId).single()
                anomalies.push({ name: p?.name || 'Неизвестно', type: 'drop', val: yesterdaySales, avg: avgDaily.toFixed(1) })
            }
        }

        if (anomalies.length > 0) {
            console.log(`Found ${anomalies.length} sales anomalies.`)
            const message = `📉 Аномалии продаж: ${anomalies.length} товаров с резким изменением спроса.`
            const data = { count: anomalies.length, items: anomalies.slice(0, 5).map(i => `${i.name} (${i.type === 'spike' ? '⬆️' : '⬇️'})`) }
            await createAlert('sales_anomaly', message, data)
        }
    }

    // 3. Margin Issues
    console.log('Checking Margin Issues...')
    const { data: products } = await supabase
        .from('products')
        .select('id, name, article, price, cost_price')
        .gt('cost_price', 0)

    const lowMarginItems = products?.filter(p => p.price < p.cost_price) || []

    if (lowMarginItems.length > 0) {
        console.log(`Found ${lowMarginItems.length} items with negative margin.`)
        const message = `⚠️ Отрицательная маржа: ${lowMarginItems.length} товаров продаются ниже себестоимости.`
        const data = { count: lowMarginItems.length, items: lowMarginItems.slice(0, 5).map(i => i.name) }
        await createAlert('margin_issue', message, data)
    }

    // 4. Stagnant Stock
    console.log('Checking Stagnant Stock...')

    // Fetch active products from profit_by_product (last 30 days sales)
    const { data: activeProducts } = await supabase
        .from('profit_by_product')
        .select('product_id')
        .gt('sell_quantity', 0)

    const activeProductIds = new Set(activeProducts?.map(p => p.product_id))
    console.log(`Found ${activeProductIds.size} active products (with sales in last 30 days).`)

    // Fetch all stock > 0 for Main Warehouse ONLY
    // Main Warehouse ID: d9b1edb8-4508-43e4-909b-2599a6502241
    const MAIN_WAREHOUSE_ID = 'd9b1edb8-4508-43e4-909b-2599a6502241'

    const { data: stockItems } = await supabase
        .from('stock')
        .select('product_id, stock, store_id')
        .gt('stock', 0)
        .eq('store_id', MAIN_WAREHOUSE_ID)

    if (stockItems && stockItems.length > 0) {
        // Fetch product details for stock items in batches
        const productIds = Array.from(new Set(stockItems.map(s => s.product_id)))
        let allProducts: any[] = []
        const batchSize = 100

        for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize)
            const { data: productsBatch } = await supabase
                .from('products')
                .select('id, name, article, cost_price')
                .in('id', batch)

            if (productsBatch) {
                allProducts = allProducts.concat(productsBatch)
            }
        }

        const productMap = new Map(allProducts.map(p => [p.id, p]))
        const stagnantItems: any[] = []

        for (const item of stockItems) {
            const product = productMap.get(item.product_id)
            if (!product) continue

            // Check if product is active
            if (!activeProductIds.has(item.product_id)) {
                stagnantItems.push({
                    name: product.name,
                    stock: item.stock,
                    cost_price: product.cost_price || 0,
                    value: (item.stock * (product.cost_price || 0))
                })
            }
        }

        // Group by name/article to avoid duplicates from multiple stores
        const uniqueStagnantMap = new Map()
        stagnantItems.forEach(item => {
            if (!uniqueStagnantMap.has(item.name)) {
                uniqueStagnantMap.set(item.name, { ...item })
            } else {
                const existing = uniqueStagnantMap.get(item.name)
                existing.stock += item.stock
                existing.value += item.value
            }
        })

        const uniqueStagnantItems = Array.from(uniqueStagnantMap.values())

        if (uniqueStagnantItems.length > 0) {
            console.log(`Found ${uniqueStagnantItems.length} stagnant items.`)
            const message = `📦 Застой товара: ${uniqueStagnantItems.length} товаров не продавались более 30 дней.`

            const data = {
                count: uniqueStagnantItems.length,
                items: uniqueStagnantItems.slice(0, 5).map(i => i.name),
                all_items: uniqueStagnantItems
            }
            await createAlert('stagnant_stock', message, data)
        }
    }

    console.log(`✅ Alert generation complete. New alerts: ${newAlertsCount}`)
}

async function createAlert(type: string, message: string, data: any) {
    // Check if a similar unread alert exists to avoid spam
    const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('type', type)
        .eq('is_read', false)
        .eq('message', message) // Simple de-duplication
        .single()

    if (existing) {
        console.log(`Skipping duplicate alert: ${type}`)
        return
    }

    const { error } = await supabase
        .from('alerts')
        .insert({
            type,
            message,
            data
        })

    if (error) {
        console.error('Error creating alert:', error)
    } else {
        console.log(`Created alert: ${message}`)
        // Send Telegram
        await sendTelegramMessage(message)
    }
}

generateAlerts()
