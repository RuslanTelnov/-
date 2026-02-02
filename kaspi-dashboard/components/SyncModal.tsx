
import React, { useState, useEffect } from 'react'
import { X, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

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

interface SyncModalProps {
    isOpen: boolean
    onClose: () => void
    onSyncComplete?: () => void
}

export function SyncModal({ isOpen, onClose, onSyncComplete }: SyncModalProps) {
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
                            if (onSyncComplete) onSyncComplete()
                        } else {
                            setError(status.error || 'Синхронизация завершилась с ошибкой')
                        }
                        setSyncId(null)
                    }
                }
            } catch (err) {
                console.error('Error checking sync status:', err)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [syncId, onSyncComplete])

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
                    headers: { 'Content-Type': 'application/json' },
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
                    headers: { 'Content-Type': 'application/json' },
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
                if (onSyncComplete) onSyncComplete()
            }
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка')
            setSyncing(false)
            setSyncId(null)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-indigo-600" />
                            Центр синхронизации
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Управление обновлением данных из МойСклад</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Status Area */}
                    {(syncing || result || error) && (
                        <div className="mb-6">
                            {syncProgress && syncProgress.status === 'running' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Синхронизация...
                                        </h3>
                                        <span className="text-blue-600 font-bold">{syncProgress.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${syncProgress.progress || 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-blue-700">
                                        {syncProgress.current}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold">Ошибка синхронизации</h3>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                </div>
                            )}

                            {result && !syncing && (
                                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div className="w-full">
                                        <h3 className="font-semibold">Успешно обновлено</h3>
                                        <div className="mt-2 text-sm space-y-1">
                                            {typeof result === 'object' && (
                                                result.success !== undefined ? (
                                                    <div>{result.count ? `${result.count} записей` : 'OK'}</div>
                                                ) : (
                                                    Object.entries(result).map(([key, value]: [string, any]) => (
                                                        <div key={key} className="flex justify-between border-b border-green-100 last:border-0 py-1">
                                                            <span className="font-medium">{key}:</span>
                                                            {value?.success ? (
                                                                <span className="text-green-600 font-bold">✓ {value.count || 'OK'}</span>
                                                            ) : (
                                                                <span className="text-red-600">✗ {value?.error || 'Ошибка'}</span>
                                                            )}
                                                        </div>
                                                    ))
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grid Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: 'products', label: 'Товары', color: 'bg-indigo-600' },
                            { id: 'stock', label: 'Остатки', color: 'bg-indigo-600' },
                            { id: 'sales', label: 'Продажи', color: 'bg-indigo-600' },
                            { id: 'purchases', label: 'Закупки', color: 'bg-indigo-600' },
                            { id: 'counterparties', label: 'Контрагенты', color: 'bg-indigo-600' },
                            { id: 'stores', label: 'Склады', color: 'bg-indigo-600' },
                            { id: 'customer_orders', label: 'Заказы покупателей', color: 'bg-indigo-600' },
                            { id: 'payments_in', label: 'Входящие платежи', color: 'bg-indigo-600' },
                            { id: 'payments_out', label: 'Исходящие платежи', color: 'bg-indigo-600' },
                            { id: 'losses', label: 'Списания', color: 'bg-indigo-600' },
                            { id: 'turnover', label: 'Отчет: Обороты', color: 'bg-blue-600' },
                            { id: 'profit_by_product', label: 'Отчет: Прибыль', color: 'bg-blue-600' },
                            { id: 'money_by_account', label: 'Отчет: Деньги', color: 'bg-blue-600' },
                            { id: 'calculate_metrics', label: 'Пересчитать метрики', color: 'bg-purple-600' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleSync(item.id as SyncType)}
                                disabled={syncing}
                                className={`p-4 rounded-xl text-white shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group ${item.color}`}
                            >
                                <span className="font-medium">{item.label}</span>
                                <RefreshCw className={`w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity ${syncing ? 'animate-spin' : ''}`} />
                            </button>
                        ))}

                        <button
                            onClick={() => handleSync('all')}
                            disabled={syncing}
                            className="col-span-full p-4 rounded-xl bg-green-600 text-white shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-lg mt-2"
                        >
                            <RefreshCw className={`w-6 h-6 ${syncing ? 'animate-spin' : ''}`} />
                            Синхронизировать всё
                        </button>
                    </div>

                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    )
}
