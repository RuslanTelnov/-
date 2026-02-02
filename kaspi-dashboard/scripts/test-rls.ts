
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Use ANON key to simulate client-side access
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function checkRLS() {
    console.log('Testing access with ANON key...')

    const { data: stock, error: stockError } = await supabase.from('stock').select('count').limit(1)
    if (stockError) {
        console.error('Stock Access Error:', stockError)
    } else {
        console.log('Stock Access: OK')
    }

    const { data: products, error: productsError } = await supabase.from('products').select('count').limit(1)
    if (productsError) {
        console.error('Products Access Error:', productsError)
    } else {
        console.log('Products Access: OK')
    }

    const { count } = await supabase.from('stock').select('*', { count: 'exact', head: true })
    console.log(`Visible Stock Rows (Anon): ${count}`)
}

checkRLS()
