require('dotenv').config({ path: '.env.local' })
const { MoySkladSync } = require('../lib/sync/moy-sklad-sync')

async function syncFix() {
    const syncManager = new MoySkladSync()
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    console.log(`Syncing bundles...`)
    await syncManager.syncBundles(false)

    console.log(`Syncing sales since ${startOfMonth.toISOString()}...`)
    await syncManager.syncSales(false, { filter: { moment: { '>=': startOfMonth } } })

    console.log(`Syncing sales returns since ${startOfMonth.toISOString()}...`)
    await syncManager.syncSalesReturns(false, { filter: { moment: { '>=': startOfMonth } } })

    console.log('Sync fix complete.')
}

syncFix()
