import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMetrics() {
    const { data, error } = await supabase
        .from('product_metrics')
        .select('*')
        .limit(5)

    if (error) {
        console.error('Error fetching metrics:', error)
        return
    }

    console.log('Product Metrics Sample:', data)
}

checkMetrics()
