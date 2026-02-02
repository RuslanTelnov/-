require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { MoySkladSync } = require('../lib/sync/moy-sklad-sync')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanAndSync() {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    console.log(`Cleaning sales since ${startOfMonth.toISOString()}...`)

    // 1. Delete positions first (foreign key)
    // Actually, if I delete sales, positions should cascade if configured, but let's be safe.
    // I need to find sales IDs first.

    const { data: sales } = await supabase
        .from('sales')
        .select('id')
        .gte('moment', startOfMonth.toISOString())

    if (sales && sales.length > 0) {
        const ids = sales.map(s => s.id)
        await supabase.from('sales_positions').delete().in('sales_doc_id', ids)
        await supabase.from('sales').delete().in('id', ids)
        console.log(`Deleted ${sales.length} sales and their positions.`)
    } else {
        console.log('No sales to delete.')
    }

    // 2. Sync
    const syncManager = new MoySkladSync()
    console.log(`Syncing sales since ${startOfMonth.toISOString()}...`)
    await syncManager.syncSales(false, { filter: { moment: { '>=': startOfMonth } } })
    console.log('Sync complete.')
}

cleanAndSync()
