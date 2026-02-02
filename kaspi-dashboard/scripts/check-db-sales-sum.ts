const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDbSales() {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const { data, error } = await supabase
        .from('sales')
        .select('sum')
        .gte('moment', startOfMonth.toISOString())

    if (error) {
        console.error('Error:', error)
        return
    }

    const totalSum = data.reduce((acc, item) => acc + (item.sum || 0), 0)
    console.log(`DB Sales Count: ${data.length}`)
    console.log(`DB Sales Sum: ${totalSum}`)
}

checkDbSales()
