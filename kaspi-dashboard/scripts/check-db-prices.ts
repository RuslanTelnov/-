
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkDbPrices() {
    console.log('Checking DB prices...')

    // Fetch a few stock items with product details
    const { data: stockItems, error } = await supabase
        .from('stock')
        .select(`
            cost_price,
            stock,
            products (
                name,
                article
            )
        `)
        .limit(5)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching stock:', error)
        return
    }

    console.log('Current DB Stock Items:')
    stockItems.forEach((item: any) => {
        console.log(`\nProduct: ${item.products?.name} (${item.products?.article})`)
        console.log(`- Stock: ${item.stock}`)
        console.log(`- Cost Price: ${item.cost_price}`)
    })
}

checkDbPrices()
