
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ShoppingCart, AlertTriangle } from 'lucide-react'
export function ProcurementCard({ onClick }: { onClick: () => void }) {
    const [stats, setStats] = useState({
        criticalCount: 0,
        highCount: 0,
        totalBudget: 0,
        totalItems: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        const { data, error } = await supabase
            .from('procurement_recommendations')
            .select('priority, total_cost, recommended_qty')
            .gt('recommended_qty', 0)

        if (error) {
            console.error('Error fetching procurement stats:', error)
            return
        }

        let critical = 0
        let high = 0
        let budget = 0
        let items = 0

        data?.forEach(item => {
            if (item.priority === 'critical') critical++
            if (item.priority === 'high') high++
            budget += item.total_cost || 0
            items++
        })

        setStats({
            criticalCount: critical,
            highCount: high,
            totalBudget: budget,
            totalItems: items
        })
        setLoading(false)
    }

    return (
        <div
            className="glass-fintech p-4 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-colors cursor-pointer border-l-4 border-l-blue-500"
            onClick={onClick}
        >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingCart className="w-12 h-12 text-blue-500" />
            </div>
            <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-fintech-text-muted uppercase tracking-wider">Рекомендации по закупкам</p>
                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[10px] font-bold border border-yellow-500/30">БЕТА</span>
            </div>

            <div className="flex justify-between items-end mt-2">
                <div>
                    <div className="text-2xl font-bold text-white">{stats.totalItems} товаров</div>
                    <p className="text-xs text-fintech-text-muted mt-1">
                        Требуют внимания
                    </p>
                </div>
                <div className="flex flex-col items-end text-xs">
                    {stats.criticalCount > 0 && (
                        <div className="flex items-center text-red-400 font-bold mb-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {stats.criticalCount} критичных
                        </div>
                    )}
                    <div className="text-fintech-text-muted">
                        Бюджет: {(stats.totalBudget / 1000000).toFixed(1)}M ₸
                    </div>
                </div>
            </div>

            <div className="mt-4 text-xs text-fintech-aqua flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Открыть детали →
            </div>
        </div>
    )
}

