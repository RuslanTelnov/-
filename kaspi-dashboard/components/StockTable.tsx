import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { StockItem, SortField, SortOrder } from '@/lib/types/dashboard'

interface StockTableProps {
    items: StockItem[]
    warehouseName: string
    sortField: SortField
    sortOrder: SortOrder
    onSort: (field: SortField) => void
    isMainWarehouse: boolean
}

export function StockTable({ items, warehouseName, sortField, sortOrder, onSort, isMainWarehouse }: StockTableProps) {
    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
        return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-blue-500" /> : <ArrowDown className="w-4 h-4 text-blue-500" />
    }

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-fintech-text-muted">
                <p>Ничего не найдено.</p>
            </div>
        )
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#020617] z-10 shadow-sm">
                <tr>
                    <th className="py-4 px-6 text-xs font-medium text-fintech-text-muted uppercase tracking-wider border-b border-fintech-border cursor-pointer hover:text-white" onClick={() => onSort('name')}>
                        <div className="flex items-center gap-1">Наименование <SortIcon field="name" /></div>
                    </th>
                    <th
                        className="py-4 px-6 text-xs font-medium text-fintech-text-muted uppercase tracking-wider border-b border-fintech-border cursor-pointer hover:text-white transition-colors text-right"
                        onClick={() => onSort('stock')}
                    >
                        <div className="flex items-center justify-end gap-1">
                            Остаток
                            <SortIcon field="stock" />
                        </div>
                    </th>
                    <th className="py-4 px-6 text-xs font-medium text-fintech-text-muted uppercase tracking-wider border-b border-fintech-border text-right cursor-pointer hover:text-white" onClick={() => onSort('cost_price')}>
                        <div className="flex items-center justify-end gap-1">Себестоимость <SortIcon field="cost_price" /></div>
                    </th>
                    <th className="py-4 px-6 text-xs font-medium text-fintech-text-muted uppercase tracking-wider border-b border-fintech-border text-right">Цена Kaspi</th>
                    <th className="py-4 px-6 text-xs font-medium text-fintech-text-muted uppercase tracking-wider border-b border-fintech-border text-right">Маржа</th>
                    {isMainWarehouse && (
                        <th className="py-4 px-6 text-xs font-medium text-fintech-text-muted uppercase tracking-wider border-b border-fintech-border text-right cursor-pointer hover:text-white" onClick={() => onSort('days_in_stock')}>
                            <div className="flex items-center justify-end gap-1">Возраст <SortIcon field="days_in_stock" /></div>
                        </th>
                    )}
                </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border">
                {items.map((item) => {
                    const kaspiPrice = item.product.kaspi_price || 0
                    const costPrice = item.product.cost_price || 0
                    const margin = kaspiPrice - costPrice
                    const marginPercent = kaspiPrice > 0 ? (margin / kaspiPrice) * 100 : 0
                    const isPreorder = warehouseName === 'Склад предзаказов'
                    const qty = isPreorder ? item.reserve : item.stock

                    return (
                        <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6">
                                <div className="flex flex-col">
                                    <span className="font-medium text-white group-hover:text-fintech-aqua transition-colors">{item.product?.name || 'Unknown Product'}</span>
                                    <span className="text-xs text-fintech-text-muted font-mono mt-0.5">{item.product?.article || 'No SKU'}</span>
                                </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                                <span className={`font-mono font-medium ${qty > 0 ? 'text-white' : 'text-fintech-text-muted'}`}>
                                    {qty}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-fintech-text-muted">
                                {(costPrice).toLocaleString('ru-RU')} ₸
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-white">
                                {kaspiPrice > 0 ? `${kaspiPrice.toLocaleString('ru-RU')} ₸` : '-'}
                            </td>
                            <td className="py-4 px-6 text-right">
                                {kaspiPrice > 0 ? (
                                    <div className="flex flex-col items-end">
                                        <span className={`font-mono font-bold ${margin > 0 ? 'text-fintech-green' : 'text-red-500'}`}>
                                            {margin.toLocaleString('ru-RU')} ₸
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${marginPercent < 15 ? 'bg-red-500/20 text-red-400' : 'bg-fintech-green/10 text-fintech-green'}`}>
                                            {marginPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-fintech-text-muted">-</span>
                                )}
                            </td>
                            {isMainWarehouse && (
                                <td className="py-4 px-6 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${(item.days_in_stock || 0) > 60 ? 'bg-red-500/10 text-red-500' :
                                        (item.days_in_stock || 0) > 30 ? 'bg-yellow-500/10 text-yellow-500' :
                                            'bg-fintech-green/10 text-fintech-green'
                                        }`}>
                                        {item.days_in_stock || 0} дн.
                                    </span>
                                </td>
                            )}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}
