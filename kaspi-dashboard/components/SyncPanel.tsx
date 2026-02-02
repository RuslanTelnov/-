'use client'

import { useState, useEffect } from 'react'

type SyncType =
  | 'products'
  | 'stock'
  | 'sales'
  | 'purchases'
  | 'counterparties'
  | 'stores'
  | 'customer_orders'
  | 'payments_in'
  | 'payments_out'
  | 'cash_in'
  | 'cash_out'
  | 'losses'
  | 'turnover'
  | 'profit_by_product'
  | 'money_by_account'
  | 'calculate_metrics'
  | 'all'

export default function SyncPanel() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState<any>(null)
  const [syncId, setSyncId] = useState<string | null>(null)

  // Отслеживание прогресса синхронизации
  useEffect(() => {
    if (!syncId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/sync/status/${syncId}`)
        if (response.ok) {
          const status = await response.json()
          setSyncProgress(status)

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval)
            setSyncing(false)
            if (status.status === 'completed') {
              setResult(status.results)
            } else {
              setError(status.error || 'Синхронизация завершилась с ошибкой')
            }
            setSyncId(null)
          }
        }
      } catch (err) {
        console.error('Error checking sync status:', err)
      }
    }, 1000) // Проверяем каждую секунду

    return () => clearInterval(interval)
  }, [syncId])

  const handleSync = async (type: SyncType) => {
    setSyncing(true)
    setError(null)
    setResult(null)
    setSyncProgress(null)

    try {
      // Для полной синхронизации используем асинхронный API
      if (type === 'all') {
        const response = await fetch('/api/sync/async', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Ошибка сервера' }))
          throw new Error(errorData.error || `Ошибка ${response.status}`)
        }

        const data = await response.json()
        setSyncId(data.syncId)
        setSyncProgress({
          status: 'running',
          progress: 0,
          current: 'Запуск синхронизации...',
        })
      } else {
        // Для отдельных типов используем обычный API
        const periodEnd = new Date()
        const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Ошибка сервера' }))
          throw new Error(errorData.error || `Ошибка ${response.status}`)
        }

        const data = await response.json()
        setResult(data)
        setSyncing(false)
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка')
      setSyncing(false)
      setSyncId(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Синхронизация данных</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleSync('products')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать товары'}
        </button>

        <button
          onClick={() => handleSync('stock')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать остатки'}
        </button>

        <button
          onClick={() => handleSync('sales')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать продажи'}
        </button>

        <button
          onClick={() => handleSync('purchases')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать закупки'}
        </button>

        <button
          onClick={() => handleSync('counterparties')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать контрагентов'}
        </button>

        <button
          onClick={() => handleSync('stores')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать склады'}
        </button>

        <button
          onClick={() => handleSync('customer_orders')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать заказы'}
        </button>

        <button
          onClick={() => handleSync('payments_in')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Входящие платежи'}
        </button>

        <button
          onClick={() => handleSync('payments_out')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Исходящие платежи'}
        </button>

        <button
          onClick={() => handleSync('losses')}
          disabled={syncing}
          className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать списания'}
        </button>

        <button
          onClick={() => handleSync('turnover')}
          disabled={syncing}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Отчет: Обороты'}
        </button>

        <button
          onClick={() => handleSync('profit_by_product')}
          disabled={syncing}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Отчет: Прибыль'}
        </button>

        <button
          onClick={() => handleSync('money_by_account')}
          disabled={syncing}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Синхронизация...' : 'Отчет: Деньги'}
        </button>

        <button
          onClick={() => handleSync('calculate_metrics')}
          disabled={syncing}
          className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Расчет...' : 'Пересчитать метрики'}
        </button>

        <button
          onClick={() => handleSync('all')}
          disabled={syncing}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать всё'}
        </button>
      </div>

      {/* Прогресс синхронизации */}
      {syncProgress && syncProgress.status === 'running' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-800">Синхронизация в процессе...</h3>
            <span className="text-blue-600 font-bold">{syncProgress.progress || 0}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress.progress || 0}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-700">
            {syncProgress.current && `Текущий этап: ${syncProgress.current}`}
            {syncProgress.completed !== undefined && syncProgress.total !== undefined && (
              <span className="ml-2">
                ({syncProgress.completed} / {syncProgress.total})
              </span>
            )}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {result && !syncing && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold">Синхронизация завершена успешно!</h3>
          </div>
          {typeof result === 'object' && (
            <div className="mt-2 text-sm">
              {result.success !== undefined ? (
                // Single sync result
                <div className="mb-1">
                  <span className="font-medium">Результат:</span>{' '}
                  {result.success ? (
                    <span className="text-green-600">✓ {result.count ? `${result.count} записей` : 'OK'}</span>
                  ) : (
                    <span className="text-red-600">✗ {result.error || 'Ошибка'}</span>
                  )}
                </div>
              ) : (
                // Multiple sync results (sync all)
                Object.entries(result).map(([key, value]: [string, any]) => (
                  <div key={key} className="mb-1">
                    <span className="font-medium">{key}:</span>{' '}
                    {value?.success ? (
                      <span className="text-green-600">✓ {value.count || 'OK'}</span>
                    ) : (
                      <span className="text-red-600">✗ {value?.error || 'Ошибка'}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

