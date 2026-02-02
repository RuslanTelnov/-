
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
      product:products (
        name,
        article,
        sale_price,
        buy_price,
        price
      )
    `)
        .eq('store_id', storeId)
        .gt('reserve', 0)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Items with Sale Price < Buy Price or Low Sale Price:')
    const suspicious = stockItems.filter(i => {
        const p = i.product as any
        const sale = p.sale_price || 0
        const buy = p.buy_price || 0
        return sale < buy || sale < 100
    })

    if (suspicious.length === 0) {
        console.log('No suspicious prices found.')
    } else {
        console.table(suspicious.map(i => ({
            name: (i.product as any).name,
            reserve: i.reserve,
            sale: (i.product as any).sale_price,
            buy: (i.product as any).buy_price,
            price: (i.product as any).price
        })))
    }
}

main()
