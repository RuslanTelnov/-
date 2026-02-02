
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

    // 1. Fix Новогодняя елка (106846750) -> Reserve 1
    const { data: p1 } = await supabase.from('products').select('id').eq('article', '106846750').single()
    if (p1) {
        console.log('Fixing stock for Новогодняя елка...')
        await supabase.from('stock').update({ stock: 1, reserve: 1 }).match({ product_id: p1.id, store_id: storeId })
    }

    // 2. Fix Варежки (114228935) -> Reserve 0
    const { data: p2 } = await supabase.from('products').select('id').eq('article', '114228935').single()
    if (p2) {
        console.log('Fixing reserve for Варежки...')
        await supabase.from('stock').update({ reserve: 0 }).match({ product_id: p2.id, store_id: storeId })
    }

    // 3. Fix Косметичка (118051211) -> Reserve 0
    const { data: p3 } = await supabase.from('products').select('id').eq('article', '118051211').single()
    if (p3) {
        console.log('Fixing reserve for Косметичка...')
        await supabase.from('stock').update({ reserve: 0 }).match({ product_id: p3.id, store_id: storeId })
    }

    console.log('Done')
}

main()
