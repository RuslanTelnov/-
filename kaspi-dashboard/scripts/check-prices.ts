
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPrices() {
    console.log('Checking product prices...')

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, article, price, sale_price, buy_price')
        .limit(10)

    if (error) {
        console.error('Error:', error)
        return
    }

    if (products && products.length > 0) {
        console.log('Sample products prices:')
        products.forEach(p => {
            console.log(`- ${p.name} (Art: ${p.article}):`)
            console.log(`  buy_price (закупочная): ${p.buy_price}`)
            console.log(`  sale_price (продажная): ${p.sale_price}`)
            console.log(`  price (текущая в логике): ${p.price}`)
        })
    } else {
        console.log('No products found')
    }
}

checkPrices()
