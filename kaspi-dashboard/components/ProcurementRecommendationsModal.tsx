'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Download, Search, Filter, ShoppingCart, AlertTriangle, ArrowUpDown } from 'lucide-react'

interface Recommendation {
    id: string
    product_id: string
    product: {
        name: string
        article: string
    }
    current_stock: number
    avg_daily_sales: number
    days_until_stockout: number
    recommended_qty: number
    priority: 'critical' | 'high' | 'medium' | 'low'
    total_cost: number
    expected_profit: number
}

export function ProcurementRecommendationsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('what-to-buy')

    useEffect(() => {
        if (isOpen) {
            fetchRecommendations()
        }
    }, [isOpen])

    const fetchRecommendations = async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from('procurement_recommendations')
            .select(`
        *,
        product:products(name, article)
      `)
            .gt('recommended_qty', 0)
            .order('priority', { ascending: true })

        if (error) {
            console.error('Error fetching recommendations:', error)
        } else {
            const priorityWeight = { critical: 0, high: 1, medium: 2, low: 3 }
            const sorted = (data as any[]).sort((a, b) => {
                const pDiff = priorityWeight[a.priority as keyof typeof priorityWeight] - priorityWeight[b.priority as keyof typeof priorityWeight]
                if (pDiff !== 0) return pDiff

                // Secondary sort: Expected Profit (Desc) - prioritizes high value/high velocity items
                return (b.expected_profit || 0) - (a.expected_profit || 0)
            })
            setRecommendations(sorted)
        }
        setLoading(false)
    }

    const exportToExcel = async () => {
        const ExcelJS = (await import('exceljs')).default
        const { saveAs } = await import('file-saver')

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Recommendations')

        worksheet.columns = [
            { header: 'Артикул', key: 'article', width: 15 },
            { header: 'Товар', key: 'name', width: 40 },
            { header: 'Остаток', key: 'stock', width: 10 },
            { header: 'Продажи/день', key: 'sales', width: 15 },
            { header: 'Дней до дефицита', key: 'days', width: 20 },
            { header: 'Реком. объем', key: 'qty', width: 15 },
            { header: 'Приоритет', key: 'priority', width: 15 },
            { header: 'Стоимость', key: 'cost', width: 15 },
        ]

        recommendations.forEach(item => {
            worksheet.addRow({
                article: item.product?.article,
                name: item.product?.name,
                stock: item.current_stock,
                sales: item.avg_daily_sales.toFixed(2),
                days: item.days_until_stockout.toFixed(1),
                qty: item.recommended_qty,
                priority: item.priority,
                cost: item.total_cost
            })
        })

        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, `Procurement_Recommendations_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const filteredData = recommendations.filter(item =>
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.article.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return <span className="px-2 py-1 rounded-md bg-red-500/20 text-red-500 text-xs font-bold">Критично</span>
            case 'high': return <span className="px-2 py-1 rounded-md bg-orange-500/20 text-orange-500 text-xs font-bold">Высокий</span>
            case 'medium': return <span className="px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-500 text-xs font-bold">Средний</span>
            default: return <span className="px-2 py-1 rounded-md bg-white/10 text-fintech-text-muted text-xs font-bold">Низкий</span>
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-[#0A0A0A] w-full max-w-[95vw] h-[90vh] rounded-[2rem] border border-fintech-border shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="px-8 py-6 border-b border-fintech-border flex justify-between items-center bg-black/80 backdrop-blur-md shrink-0 relative z-20">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ShoppingCart className="w-6 h-6 text-fintech-aqua" />
                            Рекомендации по закупкам
                            <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-500 text-xs font-bold border border-yellow-500/30">БЕТА</span>
                        </h2>
                        <p className="text-fintech-text-muted text-sm mt-1">
                            Оптимизация складских запасов и планирование заказов
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-fintech-text-muted hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs & Toolbar */}
                <div className="px-8 py-4 border-b border-fintech-border flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 bg-black/20">
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'what-to-buy' ? 'bg-fintech-aqua text-black shadow-lg' : 'text-fintech-text-muted hover:text-white hover:bg-white/5'}`}
                            onClick={() => setActiveTab('what-to-buy')}
                        >
                            Что закупить
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed text-fintech-text-muted`}
                            disabled
                        >
                            Когда закупить
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed text-fintech-text-muted`}
                            disabled
                        >
                            Бюджет
                        </button>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fintech-text-muted group-focus-within:text-fintech-aqua transition-colors" />
                            <input
                                type="text"
                                placeholder="Поиск товара..."
                                className="w-full bg-black/20 border border-fintech-border rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-fintech-text-muted focus:outline-none focus:border-fintech-aqua/50 focus:bg-black/40 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="px-4 py-2 rounded-xl border border-fintech-border text-fintech-text-muted hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Экспорт
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider">Товар</th>
                                <th className="px-6 py-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider text-right">Остаток</th>
                                <th className="px-6 py-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider text-right">Продажи/день</th>
                                <th className="px-6 py-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider text-right">Дней до 0</th>
                                <th className="px-6 py-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider text-right">Реком. объем</th>
                                <th className="px-6 py-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider text-center">Приоритет</th>
                                <th className="px-6 py-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider text-right">Стоимость</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-fintech-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-fintech-text-muted">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 border-2 border-fintech-aqua border-t-transparent rounded-full animate-spin mb-2"></div>
                                            Загрузка рекомендаций...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-fintech-text-muted">
                                        Нет рекомендаций для закупки
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{item.product?.name}</div>
                                            <div className="text-xs text-fintech-text-muted mt-0.5">{item.product?.article}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-fintech-text-muted font-mono">
                                            {item.current_stock}
                                        </td>
                                        <td className="px-6 py-4 text-right text-fintech-text-muted font-mono">
                                            {item.avg_daily_sales.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            <span className={item.days_until_stockout < 14 ? "text-red-500 font-bold" : "text-white"}>
                                                {item.days_until_stockout > 900 ? '>900' : item.days_until_stockout.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-fintech-aqua font-mono text-lg">
                                            {item.recommended_qty}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getPriorityBadge(item.priority)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-white font-mono">
                                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(item.total_cost)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
