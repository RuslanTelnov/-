
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper from warehouse.ts
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

// Calculator helper
const Calculator = {
    calculateTotalValue: (qty: number, price: number) => qty * price
}

async function simulateDashboard() {
    console.log('🚀 Simulating Dashboard Logic (Full Promise.all)...')

    try {
        const results = await Promise.all([
            // 1. Total Products
            supabase.from('stock')
                .select('product_id', { count: 'exact', head: true })
                .eq('store_id', 'd9b1edb8-4508-43e4-909b-2599a6502241')
                .gt('stock', 0),
            // 2. Total Sales Count
            supabase.from('sales').select('*', { count: 'exact', head: true }),
            // 3. Sales Data
            supabase.from('sales').select('sum').order('moment', { ascending: false }).limit(100),
            // 4. Low Stock
            supabase.from('stock')
                .select('product_id')
                .eq('store_id', 'd9b1edb8-4508-43e4-909b-2599a6502241')
                .lt('stock', 10)
                .gt('stock', 0),
            // 5. Metrics
            supabase.from('product_metrics').select('*').order('priority_score', { ascending: false }).limit(100),
            // 6. Stores
            supabase.from('stores').select('*').order('name'),
            // 7. Stock
            supabase.from('stock').select('*'),
            // 8. Products
            supabase.from('products').select('id, article, name, price, sale_price, buy_price, cost_price, kaspi_price, archived, category, image_url, weight, volume'),
            // 9. Payments In
            supabase.from('payments_in').select('sum'),
            // 10. Payments Out
            supabase.from('payments_out').select('sum'),
            // 11. Money By Account
            supabase.from('money_by_account').select('balance, income, outcome').order('period_end', { ascending: false }).limit(1),
            // 12. Profit
            supabase.from('profit_by_product').select('sell_sum, sell_cost_sum, sales_margin').gt('sell_sum', 0),
            // 13. Missing Cost
            supabase.from('products').select('id, article, name, cost_price, sale_price').eq('cost_price', 0).eq('archived', false),
        ])

        console.log('✅ Promise.all succeeded!')

        results.forEach((res, index) => {
            if (res.error) {
                console.error(`❌ Query ${index + 1} failed:`, res.error)
            } else {
                console.log(`✅ Query ${index + 1} success. Data length: ${res.data?.length ?? 'N/A'}, Count: ${res.count ?? 'N/A'}`)
            }
        })

    } catch (error) {
        console.error('❌ Promise.all failed:', error)
    }
}

simulateDashboard()
