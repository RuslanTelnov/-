import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load env vars FIRST
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function runFullSync() {
    console.log('🚀 Starting full sync...')

    // Dynamic imports to ensure env vars are loaded
    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')
    const { MetricsCalculator } = await import('../lib/metrics/calculate-metrics')

    try {
        const sync = new MoySkladSync()
        const calculator = new MetricsCalculator()

        // Period: last 30 days
        const periodEnd = new Date()
        const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

        console.log(`📅 Period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`)

        const syncResults = await sync.syncAll(
            periodStart.toISOString(),
            periodEnd.toISOString()
        )
        console.log('✅ Sync results:', JSON.stringify(syncResults, null, 2))

        console.log('🧮 Recalculating metrics...')
        const metricsResults = await calculator.recalculateAllMetrics(
            periodStart,
            periodEnd
        )
        console.log('✅ Metrics results:', JSON.stringify(metricsResults, null, 2))

        console.log('🎉 Full sync completed successfully!')
    } catch (error) {
        console.error('❌ Sync failed:', error)
        process.exit(1)
    }
}

runFullSync()
