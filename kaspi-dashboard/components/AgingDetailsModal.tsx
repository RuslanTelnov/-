import { useState, useMemo } from 'react'
import { X, Search, Download } from 'lucide-react'
import { StockItem, SortField, SortOrder } from '@/lib/types/dashboard'
import { StockTable } from './StockTable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface AgingDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    items: StockItem[]
    warehouseName: string
    bucketColor: string
}

export function AgingDetailsModal({ isOpen, onClose, title, items, warehouseName, bucketColor }: AgingDetailsModalProps) {
    const [search, setSearch] = useState('')
    const [sortField, setSortField] = useState<SortField>('days_in_stock')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items]

        // Search
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(item =>
                item.product.name.toLowerCase().includes(q) ||
                item.product.article?.toLowerCase().includes(q)
            )
        }

        // Sort
        result.sort((a, b) => {
            let valA: number | string = 0
            let valB: number | string = 0

            if (sortField === 'days_in_stock') {
                valA = a.days_in_stock
                valB = b.days_in_stock
            } else if (sortField === 'stock') {
                valA = warehouseName === 'Склад предзаказов' ? a.reserve : a.stock
                valB = warehouseName === 'Склад предзаказов' ? b.reserve : b.stock
            } else if (sortField === 'cost_price') {
                valA = a.product.cost_price || 0
                valB = b.product.cost_price || 0
            } else if (sortField === 'name') {
                valA = a.product.name
                valB = b.product.name
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [items, search, sortField, sortOrder, warehouseName])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Детализация')

        worksheet.columns = [
            { header: 'Артикул', key: 'article', width: 15 },
            { header: 'Название', key: 'name', width: 40 },
            { header: 'Количество', key: 'quantity', width: 15 },
            { header: 'Цена', key: 'price', width: 15 },
            { header: 'Сумма', key: 'sum', width: 15 },
            { header: 'Дней на складе', key: 'days', width: 15 }
        ]

        filteredAndSortedItems.forEach(item => {
            const isPreorder = warehouseName === 'Склад предзаказов'
            const qty = isPreorder ? item.reserve : item.stock
            const price = isPreorder ? (item.product.sale_price || item.product.price) : item.product.cost_price

            worksheet.addRow({
                article: item.product.article,
                name: item.product.name,
                quantity: qty,
                price: price,
                sum: qty * (price || 0),
                days: item.days_in_stock
            })
        })

        worksheet.getRow(1).font = { bold: true }
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, `${warehouseName}_${title}.xlsx`)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-8">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-5xl h-full max-h-[85vh] glass-fintech rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border border-fintech-border">
                {/* Header */}
                <div className="p-6 border-b border-fintech-border flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className={`w-2 h-8 rounded-full shadow-[0_0_10px_currentColor] ${bucketColor}`}></span>
                            {title}
                        </h2>
                        <p className="text-fintech-text-muted text-sm mt-1 ml-5">
                            {filteredAndSortedItems.length} товаров
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
                    <StockTable
                        items={filteredAndSortedItems}
                        warehouseName={warehouseName}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        isMainWarehouse={true}
                    />
                </div>
            </div>
        </div>
    )
}
