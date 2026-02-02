const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
    const { data, error } = await supabase
        .from('sales')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('Sales table columns:', Object.keys(data[0]))
        console.log('Sample row:', data[0])
    } else {
        console.log('Sales table is empty, cannot infer columns from data.')
    }
}

checkSchema()
