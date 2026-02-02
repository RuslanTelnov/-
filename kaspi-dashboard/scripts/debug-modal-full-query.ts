
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function debugFullQuery() {
    console.log('🔍 Debugging Full Modal Query...')

    // 1. Get stores
    const { data: stores } = await supabase.from('stores').select('id, name')
    if (!stores) {
        console.error('❌ No stores found')
        return
    }

    // 2. Filter for "Основной склад"
    const targetStoreIds = stores
        .filter(s => {
            const name = s.name.toLowerCase().trim()
            return name === 'основной склад' || name === 'main warehouse'
        })
        .map(s => s.id)

    console.log('Target Store IDs:', targetStoreIds)

    // 3. Run EXACT query from component
    const { data, error } = await supabase
        .from('stock')
        .select(`
            id,
            product_id,
            store_id,
            stock,
            reserve,
            stock_days,
            product:products (
              article,
              name,
              cost_price,
              sale_price,
              price,
              kaspi_price,
              image_url
            )
        `)
        .in('store_id', targetStoreIds)
        .gt('stock', 0)
        .limit(5)

    if (error) {
        console.error('❌ Query Error:', error)
    } else {
        console.log('✅ Query Success!')
        console.log('Items found:', data?.length)
        if (data && data.length > 0) {
            console.log('Sample item:', JSON.stringify(data[0], null, 2))
        }
    }
}

debugFullQuery()
