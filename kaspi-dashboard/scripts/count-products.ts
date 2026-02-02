import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabaseAdmin } from '../lib/supabase/server'

async function run() {
    const { count, error } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting products:', error)
    } else {
        console.log('Total products in DB:', count)
    }
}

run()
