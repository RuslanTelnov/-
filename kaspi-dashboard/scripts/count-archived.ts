import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabaseAdmin } from '../lib/supabase/server'

async function run() {
    const { count, error } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('archived', true)

    if (error) {
        console.error('Error counting archived products:', error)
    } else {
        console.log('Archived products in DB:', count)
    }
}

run()
