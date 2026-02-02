const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCounts() {
    const tables = ['products', 'stock', 'sales', 'sales_positions']

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.error(`Error counting ${table}:`, error)
        } else {
            console.log(`${table}: ${count} rows`)
        }
    }
}

checkCounts()
