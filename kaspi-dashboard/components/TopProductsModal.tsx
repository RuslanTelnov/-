import { useState, useMemo } from 'react'
import { X, Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ProfitItem } from '@/lib/types/dashboard'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface TopProductsModalProps {
    isOpen: boolean
    onClose: () => void
    items: ProfitItem[]
    warehouseName: string
}

type SortField = 'sell_quantity' | 'sales_margin' | 'sell_sum' | 'profit' | 'name'
type SortOrder = 'asc' | 'desc'

export function TopProductsModal({ isOpen, onClose, items, warehouseName }: TopProductsModalProps) {
    const [search, setSearch] = useState('')
    const [sortField, setSortField] = useState<SortField>('profit')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items]

        // Search
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(item =>
                (item.product?.name || '').toLowerCase().includes(q) ||
                (item.article || '').toLowerCase().includes(q)
            )
        }

        // Sort
        result.sort((a, b) => {
            let valA: number | string = 0
            let valB: number | string = 0

            const profitA = a.sell_sum - a.sell_cost_sum
            const profitB = b.sell_sum - b.sell_cost_sum

            // Calculate real margin % (Profit / Revenue)
            const marginA = a.sell_sum ? (profitA / a.sell_sum) * 100 : 0
            const marginB = b.sell_sum ? (profitB / b.sell_sum) * 100 : 0

            if (sortField === 'sell_quantity') {
                valA = a.sell_quantity
                valB = b.sell_quantity
            } else if (sortField === 'sales_margin') {
                valA = marginA
                valB = marginB
            } else if (sortField === 'sell_sum') {
                valA = a.sell_sum
                valB = b.sell_sum
            } else if (sortField === 'profit') {
                valA = profitA
                valB = profitB
            } else if (sortField === 'name') {
                valA = a.product?.name || ''
                valB = b.product?.name || ''
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [items, search, sortField, sortOrder])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
        return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-blue-500" /> : <ArrowDown className="w-4 h-4 text-blue-500" />
    }

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Лидеры продаж')

        worksheet.columns = [
            { header: 'Артикул', key: 'article', width: 15 },
            { header: 'Название', key: 'name', width: 40 },
            { header: 'Продано (шт)', key: 'quantity', width: 15 },
            { header: 'Выручка', key: 'revenue', width: 15 },
            { header: 'Себестоимость', key: 'cost', width: 15 },
            { header: 'Прибыль', key: 'profit', width: 15 },
            { header: 'Маржа (%)', key: 'margin', width: 15 }
        ]

        filteredAndSortedItems.forEach(item => {
            const profit = item.sell_sum - item.sell_cost_sum
            const margin = item.sell_sum ? (profit / item.sell_sum) * 100 : 0

            worksheet.addRow({
                article: item.article,
                name: item.product?.name || 'Без названия',
                quantity: item.sell_quantity,
                revenue: item.sell_sum,
                cost: item.sell_cost_sum,
                profit: profit,
                margin: margin
            })
        })

        worksheet.getRow(1).font = { bold: true }
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, `${warehouseName}_лидеры_продаж.xlsx`)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-8">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-6xl h-full max-h-[85vh] glass-fintech rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border border-fintech-border">
                {/* Header */}
                <div className="p-6 border-b border-fintech-border flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_#A855F7]"></span>
                            Лидеры продаж
                        </h2>
                        <p className="text-fintech-text-muted text-sm mt-1 ml-5">
                            Рекомендации к закупу (Топ по общей прибыли)
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-fintech-text-muted hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-fintech-border flex gap-4 justify-between items-center shrink-0">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fintech-text-muted group-focus-within:text-fintech-aqua transition-colors" />
                        <input
                            type="text"
                            placeholder="Поиск..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/20 border border-fintech-border rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-fintech-text-muted focus:outline-none focus:border-fintech-aqua/50 transition-all"
                        />
                    </div>
                    <button onClick={handleExport} className="px-4 py-2 rounded-xl border border-fintech-border text-fintech-text-muted hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-medium">
                        <Download className="w-4 h-4" />
                        <span>Экспорт</span>
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">Название <SortIcon field="name" /></div>
                                </th>
                                <th className="p-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('sell_quantity')}>
                                    <div className="flex items-center justify-end gap-2">Продано (шт) <SortIcon field="sell_quantity" /></div>
                                </th>
                                <th className="p-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('sell_sum')}>
                                    <div className="flex items-center justify-end gap-2">Выручка <SortIcon field="sell_sum" /></div>
                                </th>
                                <th className="p-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('profit')}>
                                    <div className="flex items-center justify-end gap-2">Прибыль <SortIcon field="profit" /></div>
                                </th>
                                <th className="p-4 text-xs font-medium text-fintech-text-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('sales_margin')}>
                                    <div className="flex items-center justify-end gap-2">Маржа % <SortIcon field="sales_margin" /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-fintech-border">
                            {filteredAndSortedItems.map((item) => {
                                const profit = item.sell_sum - item.sell_cost_sum
                                const margin = item.sell_sum ? (profit / item.sell_sum) * 100 : 0

                                return (
                                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-fintech-text-muted" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-white group-hover:text-fintech-aqua transition-colors">{item.product?.name || 'Без названия'}</div>
                                                    <div className="text-xs text-fintech-text-muted">{item.article}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-medium text-white">
                                            {item.sell_quantity}
                                        </td>
                                        <td className="p-4 text-right text-fintech-text-muted">
                                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(item.sell_sum)}
                                        </td>
                                        <td className="p-4 text-right font-bold text-fintech-green">
                                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(profit)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${margin >= 30 ? 'bg-fintech-green/10 text-fintech-green' :
                                                margin >= 15 ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                {margin.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function Package(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22v-10" />
        </svg>
    )
}
