
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkPositionsSchema() {
    const { data, error } = await supabase
        .rpc('get_columns', { table_name: 'sales_positions' }) // Assuming get_columns exists or using direct query if not

    // If RPC fails (it might not exist), try querying information_schema via SQL if possible, or just insert a dummy and see error, 
    // OR just select * limit 1 and check keys.

    const { data: sample, error: sampleError } = await supabase
        .from('sales_positions')
        .select('*')
        .limit(1)

    if (sampleError) {
        console.error('Error fetching sample:', sampleError)
    } else if (sample && sample.length > 0) {
        console.log('Columns in sales_positions:', Object.keys(sample[0]))
    } else {
        console.log('sales_positions is empty, cannot infer columns from sample.')
        // Try to insert to see error? No.
    }
}

checkPositionsSchema()
