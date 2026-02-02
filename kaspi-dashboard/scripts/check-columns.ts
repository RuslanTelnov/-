import dotenv from 'dotenv'
import * as path from 'path'

// Load env vars before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function checkColumns() {
    try {
        // Dynamic import to ensure env vars are loaded
        const { supabaseAdmin } = await import('../lib/supabase/server')

        const { data: sales, error: salesError } = await supabaseAdmin.from('sales').select('*').limit(1)
        const { data: profit, error: profitError } = await supabaseAdmin.from('profit_by_product').select('*').limit(1)

        if (salesError) console.error('Sales Error:', salesError.message)
        else console.log('Sales Columns:', Object.keys(sales?.[0] || {}))

        if (profitError) console.error('Profit Error:', profitError.message)
        else console.log('Profit Columns:', Object.keys(profit?.[0] || {}))

    } catch (e) {
        console.log('Error:', e)
    }
}

checkColumns()
