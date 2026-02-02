import { NextRequest, NextResponse } from 'next/server'
import { MoySkladSync } from '@/lib/sync/moy-sklad-sync'
import { MetricsCalculator } from '@/lib/metrics/calculate-metrics'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { type, periodStart, periodEnd } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      )
    }

    const sync = new MoySkladSync()

    let result

    const startDate = periodStart ? new Date(periodStart) : undefined
    const endDate = periodEnd ? new Date(periodEnd) : undefined

    switch (type) {
      case 'products':
        result = await sync.syncProducts()
        break
      case 'stock':
        result = await sync.syncStock()
        break
      case 'sales':
        result = await sync.syncSales()
        break
      case 'purchases':
        result = await sync.syncPurchases()
        break
      case 'counterparties':
        result = await sync.syncCounterparties()
        break
      case 'stores':
        result = await sync.syncStores()
        break
      case 'customer_orders':
        result = await sync.syncCustomerOrders()
        break
      case 'payments_in':
        result = await sync.syncPaymentsIn()
        break
      case 'payments_out':
        result = await sync.syncPaymentsOut()
        break
      case 'cash_in':
        result = await sync.syncCashIn()
        break
      case 'cash_out':
        result = await sync.syncCashOut()
        break
      case 'losses':
        result = await sync.syncLosses()
        break
      case 'turnover':
        result = await sync.syncTurnover(
          startDate?.toISOString(),
          endDate?.toISOString()
        )
        break
      case 'profit_by_product':
        result = await sync.syncProfitByProduct(
          startDate?.toISOString(),
          endDate?.toISOString()
        )
        break
      case 'money_by_account':
        result = await sync.syncMoneyByAccount(
          startDate?.toISOString(),
          endDate?.toISOString()
        )
        break
      case 'all':
        result = await sync.syncAll(
          startDate?.toISOString(),
          endDate?.toISOString()
        )
        break
      case 'calculate_metrics':
        const calculator = new MetricsCalculator()
        result = await calculator.recalculateAllMetrics(startDate, endDate)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid sync type' },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Sync returned no result' },
        { status: 500 }
      )
    }

    return NextResponse.json(result || { success: false, error: 'Unknown error' })
  } catch (error: any) {
    console.error('Sync error:', error)
    const errorMessage = error?.message || String(error) || 'Sync failed'
    return NextResponse.json(
      {
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

