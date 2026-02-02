const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
    const { data, error } = await supabase
        .from('profit_by_product')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('profit_by_product table columns:', Object.keys(data[0]))
        console.log('Sample row:', data[0])
    } else {
        console.log('profit_by_product table is empty.')
    }
}

checkSchema()
