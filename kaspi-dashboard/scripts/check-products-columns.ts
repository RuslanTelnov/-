import dotenv from 'dotenv'
import * as path from 'path'

// Load env vars before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkProductsColumns() {
    try {
        // Dynamic import to ensure env vars are loaded
        const { supabaseAdmin } = await import('../lib/supabase/server')

        const { data: products, error } = await supabaseAdmin.from('products').select('*').limit(1)

        if (error) console.error('Products Error:', error.message)
        else console.log('Products Columns:', Object.keys(products?.[0] || {}))

    } catch (e) {
        console.log('Error:', e)
    }
}

checkProductsColumns()
