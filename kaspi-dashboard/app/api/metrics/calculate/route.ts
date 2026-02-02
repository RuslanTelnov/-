import { NextResponse } from 'next/server'
import { MetricsCalculator } from '@/lib/metrics/calculate-metrics'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { periodStart, periodEnd } = body

        const calculator = new MetricsCalculator()

        // Default to last 30 days if not provided
        const end = periodEnd ? new Date(periodEnd) : new Date()
        const start = periodStart ? new Date(periodStart) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

        console.log(`Starting metrics calculation from ${start.toISOString()} to ${end.toISOString()}`)

        const result = await calculator.recalculateAllMetrics(start, end)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to calculate metrics' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Calculated metrics for ${result.total} products`,
            details: {
                total: result.total,
                successful: result.successful,
                failed: result.failed
            }
        })

    } catch (error) {
        console.error('Error in metrics calculation API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
