
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const storeId = 'f31dd68f-8884-11f0-0a80-17bb000326ec' // Склад Предзаказ

    console.log('Fetching stock for Preorder Warehouse...')

    const { data: stockItems, error } = await supabase
        .from('stock')
        .select(`
      stock,
      reserve,
      cost_price,
      product:products (
        id,
        name,
        article,
        price,
        sale_price,
        cost_price
      )
    `)
        .eq('store_id', storeId)
        .gt('reserve', 0)

    if (error) {
        console.error('Error fetching stock:', error)
        return
    }

    console.log(`Found ${stockItems.length} items with reserve > 0`)

    let totalReserve = 0
    let totalValue = 0
    let items = []

    for (const item of stockItems) {
        const product = item.product as any
        const reserve = item.reserve || 0

        // Logic from Dashboard.tsx
        const price = parseFloat(product.sale_price || product.price || 0)
        const value = reserve * price

        totalReserve += reserve
        totalValue += value

        items.push({
            name: product.name,
            article: product.article,
            reserve,
            priceUsed: price,
            value,
            dbCost: item.cost_price,
            prodSale: product.sale_price,
            prodPrice: product.price
        })
    }

    // Sort by value desc
    items.sort((a, b) => b.value - a.value)

    console.log('Top 20 items by reserve value:')
    console.table(items.slice(0, 20))

    console.log('--------------------------------------------------')
    console.log(`Total Reserve Quantity: ${totalReserve}`)
    console.log(`Total Reserve Value: ${totalValue.toLocaleString('ru-RU')} ₸`)
    console.log('--------------------------------------------------')

    // Check for items with 0 price
    const zeroPriceItems = items.filter(i => i.priceUsed === 0)
    if (zeroPriceItems.length > 0) {
        console.log('⚠️ Items with 0 price used:')
        console.table(zeroPriceItems)
    }
}

main()
