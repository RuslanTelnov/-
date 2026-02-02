
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkStock() {
    const { count, error } = await supabase.from('stock').select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error checking stock:', error)
    } else {
        console.log(`Total Stock Rows: ${count}`)
    }

    // Check distinct stores
    const { data: stores } = await supabase.from('stock').select('store_id').limit(10)
    if (stores) {
        console.log('Sample Store IDs:', stores.map(s => s.store_id))
    }
}

checkStock()
