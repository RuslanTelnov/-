
import React, { useState, useEffect } from 'react'
import { Loader2, Download, AlertTriangle, CheckCircle2, X } from 'lucide-react'

interface OrderItem {
    product_id: string
    product_name: string
    article: string
    current_stock: number
    avg_daily_sales: number
    days_of_stock: number
    recommended_quantity: number
    cost_price: number
    estimated_cost: number
    priority: 'critical' | 'high' | 'medium' | 'low'
    reason: string
    sale_price: number
    kaspi_price?: number | null
    margin: number
    margin_percent: number
}

interface OrderResponse {
    items: OrderItem[]
    total_items: number
    total_cost: number
    days_to_cover: number
}

export function OrderListModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<OrderResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open && !data) {
            fetchOrder()
        }
    }, [open])

    const fetchOrder = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/agent/generate-order?days=14')
            if (!res.ok) throw new Error('Не удалось сформировать заказ')
            const json = await res.json()
            setData(json)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val)
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200'
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'critical': return 'Критично'
            case 'high': return 'Высокий'
            case 'medium': return 'Средний'
            default: return 'Низкий'
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-8">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)}></div>

            <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 pb-4 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            📋 Рекомендуемый заказ
                            {data && <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200">{data.total_items} товаров</span>}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Список сформирован на основе скорости продаж за последние 90 дней. Цель: запас на 14 дней.
                        </p>
                    </div>
                    <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            <p className="text-gray-500">Анализирую продажи и остатки...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-red-500">
                            <AlertTriangle className="h-8 w-8" />
                            <p>{error}</p>
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                                onClick={fetchOrder}
                            >
                                Повторить
                            </button>
                        </div>
                    ) : data?.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-green-600">
                            <CheckCircle2 className="h-12 w-12" />
                            <p className="text-lg font-medium">Все отлично! Заказывать нечего.</p>
                            <p className="text-sm text-gray-500">Товаров достаточно на ближайшие 14 дней.</p>
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Товар</th>
                                        <th className="px-4 py-3 font-medium text-center">Остаток</th>
                                        <th className="px-4 py-3 font-medium text-center">Продажи/день</th>
                                        <th className="px-4 py-3 font-medium text-center">Хватит на</th>
                                        <th className="px-4 py-3 font-medium text-center text-indigo-600">Заказать</th>
                                        <th className="px-4 py-3 font-medium text-right">Себест.</th>

                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kaspi</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Маржа</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                                        <th className="px-4 py-3 font-medium text-center">Приоритет</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data?.items.map((item) => (
                                        <tr key={item.product_id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={item.product_name}>
                                                <a
                                                    href={`https://kaspi.kz/shop/search/?text=${item.article}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex flex-col hover:text-indigo-600 transition-colors group"
                                                >
                                                    <span className="text-gray-900 group-hover:text-indigo-600 underline decoration-dotted underline-offset-2">{item.product_name}</span>
                                                    <span className="text-xs text-gray-400 group-hover:text-indigo-400 flex items-center gap-1">
                                                        {item.article}
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                                    </span>
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={item.current_stock === 0 ? 'text-red-500 font-bold' : 'text-gray-700'}>
                                                    {item.current_stock}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {item.avg_daily_sales.toFixed(1)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {item.days_of_stock > 100 ? '>100' : item.days_of_stock.toFixed(1)} дн.
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                                                    {item.recommended_quantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500 text-xs">
                                                {formatCurrency(item.cost_price)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                {item.kaspi_price ? (
                                                    <span className="text-blue-600 font-medium">
                                                        {formatCurrency(item.kaspi_price)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={item.margin > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>
                                                        {formatCurrency(item.margin)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {item.margin_percent.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {formatCurrency(item.estimated_cost)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                                                    {getPriorityLabel(item.priority)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Итоговая сумма: <span className="font-bold text-gray-900">{data ? formatCurrency(data.total_cost) : '0 ₸'}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white bg-white text-gray-700 text-sm font-medium transition-colors"
                            onClick={() => onOpenChange(false)}
                        >
                            Закрыть
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Экспорт (Excel)
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
