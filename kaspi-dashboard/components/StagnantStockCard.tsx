
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { PackageX, ChevronRight } from 'lucide-react'
import { StagnantStockModal } from './StagnantStockModal'

export function StagnantStockCard() {
    const [count, setCount] = useState(0)
    const [items, setItems] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchStagnantStock()

        // Subscribe to updates
        const channel = supabase
            .channel('stagnant_stock_card')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts', filter: 'type=eq.stagnant_stock' }, (payload) => {
                fetchStagnantStock()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchStagnantStock = async () => {
        const { data } = await supabase
            .from('alerts')
            .select('data')
            .eq('type', 'stagnant_stock')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (data?.data) {
            setCount(data.data.count || 0)
            setItems(data.data.all_items || [])
        }
    }

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="glass-fintech p-4 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-fintech-aqua/30"
            >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PackageX className="w-12 h-12 text-gray-500" />
                </div>

                <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-fintech-text-muted uppercase tracking-wider">Застой товара</p>
                    <span className="px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[10px] font-bold border border-gray-500/30">БЕТА</span>
                </div>

                <div className="flex justify-between items-end mt-2">
                    <div>
                        <div className="text-2xl font-bold text-white">{count} товаров</div>
                        <p className="text-xs text-fintech-text-muted mt-1">Без продаж &gt; 45 дней</p>
                    </div>

                    <div className="flex items-center gap-1 text-fintech-aqua opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium">Подробнее</span>
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <StagnantStockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                items={items}
            />
        </>
    )
}
