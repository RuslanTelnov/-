
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkPositionsCount() {
    const { count, error } = await supabase
        .from('sales_positions')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting positions:', error)
    } else {
        console.log(`Total rows in sales_positions: ${count}`)
        const { data: sample } = await supabase.from('sales_positions').select('*').limit(1)
        console.log('Sample row:', sample)
    }
}

checkPositionsCount()
