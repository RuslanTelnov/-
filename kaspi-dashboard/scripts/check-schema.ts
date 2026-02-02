import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabaseAdmin } from '../lib/supabase/server'

async function run() {
    console.log('Checking products table schema...')

    // Try to select the 'archived' column from one product
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, archived')
        .limit(1)

    if (error) {
        console.error('❌ Error selecting archived column:', error)
    } else {
        console.log('✅ Successfully selected archived column. Data:', data)
    }
}

run()
