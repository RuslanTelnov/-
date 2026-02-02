import { NextRequest, NextResponse } from 'next/server'
import { MoySkladSync } from '@/lib/sync/moy-sklad-sync'
import { MetricsCalculator } from '@/lib/metrics/calculate-metrics'
import { TriggerAgent } from '@/lib/agent/trigger-agent'

// Автоматическая синхронизация и пересчет метрик
// Можно вызывать по расписанию (cron job) или вручную
export async function POST(request: NextRequest) {
  try {
    // Проверка секретного ключа для безопасности (опционально)
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.SYNC_SECRET_KEY

    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sync = new MoySkladSync()
    const calculator = new MetricsCalculator()

    // Период для отчетов - последние 30 дней
    const periodEnd = new Date()
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Синхронизация всех данных
    const syncResults = await sync.syncAll(
      periodStart.toISOString(),
      periodEnd.toISOString()
    )

    // Пересчет метрик
    const metricsResults = await calculator.recalculateAllMetrics(
      periodStart,
      periodEnd
    )

    // Запуск AI Агента для проверки триггеров
    console.log('🤖 Starting Agent evaluation...')
    const agent = new TriggerAgent()
    // Run in background (no await) or await if we want to include in response
    // Let's await to be safe for now
    await agent.evaluateTriggers()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sync: syncResults,
      metrics: metricsResults,
    })
  } catch (error: any) {
    console.error('Auto sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Auto sync failed' },
      { status: 500 }
    )
  }
}

// GET для проверки статуса
export async function GET() {
  return NextResponse.json({
    message: 'Auto sync endpoint',
    usage: 'POST to trigger automatic sync and metrics calculation',
  })
}

