
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const storeId = 'de940fd4-23f4-11ef-0a80-0eb00010b17c' // Основной склад

    // 1. Fix Новогодний венок d 4 (107446427) -> Stock 0
    const { data: p1 } = await supabase.from('products').select('id').eq('article', '107446427').single()
    if (p1) {
        console.log('Fixing stock for 107446427...')
        await supabase.from('stock').update({ stock: 0, quantity: 0, reserve: 0 }).match({ product_id: p1.id, store_id: storeId })
    }

    // 2. Fix Неваляшка Убегающий (115051488) -> Cost 1898.26
    const { data: p2 } = await supabase.from('products').select('id').eq('article', '115051488').single()
    if (p2) {
        console.log('Fixing cost for 115051488...')
        await supabase.from('stock').update({ cost_price: 1898.26 }).match({ product_id: p2.id, store_id: storeId })
    }

    console.log('Done')
}

main()
