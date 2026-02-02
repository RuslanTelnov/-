'use client'

import { X, PackageX } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface StagnantItem {
    name: string
    stock: number
    cost_price: number
    value: number
}

interface StagnantStockModalProps {
    isOpen: boolean
    onClose: () => void
    items: StagnantItem[]
}

export function StagnantStockModal({ isOpen, onClose, items }: StagnantStockModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Prevent scrolling when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen || !mounted) return null

    const totalValue = items.reduce((sum, item) => sum + item.value, 0)

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-[#0A0A0A] w-full max-w-4xl h-[80vh] rounded-[2rem] border border-fintech-border shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-fintech-border flex justify-between items-center bg-black/40 backdrop-blur-md shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <PackageX className="w-6 h-6 text-gray-500" />
                            Застой товара
                            <span className="px-2 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-xs font-bold border border-gray-500/30">
                                {items.length} шт
                            </span>
                        </h2>
                        <p className="text-fintech-text-muted text-sm mt-1">
                            Товары без продаж более 30 дней. Общая сумма: <span className="text-white font-bold">{totalValue.toLocaleString('ru-RU')} ₸</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-fintech-text-muted hover:text-white transition-colors z-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-fintech-text-muted text-xs uppercase tracking-wider border-b border-fintech-border">
                                <th className="pb-4 pl-4 font-medium">Товар</th>
                                <th className="pb-4 font-medium text-right">Остаток</th>
                                <th className="pb-4 font-medium text-right">Себестоимость</th>
                                <th className="pb-4 pr-4 font-medium text-right">Сумма</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {items.map((item, index) => (
                                <tr key={index} className="group hover:bg-white/5 transition-colors border-b border-fintech-border/50 last:border-0">
                                    <td className="py-4 pl-4 text-white font-medium">{item.name}</td>
                                    <td className="py-4 text-right text-fintech-text-muted">{item.stock} шт</td>
                                    <td className="py-4 text-right text-fintech-text-muted">{item.cost_price.toLocaleString('ru-RU')} ₸</td>
                                    <td className="py-4 pr-4 text-right text-white font-bold">{item.value.toLocaleString('ru-RU')} ₸</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-fintech-border bg-black/40 backdrop-blur-md shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
