import dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIds() {
    const productId = 'c650bd1d-a8c9-11f0-0a80-164400054e2a'
    const storeId = '71113bbc-6630-11f0-0a80-198100321b87'

    console.log(`🔍 Checking IDs...`)

    const { data: product } = await supabase.from('products').select('id, name').eq('id', productId).single()
    console.log(`Product ${productId}:`, product ? `✅ Found (${product.name})` : '❌ NOT FOUND')

    const { data: store } = await supabase.from('stores').select('id, name').eq('id', storeId).single()
    console.log(`Store ${storeId}:`, store ? `✅ Found (${store.name})` : '❌ NOT FOUND')
}

checkIds()
