
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCostPrices() {
    console.log('🔍 Checking Cost Prices...')

    const productNames = [
        'Dahao порошок от тараканов 1 шт',
        'HEBIKUO FG-02 4 шт',
        'Брелок металл 1 шт'
    ]

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, article, cost_price, buy_price')
        .in('name', productNames)

    if (error) {
        console.error('❌ Error fetching products:', error)
        return
    }

    console.log('Products found:', products)
}

checkCostPrices()
