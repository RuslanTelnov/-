
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

    let totalReserve = 0
    let totalValue = 0
    let items = []

    for (const item of stockItems) {
        const product = item.product as any
        const reserve = item.reserve || 0

        const salePrice = parseFloat(product.sale_price || 0)
        const basePrice = parseFloat(product.price || 0)
        const price = salePrice || basePrice || 0

        const value = reserve * price

        totalReserve += reserve
        totalValue += value

        items.push({
            name: product.name,
            article: product.article,
            reserve,
            priceUsed: price,
            value,
            isSalePrice: !!salePrice,
            salePrice,
            basePrice
        })
    }

    // Sort by Name
    items.sort((a, b) => a.name.localeCompare(b.name))

    console.log('All items with reserve > 0:')
    console.table(items)

    console.log('--------------------------------------------------')
    console.log(`Total Reserve Quantity: ${totalReserve}`)
    console.log(`Total Reserve Value: ${totalValue.toLocaleString('ru-RU')} ₸`)
    console.log('--------------------------------------------------')
}

main()
