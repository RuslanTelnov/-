
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Bell, X, AlertTriangle, TrendingDown, AlertCircle, PackageX } from 'lucide-react'

interface Alert {
    id: string
    type: 'critical_stock' | 'sales_anomaly' | 'margin_issue' | 'stagnant_stock'
    message: string
    data: any
    is_read: boolean
    created_at: string
}

export function AlertsCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchAlerts()

        // Subscribe to new alerts
        const channel = supabase
            .channel('alerts_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
                console.log('New alert received:', payload)
                fetchAlerts()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchAlerts = async () => {
        const { data } = await supabase
            .from('alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            setAlerts(data as Alert[])
            setUnreadCount(data.filter((a: Alert) => !a.is_read).length)
        }
    }

    const markAsRead = async (id: string) => {
        await supabase.from('alerts').update({ is_read: true }).eq('id', id)
        setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllAsRead = async () => {
        await supabase.from('alerts').update({ is_read: true }).eq('is_read', false)
        setAlerts(alerts.map(a => ({ ...a, is_read: true })))
        setUnreadCount(0)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'critical_stock': return <AlertCircle className="w-5 h-5 text-red-500" />
            case 'sales_anomaly': return <TrendingDown className="w-5 h-5 text-orange-500" />
            case 'margin_issue': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
            case 'stagnant_stock': return <PackageX className="w-5 h-5 text-gray-500" />
            default: return <Bell className="w-5 h-5 text-blue-500" />
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-fintech-text-muted hover:text-white"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border border-[#0A0A0A]">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-96 bg-[#0A0A0A] border border-fintech-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-fintech-border flex justify-between items-center bg-white/5 backdrop-blur-md">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Уведомления
                                <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[10px] font-bold border border-yellow-500/30">БЕТА</span>
                            </h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-fintech-aqua hover:underline">
                                    Прочитать все
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {alerts.length === 0 ? (
                                <div className="text-center py-8 text-fintech-text-muted text-sm">
                                    Нет новых уведомлений
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <div
                                        key={alert.id}
                                        className={`p-3 rounded-xl border transition-colors ${alert.is_read ? 'bg-transparent border-transparent opacity-60' : 'bg-white/5 border-fintech-border hover:bg-white/10'}`}
                                        onClick={() => markAsRead(alert.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                {getIcon(alert.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-white leading-snug">{alert.message}</p>
                                                <p className="text-xs text-fintech-text-muted mt-1">
                                                    {new Date(alert.created_at).toLocaleString('ru-RU')}
                                                </p>
                                                {alert.data?.items && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {alert.data.items.map((item: string, i: number) => (
                                                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-fintech-text-muted">
                                                                {item}
                                                            </span>
                                                        ))}
                                                        {alert.data.count > 5 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 text-fintech-text-muted">
                                                                +{alert.data.count - 5} еще
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {!alert.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-fintech-aqua mt-2 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
