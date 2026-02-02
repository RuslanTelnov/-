import { MetricsCalculator } from '../lib/metrics/calculate-metrics'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function calculateMetrics() {
    console.log('🚀 Starting initial metrics calculation...')

    try {
        const calculator = new MetricsCalculator()

        // Calculate for last 30 days
        const end = new Date()
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

        console.log(`Period: ${start.toISOString()} - ${end.toISOString()}`)

        const result = await calculator.recalculateAllMetrics(start, end)

        if (result.success) {
            console.log('✅ Metrics calculation completed successfully!')
            console.log(`Total products: ${result.total}`)
            console.log(`Successful: ${result.successful}`)
            console.log(`Failed: ${result.failed || 0}`)

            if ((result.failed || 0) > 0) {
                console.warn('⚠️ Some products failed calculation. Check logs for details.')
                // Log first few failures if any
                const failures = result.results?.filter(r => !r.success).slice(0, 5)
                failures?.forEach(f => console.log(`  - ${f.article}: ${f.error}`))
            }
        } else {
            console.error('❌ Calculation failed:', result.error)
        }

    } catch (error) {
        console.error('❌ Fatal error:', error)
        process.exit(1)
    }
}

calculateMetrics()
