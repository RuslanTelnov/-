import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabaseAdmin } from '../lib/supabase/server'

async function run() {
    const id = '5f10981d-485c-11f0-0a80-1b7d002ce9ee'
    console.log(`Checking product ${id}...`)

    const { data } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    console.log('Product:', data)
}

run()
