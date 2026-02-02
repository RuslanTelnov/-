
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

async function checkData() {
    console.log('Checking database data...')

    // 1. Check Stores
    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')

    if (storesError) {
        console.error('Error fetching stores:', storesError)
    } else {
        console.log(`\n=== STORES (${stores.length}) ===`)
        stores.forEach(store => {
            console.log(`- ${store.name} (ID: ${store.id}, MoySklad ID: ${store.moy_sklad_id})`)
        })
    }

    // 2. Check Stock
    const { data: stock, error: stockError } = await supabase
        .from('stock')
        .select('*')
        .limit(20)

    if (stockError) {
        console.error('Error fetching stock:', stockError)
    } else {
        const { count } = await supabase.from('stock').select('*', { count: 'exact', head: true })
        console.log(`\n=== STOCK (Total: ${count}) ===`)

        if (stock.length > 0) {
            console.log('Sample stock items:')
            stock.forEach(item => {
                console.log(`- Article: "${item.article}", Product ID: ${item.product_id}, Stock: ${item.stock}, Store: ${item.store_id}`)
            })
        } else {
            console.log('No stock items found!')
        }
    }

    // 3. Check Products sample
    const { data: products } = await supabase
        .from('products')
        .select('id, name, article')
        .limit(5)

    console.log(`\n=== PRODUCTS SAMPLE ===`)
    if (products) {
        products.forEach(p => console.log(`- ${p.name} (${p.article}) ID: ${p.id}`))
    }

    // 4. Check Specific Product
    const targetId = '8fdca721-5bdd-11f0-0a80-153200415c1b'
    const { data: targetProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', targetId)
        .single()

    console.log(`\n=== TARGET PRODUCT (${targetId}) ===`)
    if (targetProduct) {
        console.log('Found:', targetProduct.name, targetProduct.article)
    } else {
        console.log('Not found!')
    }
}

checkData()
