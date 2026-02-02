
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

    const itemsToCheck = [
        'Новогодняя елка С ягодами и шишками разборная 180 см, d нижних веток 100 см',
        'Варежки размер универсальный белый',
        'Косметичка искусственная кожа, экокожа 12X16 см'
    ]

    const { data: stockItems, error } = await supabase
        .from('stock')
        .select(`
      stock,
      reserve,
      product:products (
        name,
        article,
        sale_price
      )
    `)
        .eq('store_id', storeId)
        .in('product.name', itemsToCheck) // This won't work directly with joined table filtering in Supabase JS client easily for array

    // Instead, fetch all and filter in JS or use separate queries. 
    // Better to search products first to get IDs.

    const { data: products } = await supabase
        .from('products')
        .select('id, name, article, sale_price')
        .in('name', itemsToCheck)

    if (!products) {
        console.log('Products not found')
        return
    }

    console.log('Products found:', products.length)
    console.table(products)

    const productIds = products.map(p => p.id)

    const { data: stocks } = await supabase
        .from('stock')
        .select('product_id, stock, reserve')
        .eq('store_id', storeId)
        .in('product_id', productIds)

    console.log('Stocks found:')
    const combined = stocks?.map(s => {
        const p = products.find(p => p.id === s.product_id)
        return {
            name: p?.name,
            article: p?.article,
            stock: s.stock,
            reserve: s.reserve,
            price: p?.sale_price
        }
    })

    console.table(combined)
}

main()
