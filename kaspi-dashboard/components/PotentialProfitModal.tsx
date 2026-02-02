import { useState, useMemo } from 'react'
import { X, Search, ArrowUpDown, ArrowUp, ArrowDown, DollarSign } from 'lucide-react'

interface PotentialProfitItem {
    id: string
    name: string
    article: string
    warehouse: string
    quantity: number
    costPrice: number
    salePrice: number
    potentialProfit: number
    image_url?: string
}

interface PotentialProfitModalProps {
    isOpen: boolean
    onClose: () => void
    items: PotentialProfitItem[]
}

type SortField = 'name' | 'warehouse' | 'quantity' | 'costPrice' | 'salePrice' | 'potentialProfit'
type SortDirection = 'asc' | 'desc'

export function PotentialProfitModal({ isOpen, onClose, items }: PotentialProfitModalProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<SortField>('potentialProfit')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items]

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            result = result.filter(item =>
                (item.name || '').toLowerCase().includes(lowerTerm) ||
                (item.article || '').toLowerCase().includes(lowerTerm) ||
                (item.warehouse || '').toLowerCase().includes(lowerTerm)
            )
        }

        result.sort((a, b) => {
            const aValue = a[sortField]
            const bValue = b[sortField]

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
            }

            // Handle null/undefined
            if (!aValue && bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue && !bValue) return sortDirection === 'asc' ? 1 : -1

            return 0
        })

        return result
    }, [items, searchTerm, sortField, sortDirection])

    if (!isOpen) return null

    const totalProfit = filteredAndSortedItems.reduce((sum, item) => sum + item.potentialProfit, 0)

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-fintech-text-muted opacity-50" />
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4 text-fintech-aqua" />
            : <ArrowDown className="w-4 h-4 text-fintech-aqua" />
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0B1121] border border-fintech-border rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fintech-green to-transparent opacity-50"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-fintech-green/10 blur-[80px] rounded-full pointer-events-none"></div>

                {/* Header */}
                <div className="p-6 border-b border-fintech-border flex justify-between items-center z-10 bg-[#0B1121]/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-fintech-green/10 text-fintech-green">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Потенциальная прибыль</h2>
                            <p className="text-fintech-text-muted text-sm">Детализация по товарам в наличии</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 text-fintech-text-muted hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Controls & Summary */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#0B1121]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fintech-text-muted" />
                        <input
                            type="text"
                            placeholder="Поиск по названию, артикулу..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-fintech-border rounded-xl py-3 pl-12 pr-4 text-white placeholder-fintech-text-muted focus:outline-none focus:border-fintech-green/50 transition-colors"
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-fintech-text-muted uppercase tracking-wider">Итого по списку</p>
                            <p className="text-2xl font-bold text-fintech-green text-glow">
                                {totalProfit.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0B1121] z-10 shadow-sm">
                            <tr className="border-b border-fintech-border/50">
                                <th className="p-4 pl-8 font-medium text-fintech-text-muted text-sm cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">Товар <SortIcon field="name" /></div>
                                </th>
                                <th className="p-4 font-medium text-fintech-text-muted text-sm cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('warehouse')}>
                                    <div className="flex items-center gap-2">Склад <SortIcon field="warehouse" /></div>
                                </th>
                                <th className="p-4 font-medium text-fintech-text-muted text-sm text-right cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('quantity')}>
                                    <div className="flex items-center justify-end gap-2">Кол-во <SortIcon field="quantity" /></div>
                                </th>
                                <th className="p-4 font-medium text-fintech-text-muted text-sm text-right cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('costPrice')}>
                                    <div className="flex items-center justify-end gap-2">Себест. <SortIcon field="costPrice" /></div>
                                </th>
                                <th className="p-4 font-medium text-fintech-text-muted text-sm text-right cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('salePrice')}>
                                    <div className="flex items-center justify-end gap-2">Цена прод. <SortIcon field="salePrice" /></div>
                                </th>
                                <th className="p-4 pr-8 font-medium text-fintech-text-muted text-sm text-right cursor-pointer hover:text-white transition-colors group" onClick={() => handleSort('potentialProfit')}>
                                    <div className="flex items-center justify-end gap-2">Прибыль <SortIcon field="potentialProfit" /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-fintech-border/30">
                            {filteredAndSortedItems.length > 0 ? (
                                filteredAndSortedItems.map((item) => (
                                    <tr key={`${item.id}-${item.warehouse}`} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 pl-8">
                                            <div className="flex items-center gap-3">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-fintech-text-muted text-xs">IMG</div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-white line-clamp-1 group-hover:text-fintech-aqua transition-colors">{item.name}</div>
                                                    <div className="text-xs text-fintech-text-muted">{item.article}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-fintech-text-muted">
                                            <span className={`px-2 py-1 rounded-md text-xs ${item.warehouse === 'Основной склад' ? 'bg-fintech-purple/10 text-fintech-purple' : 'bg-white/5'}`}>
                                                {item.warehouse}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">{item.quantity}</td>
                                        <td className="p-4 text-right font-mono text-fintech-text-muted">{item.costPrice.toLocaleString('ru-RU')} ₸</td>
                                        <td className="p-4 text-right font-mono text-white">{item.salePrice.toLocaleString('ru-RU')} ₸</td>
                                        <td className="p-4 pr-8 text-right font-mono font-bold text-fintech-green">
                                            {item.potentialProfit.toLocaleString('ru-RU')} ₸
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-fintech-text-muted">
                                        Ничего не найдено
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
