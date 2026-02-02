
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
        article
      )
    `)
        .eq('store_id', storeId)
        .gt('reserve', 0)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Items with Reserve > Stock or Stock = 0:')
    const anomalies = stockItems.filter(i => (i.stock || 0) < (i.reserve || 0) || (i.stock || 0) === 0)

    if (anomalies.length === 0) {
        console.log('No anomalies found.')
    } else {
        console.table(anomalies.map(i => ({
            name: (i.product as any).name,
            stock: i.stock,
            reserve: i.reserve,
            diff: (i.stock || 0) - (i.reserve || 0)
        })))
    }
}

main()
