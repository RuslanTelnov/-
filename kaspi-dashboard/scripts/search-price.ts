
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const { data: products, error } = await supabase
        .from('products')
        .select('name, price, sale_price')
        .or(`sale_price.gt.49000,sale_price.lt.50000`)
        .limit(50)

    if (products) {
        console.log('Products with price ~49k:')
        console.table(products)
    }
}

main()
