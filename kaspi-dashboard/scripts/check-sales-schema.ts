
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSalesSchema() {
    console.log('🔍 Checking Sales Table Schema...')

    const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error fetching sales:', error)
        return
    }

    if (sales && sales.length > 0) {
        console.log('Sales columns:', Object.keys(sales[0]))
    } else {
        console.log('Sales table is empty, cannot infer schema from data.')
    }
}

checkSalesSchema()
