'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jmughirkxcsiwfgdckbf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdWdoaXJreGNzaXdmZ2Rja2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjYwODIsImV4cCI6MjA3OTkwMjA4Mn0.tMxdWYIsFDionp3qiudulhkWqUViu23KbNi-Fo5R0HQ'
const supabase = createClient(supabaseUrl, supabaseKey)

export default function TestPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        async function loadData() {
            try {
                console.log('🔌 Connecting to Supabase...')
                console.log('URL:', supabaseUrl)

                const [productsRes, salesRes, storesRes] = await Promise.all([
                    supabase.from('products').select('*', { count: 'exact', head: true }).eq('archived', false),
                    supabase.from('sales').select('*', { count: 'exact', head: true }),
                    supabase.from('stores').select('*', { count: 'exact', head: true })
                ])

                console.log('Products:', productsRes)
                console.log('Sales:', salesRes)
                console.log('Stores:', storesRes)

                if (productsRes.error) throw productsRes.error
                if (salesRes.error) throw salesRes.error
                if (storesRes.error) throw storesRes.error

                setData({
                    products: productsRes.count,
                    sales: salesRes.count,
                    stores: storesRes.count
                })
            } catch (err: any) {
                console.error('❌ Error:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white text-2xl">Загрузка данных...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-red-500 text-2xl">Ошибка: {error}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">✅ Тест подключения к Supabase</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-8 shadow-2xl">
                        <div className="text-white/80 text-sm uppercase mb-2">Товары</div>
                        <div className="text-5xl font-bold text-white">{data?.products || 0}</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-8 shadow-2xl">
                        <div className="text-white/80 text-sm uppercase mb-2">Продажи</div>
                        <div className="text-5xl font-bold text-white">{data?.sales || 0}</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 shadow-2xl">
                        <div className="text-white/80 text-sm uppercase mb-2">Склады</div>
                        <div className="text-5xl font-bold text-white">{data?.stores || 0}</div>
                    </div>
                </div>

                <div className="mt-8 bg-slate-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Детали подключения:</h2>
                    <div className="text-green-400 font-mono text-sm">
                        <div>✅ Supabase URL: {supabaseUrl}</div>
                        <div>✅ Данные загружены успешно</div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <a href="/" className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-xl transition">
                        Вернуться на главную
                    </a>
                </div>
            </div>
        </div>
    )
}
