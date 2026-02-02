
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSchema() {
    console.log('Checking profit_by_product columns...')

    // We can't query information_schema easily via JS client, so we'll try to select * limit 1
    const { data, error } = await supabase
        .from('profit_by_product')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Select Error:', error)
    } else {
        console.log('Columns found in select *:', data && data.length > 0 ? Object.keys(data[0]) : 'No data, but query worked')
    }

    // Also check via SQL if possible (using our check-table-schema.ts logic)
    // But let's just try to add the column if missing
}

checkSchema()
