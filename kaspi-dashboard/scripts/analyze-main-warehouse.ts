
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeMainWarehouse() {
    console.log('🔍 Analyzing Main Warehouse Value...')

    // 1. Get Main Warehouse ID
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .ilike('name', '%основной%')

    if (storesError || !stores || stores.length === 0) {
        console.error('❌ Main warehouse not found')
        return
    }

    const mainStore = stores[0]
    console.log(`📦 Warehouse: ${mainStore.name} (${mainStore.id})`)

    // 2. Get Stock for this warehouse
    const { data: stockItems, error: stockError } = await supabase
        .from('stock')
        .select('product_id, stock, quantity')
        .eq('store_id', mainStore.id)
        .gt('quantity', 0) // Only items with positive quantity

    if (stockError || !stockItems) {
        console.error('❌ Error fetching stock:', stockError)
        return
    }

    console.log(`📊 Found ${stockItems.length} items with quantity > 0`)

    // 3. Get Products details
    const productIds = stockItems.map(item => item.product_id)
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, article, buy_price, sale_price')
        .in('id', productIds)

    if (productsError || !products) {
        console.error('❌ Error fetching products:', productsError)
        return
    }

    const productsMap = new Map(products.map(p => [p.id, p]))

    // 4. Calculate stats
    let totalValueBuy = 0
    let totalValueSale = 0
    let itemsWithZeroBuyPrice = 0
    let lostValuePotential = 0 // How much value is "lost" because buy_price is 0 (estimated using sale_price?)

    console.log('\n=== DETAILED BREAKDOWN ===')
    console.log('Top 5 items by value (Buy Price):')

    const detailedItems = stockItems.map(item => {
        const product = productsMap.get(item.product_id)
        if (!product) return null

        const qty = item.quantity || 0
        const buyPrice = product.buy_price || 0
        const salePrice = product.sale_price || 0

        const valueBuy = qty * buyPrice
        const valueSale = qty * salePrice

        totalValueBuy += valueBuy
        totalValueSale += valueSale

        if (buyPrice === 0) {
            itemsWithZeroBuyPrice++
            // Just for estimation, let's say cost is 50% of sale if buy is missing
            // This helps us guess if the missing 700k is here
        }

        return {
            name: product.name,
            article: product.article,
            qty,
            buyPrice,
            valueBuy
        }
    }).filter((item): item is NonNullable<typeof item> => item !== null).sort((a, b) => b.valueBuy - a.valueBuy)

    detailedItems.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (Art: ${item.article})`)
        console.log(`   Qty: ${item.qty} x ${item.buyPrice} = ${item.valueBuy.toLocaleString()} ₸`)
    })

    console.log('\n=== ZERO BUY PRICE ITEMS (Top 10 by Qty) ===')
    const zeroPriceItems = stockItems
        .map(item => {
            const product = productsMap.get(item.product_id)
            if (!product) return null
            return { ...product, qty: item.quantity }
        })
        .filter((p): p is NonNullable<typeof p> => !!p && (p.buy_price === 0 || p.buy_price === null))
        .sort((a, b) => (b.qty || 0) - (a.qty || 0))

    zeroPriceItems.slice(0, 10).forEach(item => {
        console.log(`- ${item.name} (Art: ${item.article})`)
        console.log(`   Qty: ${item.qty}, Buy Price: ${item.buy_price}, Sale Price: ${item.sale_price}`)
    })

    console.log('\n=== SUMMARY ===')
    console.log(`Total Items: ${stockItems.length}`)
    console.log(`Items with Zero Buy Price: ${itemsWithZeroBuyPrice}`)
    console.log(`Calculated Total Value (Buy Price): ${totalValueBuy.toLocaleString()} ₸`)
    console.log(`Calculated Total Value (Sale Price): ${totalValueSale.toLocaleString()} ₸`)
    console.log(`Target Value (User): 2,115,728 ₸`)
    console.log(`Difference: ${(2115728 - totalValueBuy).toLocaleString()} ₸`)
}

analyzeMainWarehouse()
