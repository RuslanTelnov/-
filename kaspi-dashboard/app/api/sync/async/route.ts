import { NextRequest, NextResponse } from 'next/server'
import { MoySkladSync } from '@/lib/sync/moy-sklad-sync'
import { syncStatus } from '@/lib/sync/sync-status-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      )
    }

    const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Запускаем синхронизацию асинхронно
    startAsyncSync(syncId, type)

    return NextResponse.json({
      success: true,
      syncId,
      message: 'Синхронизация запущена в фоновом режиме',
      statusUrl: `/api/sync/status/${syncId}`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start sync' },
      { status: 500 }
    )
  }
}

async function startAsyncSync(syncId: string, type: string) {
  syncStatus.set(syncId, {
    status: 'running',
    progress: 0,
    current: '',
    total: 0,
    completed: 0,
    errors: [],
    startTime: new Date().toISOString(),
  })

  try {
    const sync = new MoySkladSync()
    const periodEnd = new Date()
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

    const syncTypes = type === 'all' ? [
      'products', 'stock', 'sales', 'purchases', 'counterparties',
      'stores', 'customer_orders', 'payments_in', 'payments_out',
      'cash_in', 'cash_out', 'losses', 'turnover', 'profit_by_product', 'money_by_account',
      'product_costs'
    ] : [type]

    let completed = 0
    const total = syncTypes.length
    const results: any = {}

    // Обновляем статус с общим количеством задач
    updateStatus(syncId, {
      total,
      completed: 0,
    })

    for (const syncType of syncTypes) {
      updateStatus(syncId, {
        current: syncType,
        progress: Math.round((completed / total) * 100),
        completed,
        total,
      })

      let result: any = { success: false, error: 'Unknown sync type' }
      switch (syncType) {
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
            periodStart.toISOString(),
            periodEnd.toISOString()
          )
          break
        case 'profit_by_product':
          result = await sync.syncProfitByProduct(
            periodStart.toISOString(),
            periodEnd.toISOString()
          )
          break
        case 'money_by_account':
          result = await sync.syncMoneyByAccount(
            periodStart.toISOString(),
            periodEnd.toISOString()
          )
          break
        case 'product_costs':
          result = await sync.syncProductCosts()
          break
      }

      results[syncType] = result
      completed++

      // Обновляем прогресс после каждого типа синхронизации
      updateStatus(syncId, {
        completed,
        progress: Math.round((completed / total) * 100),
      })

      if (!result.success) {
        const errors = syncStatus.get(syncId)?.errors || []
        errors.push({ type: syncType, error: result.error })
        updateStatus(syncId, { errors })
      }
    }

    updateStatus(syncId, {
      status: 'completed',
      progress: 100,
      completed,
      total,
      results,
      endTime: new Date().toISOString(),
    })
  } catch (error: any) {
    updateStatus(syncId, {
      status: 'error', // Исправляем на 'error' для совместимости с Dashboard
      error: error.message,
      endTime: new Date().toISOString(),
    })
  }
}

function updateStatus(syncId: string, updates: any) {
  const current = syncStatus.get(syncId) || {}
  syncStatus.set(syncId, { ...current, ...updates })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const syncId = searchParams.get('id')

  if (!syncId) {
    return NextResponse.json(
      { error: 'Sync ID is required' },
      { status: 400 }
    )
  }

  const status = syncStatus.get(syncId)

  if (!status) {
    return NextResponse.json(
      { error: 'Sync not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(status)
}

