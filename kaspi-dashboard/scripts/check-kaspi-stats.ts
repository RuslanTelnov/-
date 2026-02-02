
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkStats() {
    const { count: total } = await supabase.from('products').select('*', { count: 'exact', head: true })
    const { count: withPrice } = await supabase.from('products').select('*', { count: 'exact', head: true }).gt('kaspi_price', 0)

    console.log(`Total Products: ${total}`)
    console.log(`With Kaspi Price: ${withPrice}`)
    console.log(`Coverage: ${((withPrice || 0) / (total || 1) * 100).toFixed(1)}%`)
}

checkStats()
