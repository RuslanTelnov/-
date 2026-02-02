'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function ProductAnalytics() {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

    // Mock data for initial UI build - will replace with real data later
    const topProducts = [
        { name: 'iPhone 15 Pro Max', revenue: 12500000, margin: 15.2, sales: 45 },
        { name: 'Samsung S24 Ultra', revenue: 8900000, margin: 12.8, sales: 32 },
        { name: 'MacBook Air M3', revenue: 6500000, margin: 18.5, sales: 15 },
        { name: 'Dyson V15', revenue: 4200000, margin: 22.1, sales: 28 },
        { name: 'Sony WH-1000XM5', revenue: 2100000, margin: 25.4, sales: 55 },
    ]

    const categoryPerformance = [
        { name: 'Смартфоны', value: 65 },
        { name: 'Ноутбуки', value: 45 },
        { name: 'Бытовая техника', value: 30 },
        { name: 'Аудио', value: 25 },
        { name: 'Аксессуары', value: 15 },
    ]

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Общая выручка', value: '45.2M ₸', change: '+12.5%', color: 'text-fintech-aqua' },
                    { label: 'Валовая прибыль', value: '8.4M ₸', change: '+8.2%', color: 'text-fintech-green' },
                    { label: 'Средняя маржа', value: '18.6%', change: '-1.2%', color: 'text-yellow-500' },
                    { label: 'Продано товаров', value: '1,245', change: '+15.4%', color: 'text-fintech-purple' },
                ].map((stat, i) => (
                    <div key={i} className="glass-fintech p-6 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className={`w-16 h-16 ${stat.color}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                        </div>
                        <p className="text-sm text-fintech-text-muted uppercase tracking-wider mb-2">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <span className="text-2xl font-bold text-white">{stat.value}</span>
                            <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-fintech-green' : 'text-red-500'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Top Products Table */}
                <div className="lg:col-span-2 glass-fintech rounded-[2rem] p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Топ товаров</h3>
                        <div className="flex bg-black/20 rounded-lg p-1">
                            {['week', 'month', 'year'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeRange(t as any)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${timeRange === t
                                            ? 'bg-fintech-aqua text-black shadow-fintech-glow'
                                            : 'text-fintech-text-muted hover:text-white'
                                        }`}
                                >
                                    {t === 'week' ? 'Неделя' : t === 'month' ? 'Месяц' : 'Год'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-fintech-border">
                                    <th className="pb-4 text-sm font-medium text-fintech-text-muted pl-4">Название</th>
                                    <th className="pb-4 text-sm font-medium text-fintech-text-muted">Продажи</th>
                                    <th className="pb-4 text-sm font-medium text-fintech-text-muted">Выручка</th>
                                    <th className="pb-4 text-sm font-medium text-fintech-text-muted pr-4 text-right">Маржа</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-fintech-border/50">
                                {topProducts.map((product, i) => (
                                    <tr key={i} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-fintech-bg flex items-center justify-center text-xs font-bold text-fintech-text-muted border border-fintech-border">
                                                    {i + 1}
                                                </div>
                                                <span className="font-medium text-white group-hover:text-fintech-aqua transition-colors">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-fintech-text-main">{product.sales} шт.</td>
                                        <td className="py-4 text-fintech-text-main">{product.revenue.toLocaleString()} ₸</td>
                                        <td className="py-4 pr-4 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.margin > 20 ? 'bg-fintech-green/10 text-fintech-green' :
                                                    product.margin > 15 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {product.margin}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Performance Chart */}
                <div className="glass-fintech rounded-[2rem] p-8">
                    <h3 className="text-xl font-bold text-white mb-6">По категориям</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#0B1121', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {categoryPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00F0FF' : '#8B5CF6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="p-4 rounded-xl bg-fintech-bg/50 border border-fintech-border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-fintech-text-muted">Лидер роста</span>
                                <span className="text-xs font-bold text-fintech-green">+24%</span>
                            </div>
                            <p className="font-medium text-white">Смартфоны</p>
                        </div>
                        <div className="p-4 rounded-xl bg-fintech-bg/50 border border-fintech-border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-fintech-text-muted">Аутсайдер</span>
                                <span className="text-xs font-bold text-red-500">-5%</span>
                            </div>
                            <p className="font-medium text-white">Аксессуары</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
