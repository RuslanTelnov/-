require('dotenv').config({ path: '.env.local' })
const { MoySkladSync } = require('../lib/sync/moy-sklad-sync')

async function forceSyncSales() {
    const syncManager = new MoySkladSync()
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    console.log(`Forcing sales sync since ${startOfMonth.toISOString()}...`)
    await syncManager.syncSales(false, { filter: { moment: { '>=': startOfMonth } } })
    console.log('Sync complete.')
}

forceSyncSales()
