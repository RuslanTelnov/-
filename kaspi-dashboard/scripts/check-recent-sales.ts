
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkRecentSales() {
    console.log('🔍 Checking Recent Sales...')

    // Check sales in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: sales, error } = await supabase
        .from('sales')
        .select('moment, moy_sklad_id, quantity, sum')
        .gte('moment', thirtyDaysAgo.toISOString())
        .limit(10)

    if (error) {
        console.error('❌ Error fetching sales:', error)
        return
    }

    console.log(`Found ${sales?.length} sales in last 30 days`)
    if (sales && sales.length > 0) {
        console.log('Sample sale:', sales[0])
    } else {
        // Check ANY sales
        const { count } = await supabase.from('sales').select('*', { count: 'exact', head: true })
        console.log(`Total sales in table: ${count}`)

        // Check latest sale
        const { data: latest } = await supabase.from('sales').select('moment').order('moment', { ascending: false }).limit(1)
        console.log('Latest sale date:', latest?.[0]?.moment)
    }
}

checkRecentSales()
