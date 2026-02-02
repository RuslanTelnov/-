import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load env vars FIRST
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function syncViaDirectSQL() {
    console.log('🚀 Starting sync via direct SQL connection...')

    // Dynamic imports
    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')

    try {
        const sync = new MoySkladSync()

        // Period: last 30 days
        const periodEnd = new Date()
        const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

        console.log(`📅 Period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`)

        console.log('🔄 Syncing product costs...')
        const costsResult = await sync.syncProductCosts()
        console.log('Costs result:', costsResult)

        console.log('🔄 Syncing profit...')
        const profitResult = await sync.syncProfitByProduct(
            periodStart.toISOString(),
            periodEnd.toISOString()
        )
        console.log('Profit result:', profitResult)

        console.log('🔄 Syncing turnover...')
        const turnoverResult = await sync.syncTurnover(
            periodStart.toISOString(),
            periodEnd.toISOString()
        )
        console.log('Turnover result:', turnoverResult)

    } catch (error) {
        console.error('❌ Sync failed:', error)
    }
}

syncViaDirectSQL()
