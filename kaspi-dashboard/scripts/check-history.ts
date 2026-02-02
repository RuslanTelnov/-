
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
    const { count, error } = await supabase
        .from('kaspi_price_history')
        .select('*', { count: 'exact', head: true })

    if (error) console.error(error)
    else console.log(`Kaspi Price History Count: ${count}`)

    // Show sample
    const { data } = await supabase
        .from('kaspi_price_history')
        .select('*, products(name)')
        .limit(3)
        .order('created_at', { ascending: false })

    console.log('Sample:', JSON.stringify(data, null, 2))
}

check()
