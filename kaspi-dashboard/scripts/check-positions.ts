
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSalesPositions() {
    console.log('🔍 Checking Sales Positions...')

    const { count, error } = await supabase
        .from('sales_positions')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('❌ Error fetching count:', error)
        return
    }

    console.log(`Found ${count} sales positions`)

    if (count && count > 0) {
        const { data } = await supabase.from('sales_positions').select('*').limit(1)
        console.log('Sample position:', data?.[0])
    }
}

checkSalesPositions()
