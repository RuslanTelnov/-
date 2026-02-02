
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client
// Note: In Next.js API routes, we should use the service role key if we need to bypass RLS or access views that might be restricted
// But for now, we'll try with the standard client if RLS allows, or service role if needed.
// Since we are in a server environment, we can use the service role key safely.
export async function GET(request: Request) {
    try {
        // Initialize Supabase client inside the handler to ensure fresh context/fetch
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: {
                fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
            }
        })

        const { searchParams } = new URL(request.url)
        const daysToCover = parseInt(searchParams.get('days') || '14', 10)

        console.log(`🤖 Generating order for ${daysToCover} days coverage...`)

        // 1. Fetch data from product_analytics view
        const { data: analytics, error } = await supabase
            .from('product_analytics')
            .select('*, kaspi_price, cost_price') // Explicitly select cost_price


        if (error) {
            console.error('Error fetching analytics:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!analytics || analytics.length === 0) {
            return NextResponse.json({ items: [], total_items: 0, total_cost: 0, message: 'No products found' })
        }

        // 2. Apply Logic
        const orderItems = []
        let totalCost = 0

        for (const item of analytics) {
            // Skip if archived (view already filters, but double check)

            // Logic:
            // Use 30-day velocity for more stable demand analysis (captures items sold > 2 weeks ago)
            const velocity = parseFloat(item.velocity_30_days || item.velocity_14_days || 0)

            const currentStock = parseFloat(item.current_stock ?? 0)

            // Calculate days of stock based on CURRENT velocity
            const daysOfStock = velocity > 0 ? currentStock / velocity : 999

            // Threshold: Show items with less than 21 days stock (1.5x of 14 days target)
            // This ensures we see items that are "getting low" not just "critical"
            const displayThreshold = daysToCover * 1.5

            if (daysOfStock < displayThreshold) {
                // Calculate needed quantity to reach daysToCover (14 days)
                // If we have 10 days stock, and want 14, we order 4 days worth.
                let neededQty = Math.ceil((velocity * daysToCover) - currentStock)

                // If neededQty is negative (we have enough for 14 days but less than 21),
                // we might still want to show it but with 0 recommended?
                // Or just show the gap?
                // Let's recommend topping up to daysToCover.
                if (neededQty <= 0) neededQty = 0 // Just show in list, but 0 order?
                // Actually user wants "list to order". So if neededQty <= 0, maybe exclude?
                // But user complained list is empty.
                // Let's set neededQty to at least 1 unit if it's close?
                // No, let's stick to strict "needed" for the *quantity*, but show the item.

                // If neededQty <= 0, it means we have > 14 days stock.
                // But we are inside daysOfStock < 21.
                // So these are "Low Priority" items.

                // Ensure we don't order negative
                if (neededQty <= 0) continue

                // Filter by margin > 30%
                const costPrice = parseFloat(item.cost_price || 0)
                const kaspiPrice = item.kaspi_price ? parseFloat(item.kaspi_price) : null

                // Strict filter: Must have price and margin > 30%
                let marginValue = 0
                let marginPercent = 0

                if (kaspiPrice && costPrice > 0) {
                    marginValue = kaspiPrice - costPrice
                    marginPercent = (marginValue / kaspiPrice) * 100

                    if (marginPercent < 30) continue
                } else {
                    // Exclude items with unknown price/margin
                    continue
                }

                // Optional: Minimum order quantity logic (e.g. round to nearest 5 or 10?)
                // For now, exact quantity.

                // Calculate Daily Profit (Profit Velocity)
                const dailyProfit = velocity * marginValue
                const estimatedItemCost = neededQty * costPrice

                // Determine priority
                let priority = 'medium'
                if (currentStock === 0) priority = 'critical'
                else if (daysOfStock < 3) priority = 'high'

                // Reason
                let reason = ''
                if (currentStock === 0) reason = 'Out of stock'
                else reason = `Stock covers only ${daysOfStock.toFixed(1)} days`

                orderItems.push({
                    product_id: item.product_id,
                    product_name: item.name,
                    article: item.article,
                    current_stock: currentStock,
                    avg_daily_sales: velocity, // Show the velocity used
                    days_of_stock: daysOfStock,
                    recommended_quantity: neededQty,
                    cost_price: costPrice,
                    estimated_cost: estimatedItemCost,
                    priority,
                    reason,
                    image_url: item.image_url,
                    sale_price: parseFloat(item.sale_price || 0),
                    kaspi_price: kaspiPrice,
                    margin: marginValue,
                    margin_percent: marginPercent,
                    daily_profit: dailyProfit // New field for sorting
                })

                totalCost += estimatedItemCost
            }
        }

        // Sort by Daily Profit (Profitability * Turnover)
        orderItems.sort((a, b) => b.daily_profit - a.daily_profit)

        return NextResponse.json({
            items: orderItems,
            total_items: orderItems.length,
            total_cost: totalCost,
            days_to_cover: daysToCover,
            generated_at: new Date().toISOString()
        })

    } catch (err: any) {
        console.error('Server error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
