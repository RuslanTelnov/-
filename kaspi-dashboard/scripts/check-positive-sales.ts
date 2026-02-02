
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkPositiveSales() {
    console.log('🔍 Checking Positive Quantity Sales...')

    const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .gt('quantity', 0)
        .order('moment', { ascending: false })
        .limit(10)

    if (error) {
        console.error('❌ Error fetching sales:', error)
        return
    }

    console.log(`Found ${sales?.length} sales with quantity > 0`)
    if (sales && sales.length > 0) {
        console.log('Sample sale:', sales[0])
    } else {
        console.warn('⚠️ No sales with quantity > 0 found!')
    }
}

checkPositiveSales()
