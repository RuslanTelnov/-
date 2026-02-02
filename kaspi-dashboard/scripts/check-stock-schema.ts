
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkStockSchema() {
    console.log('Checking stock columns...')

    const { data, error } = await supabase
        .from('stock')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Select Error:', error)
    } else {
        console.log('Columns found:', data && data.length > 0 ? Object.keys(data[0]) : 'No data')
    }
}

checkStockSchema()
