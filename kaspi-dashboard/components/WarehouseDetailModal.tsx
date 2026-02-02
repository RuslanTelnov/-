
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getWarehouseName } from '@/lib/utils/warehouse'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { X, Download, Search, ArrowUpDown, ArrowUp, ArrowDown, Package, DollarSign, TrendingUp, Layers, Filter } from 'lucide-react'
import { Calculator } from '@/lib/utils/calculator'
import { StockItem, SortField, SortOrder } from '@/lib/types/dashboard'
import { StockTable } from './StockTable'
import { AgingDetailsModal } from './AgingDetailsModal'
import { TopProductsModal } from './TopProductsModal'
import { ProfitItem } from '@/lib/types/dashboard'

interface WarehouseDetailModalProps {
    warehouseName: string
    onClose: () => void
}

export function WarehouseDetailModal({ warehouseName, onClose }: WarehouseDetailModalProps) {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<StockItem[]>([])
    const [filter, setFilter] = useState<'all' | '0-15' | '15-30' | '30-45' | '45+'>('all') // Keeping filter for backward compatibility if needed, but mainly using selectedAgingBucket now
    const [selectedAgingBucket, setSelectedAgingBucket] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [sortField, setSortField] = useState<SortField>('days_in_stock')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [profitItems, setProfitItems] = useState<ProfitItem[]>([])
    const [topProductsModalOpen, setTopProductsModalOpen] = useState(false)

    // Load data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // 1. Get all stores
                const { data: stores } = await supabase.from('stores').select('id, name')

                if (!stores) return

                // 2. Filter stores by warehouse name
                const targetStoreIds = stores
                    .filter(s => getWarehouseName(s.name) === warehouseName)
                    .map(s => s.id)

                if (targetStoreIds.length === 0) {
                    setItems([])
                    setLoading(false)
                    return
                }

                // 3. Fetch stock
                let query = supabase
                    .from('stock')
                    .select(`
            id,
            product_id,
            store_id,
            stock,
            reserve,
            stock_days,
            days_in_stock,
            product:products (
              article,
              name,
              cost_price,
              sale_price,
              price,
              kaspi_price,
              image_url
            )
          `)
                    .in('store_id', targetStoreIds)

                // For Preorder, we want items with reserve > 0 OR stock > 0
                // But Supabase simple filtering doesn't support OR easily in one chain without 'or' builder
                // .or('stock.gt.0,reserve.gt.0')

                if (warehouseName === 'Склад предзаказов') {
                    query = query.or('stock.gt.0,reserve.gt.0')
                } else {
                    query = query.gt('stock', 0)
                }

                const { data: stockData, error } = await query

                if (error) throw error

                let processedItems = (stockData as any[])
                    .filter(item => item.product) // Filter out items with no product relation
                    .map(item => ({
                        ...item,
                        // Ensure days_in_stock is a number
                        days_in_stock: Number(item.days_in_stock ?? item.stock_days ?? 0),
                        // Ensure product has default values to prevent crashes
                        product: {
                            ...item.product,
                            name: item.product.name || 'Unknown Product',
                            article: item.product.article || '-',
                            cost_price: item.product.cost_price || 0,
                            sale_price: item.product.sale_price || 0,
                            price: item.product.price || 0
                        }
                    }))

                setItems(processedItems)



                // 4. Fetch Profit Data (Now for all warehouses, filtered by presence)
                const { data: profitData } = await supabase
                    .from('profit_by_product')
                    .select(`
                        *,
                        product:products (
                            name,
                            article
                        )
                    `)
                    .gt('sell_quantity', 0)
                    .limit(5000)

                if (profitData) {
                    // Filter profit data to show only products present in this warehouse
                    const warehouseProductIds = new Set(processedItems.map(i => i.product_id))
                    const filteredProfitData = (profitData as unknown as ProfitItem[])
                        .filter(p => warehouseProductIds.has(p.product_id))
                        .sort((a, b) => {
                            const profitA = (a.sell_sum || 0) - (a.sell_cost_sum || 0)
                            const profitB = (b.sell_sum || 0) - (b.sell_cost_sum || 0)
                            return profitB - profitA
                        })
                    setProfitItems(filteredProfitData)
                }
            } catch (err) {
                console.error('Error fetching warehouse details:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [warehouseName])


    // Analytics (for all warehouses)
    const analytics = useMemo(() => {
        // if (warehouseName !== 'Основной склад') return null

        const groups = {
            '0-15': { count: 0, value: 0, color: 'bg-green-100 text-green-800' },
            '15-30': { count: 0, value: 0, color: 'bg-yellow-100 text-yellow-800' },
            '30-45': { count: 0, value: 0, color: 'bg-orange-100 text-orange-800' },
            '45+': { count: 0, value: 0, color: 'bg-red-100 text-red-800' }
        }

        let totalValue = 0

        items.forEach(item => {
            const days = item.days_in_stock
            const value = item.stock * (item.product.cost_price || 0)
            totalValue += value

            if (days <= 15) {
                groups['0-15'].count++
                groups['0-15'].value += value
            } else if (days <= 30) {
                groups['15-30'].count++
                groups['15-30'].value += value
            } else if (days <= 45) {
                groups['30-45'].count++
                groups['30-45'].value += value
            } else {
                groups['45+'].count++
                groups['45+'].value += value
            }
        })

        return { groups, totalValue }
    }, [items, warehouseName])

    // Filtering and Sorting
    const filteredItems = useMemo(() => {
        let result = [...items]

        // Filter by days (REMOVED - now handled by separate modal)
        // if (filter !== 'all') { ... }

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
            } else if (sortField === 'total_value') {
                const priceA = warehouseName === 'Склад предзаказов' ? (a.product.sale_price || a.product.price || 0) : (a.product.cost_price || 0)
                const priceB = warehouseName === 'Склад предзаказов' ? (b.product.sale_price || b.product.price || 0) : (b.product.cost_price || 0)
                const qtyA = warehouseName === 'Склад предзаказов' ? a.reserve : a.stock
                const qtyB = warehouseName === 'Склад предзаказов' ? b.reserve : b.stock
                valA = qtyA * priceA
                valB = qtyB * priceB
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [items, filter, search, sortField, sortOrder, warehouseName])

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Остатки')

        // Define columns
        worksheet.columns = [
            { header: 'Артикул', key: 'article', width: 15 },
            { header: 'Название', key: 'name', width: 40 },
            { header: 'Количество', key: 'quantity', width: 15 },
            { header: 'Цена', key: 'price', width: 15 },
            { header: 'Сумма', key: 'sum', width: 15 },
            ...(warehouseName === 'Основной склад' ? [{ header: 'Дней на складе', key: 'days', width: 15 }] : [])
        ]

        // Add rows
        filteredItems.forEach(item => {
            const isPreorder = warehouseName === 'Склад предзаказов'
            const qty = isPreorder ? item.reserve : item.stock
            const price = isPreorder ? (item.product.sale_price || item.product.price) : item.product.cost_price

            worksheet.addRow({
                article: item.product.article,
                name: item.product.name,
                quantity: qty,
                price: price,
                sum: qty * (price || 0),
                ...(warehouseName === 'Основной склад' ? { days: item.days_in_stock } : {})
            })
        })

        // Style header row
        worksheet.getRow(1).font = { bold: true }

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer()

        // Save file
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, `${warehouseName}_детализация.xlsx`)
    }

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

    const isMainWarehouse = warehouseName === 'Основной склад'
    const metrics = useMemo(() => {
        let totalItems = 0
        let totalValue = 0
        let totalPrice = 0
        let count = 0

        filteredItems.forEach(item => {
            const qty = warehouseName === 'Склад предзаказов' ? item.reserve : item.stock
            const price = warehouseName === 'Склад предзаказов' ? (item.product.sale_price || item.product.price || 0) : (item.product.cost_price || 0)

            totalItems += qty
            totalValue += qty * price
            if (price > 0) {
                totalPrice += price
                count++
            }
        })

        return {
            totalItems,
            totalValue,
            avgPrice: count > 0 ? totalPrice / count : 0
        }
    }, [filteredItems, warehouseName])

    if (!warehouseName) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-6xl h-full max-h-[90vh] glass-fintech rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-fintech-border flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-fintech-aqua rounded-full shadow-[0_0_10px_#00F0FF]"></span>
                            {warehouseName}
                        </h2>
                        <p className="text-fintech-text-muted text-sm mt-1 ml-5">Детализация остатков</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium">Товаров</span>
                                <span className="text-sm font-bold text-white">{metrics.totalItems.toLocaleString('ru-RU')} шт.</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium">Оценка</span>
                                <span className="text-sm font-bold text-fintech-aqua">{metrics.totalValue.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium">Ср. цена</span>
                                <span className="text-sm font-bold text-white">{metrics.avgPrice.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-fintech-text-muted hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Inventory Aging Metrics */}
                {analytics && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 shrink-0 bg-black/20 border-b border-fintech-border">
                        {/* Top Products Card */}
                        <div
                            onClick={() => setTopProductsModalOpen(true)}
                            className="glass-fintech p-4 rounded-xl border transition-all duration-300 flex flex-col relative overflow-hidden group cursor-pointer border-fintech-border/50 hover:bg-white/5 hover:border-fintech-border"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-1.5 bg-purple-500 shadow-[0_0_10px_#A855F7]"></div>
                            <div className="pl-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium uppercase tracking-wider text-fintech-text-muted group-hover:text-white transition-colors">Лидеры продаж</span>
                                    <TrendingUp className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white tracking-tight">{profitItems.length}</span>
                                    <span className="text-xs text-fintech-text-muted font-medium">товаров</span>
                                </div>
                                <div className="mt-3 text-xs text-fintech-text-muted">
                                    Топ по выручке и марже
                                </div>
                            </div>
                        </div>

                        {Object.entries(analytics.groups).map(([key, group]: [string, any]) => {
                            // Calculate percent based on total SKU count (items.length), not total quantity
                            const percent = items.length > 0 ? (group.count / items.length) * 100 : 0
                            const isActive = filter === key

                            return (
                                <div
                                    key={key}
                                    onClick={() => setSelectedAgingBucket(key)}
                                    className={`glass-fintech p-4 rounded-xl border transition-all duration-300 flex flex-col relative overflow-hidden group cursor-pointer border-fintech-border/50 hover:bg-white/5 hover:border-fintech-border`}
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-1.5 ${key === '0-15' ? 'bg-fintech-green shadow-[0_0_10px_#22C55E]' :
                                        key === '15-30' ? 'bg-yellow-500 shadow-[0_0_10px_#EAB308]' :
                                            key === '30-45' ? 'bg-orange-500 shadow-[0_0_10px_#F97316]' : 'bg-red-500 shadow-[0_0_10px_#EF4444]'
                                        }`}></div>
                                    <div className="pl-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-xs font-medium uppercase tracking-wider ${isActive ? 'text-white' : 'text-fintech-text-muted'}`}>{key} дней</span>
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${key === '0-15' ? 'bg-fintech-green/10 text-fintech-green' :
                                                key === '15-30' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    key === '30-45' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                                                }`}>{percent.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-white tracking-tight">{group.count}</span>
                                            <span className="text-xs text-fintech-text-muted font-medium">товаров</span>
                                        </div>
                                        {/* Progress bar visual */}
                                        <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${key === '0-15' ? 'bg-fintech-green' :
                                                    key === '15-30' ? 'bg-yellow-500' :
                                                        key === '30-45' ? 'bg-orange-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-fintech-border flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                    <div className="relative w-full sm:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fintech-text-muted group-focus-within:text-fintech-aqua transition-colors" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или артикулу..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/20 border border-fintech-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-fintech-text-muted focus:outline-none focus:border-fintech-aqua/50 focus:bg-black/40 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-fintech-border text-fintech-text-muted hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                            <Filter className="w-4 h-4" />
                            <span>Фильтры</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-fintech-border text-fintech-text-muted hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            <span>Экспорт CSV</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-fintech-text-muted">
                            <div className="w-12 h-12 border-4 border-fintech-aqua border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Загрузка данных...</p>
                        </div>
                    ) : (
                        <StockTable
                            items={filteredItems}
                            warehouseName={warehouseName}
                            sortField={sortField}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            isMainWarehouse={isMainWarehouse}
                        />
                    )}
                </div>
            </div>

            {/* Aging Details Modal */}
            {selectedAgingBucket && analytics && (
                <AgingDetailsModal
                    isOpen={!!selectedAgingBucket}
                    onClose={() => setSelectedAgingBucket(null)}
                    title={`${selectedAgingBucket} дней`}
                    items={items.filter(item => {
                        const days = item.days_in_stock
                        if (selectedAgingBucket === '0-15') return days <= 15
                        if (selectedAgingBucket === '15-30') return days > 15 && days <= 30
                        if (selectedAgingBucket === '30-45') return days > 30 && days <= 45
                        if (selectedAgingBucket === '45+') return days > 45
                        return false
                    })}
                    warehouseName={warehouseName}
                    bucketColor={
                        selectedAgingBucket === '0-15' ? 'bg-fintech-green text-fintech-green' :
                            selectedAgingBucket === '15-30' ? 'bg-yellow-500 text-yellow-500' :
                                selectedAgingBucket === '30-45' ? 'bg-orange-500 text-orange-500' : 'bg-red-500 text-red-500'
                    }
                />
            )}

            {/* Top Products Modal */}
            <TopProductsModal
                isOpen={topProductsModalOpen}
                onClose={() => setTopProductsModalOpen(false)}
                items={profitItems}
                warehouseName={warehouseName}
            />
        </div>
    )
}

