'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Calculator } from '@/lib/utils/calculator'
import { getWarehouseName } from '@/lib/utils/warehouse'
import { WarehouseDetailModal } from './WarehouseDetailModal'
import { StagnantStockModal } from './StagnantStockModal'
import { AgentPanel } from './AgentPanel'
import { SyncModal } from './SyncModal'
import { ProcurementCard } from './ProcurementCard'
import { AlertsCenter } from './AlertsCenter'
import { StagnantStockCard } from './StagnantStockCard'
import { MissingCostAlert } from './MissingCostAlert'
import { KaspiPriceSync } from './KaspiPriceSync'
import { PotentialProfitModal } from './PotentialProfitModal'
import { MonthSalesModal, MonthSalesItem } from './MonthSalesModal'
import { ProcurementRecommendationsModal } from './ProcurementRecommendationsModal'

interface FinancialData {
  totalBalance: number
  logisticsReserve: number
  balanceMinusReserve: number
}

interface WarehouseData {
  name: string
  nomenclatureCount: number
  quantityInPieces: number
  totalValue: number
  reserveQuantity?: number
  reserveValue?: number
  potentialProfit?: number
}

interface DashboardStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  lowStockItems: number
  avgMargin: number
  avgTurnover: number
  highPriorityItems: number
  potentialProfit: number
  monthSales: number
}

interface DashboardProps { }

export default function Dashboard({ }: DashboardProps) {
  // DEMO DATA for video presentation (reduced amounts)
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 850,
    totalSales: 1240,
    totalRevenue: 8450000,
    lowStockItems: 23,
    avgMargin: 28.5,
    avgTurnover: 3.2,
    highPriorityItems: 45,
    potentialProfit: 1850000,
    monthSales: 2750000,
  })

  const [financialData, setFinancialData] = useState<any>({
    totalBalance: 4500000,
    logisticsReserve: 675000,
    balanceMinusReserve: 3825000,
  })

  const [warehousesData, setWarehousesData] = useState<WarehouseData[]>([
    {
      name: 'Склад Китай',
      nomenclatureCount: 120,
      quantityInPieces: 1850,
      totalValue: 950000,
      reserveQuantity: 50,
      reserveValue: 85000,
      potentialProfit: 280000
    },
    {
      name: 'Основной склад',
      nomenclatureCount: 580,
      quantityInPieces: 8500,
      totalValue: 3200000,
      reserveQuantity: 350,
      reserveValue: 420000,
      potentialProfit: 1150000
    },
    {
      name: 'Склад предзаказов',
      nomenclatureCount: 85,
      quantityInPieces: 680,
      totalValue: 580000,
      reserveQuantity: 680,
      reserveValue: 580000,
      potentialProfit: 180000
    },
    {
      name: 'Склад транзит',
      nomenclatureCount: 65,
      quantityInPieces: 920,
      totalValue: 720000,
      reserveQuantity: 0,
      reserveValue: 0,
      potentialProfit: 240000
    }
  ])

  const [loading, setLoading] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null)
  const [avgMarginState, setAvgMarginState] = useState<number>(28.5)
  const [missingCostProducts, setMissingCostProducts] = useState<any[]>([
    { id: '1', name: 'NARCISO RODRIGUEZ FOR HER EDP 100ML', article: 'NR-001', cost_price: 0, sale_price: 18500 },
    { id: '2', name: 'CHANEL COCO MADEMOISELLE EDP 100ML', article: 'CH-002', cost_price: 0, sale_price: 24000 },
    { id: '3', name: 'DIOR SAUVAGE EDT 100ML', article: 'DR-003', cost_price: 0, sale_price: 19500 }
  ])

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [isStagnantModalOpen, setIsStagnantModalOpen] = useState(false)
  const [isPotentialProfitModalOpen, setIsPotentialProfitModalOpen] = useState(false)
  const [potentialProfitItems, setPotentialProfitItems] = useState<any[]>([
    { id: '1', name: 'CHANEL CHANCE EAU TENDRE EDT 100ML', article: 'CH-101', warehouse: 'Основной склад', quantity: 12, costPrice: 15000, salePrice: 22000, potentialProfit: 84000 },
    { id: '2', name: 'GUCCI BLOOM EDP 100ML', article: 'GC-202', warehouse: 'Основной склад', quantity: 8, costPrice: 12500, salePrice: 18500, potentialProfit: 48000 },
    { id: '3', name: 'TOM FORD BLACK ORCHID EDP 100ML', article: 'TF-303', warehouse: 'Склад Китай', quantity: 5, costPrice: 18000, salePrice: 28000, potentialProfit: 50000 }
  ])
  const [isMonthSalesModalOpen, setIsMonthSalesModalOpen] = useState(false)
  const [monthSalesItems, setMonthSalesItems] = useState<MonthSalesItem[]>([
    { id: '1', name: 'DIOR J\'ADORE EDP 100ML', article: 'DR-501', quantity: 18, avgSalePrice: 21000, costPrice: 14000, profit: 126000, margin: 33.3 },
    { id: '2', name: 'VERSACE EROS EDT 100ML', article: 'VS-602', quantity: 15, avgSalePrice: 16500, costPrice: 11000, profit: 82500, margin: 33.3 },
    { id: '3', name: 'PACO RABANNE 1 MILLION EDT 100ML', article: 'PR-703', quantity: 12, avgSalePrice: 14500, costPrice: 9500, profit: 60000, margin: 34.5 }
  ])
  const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false)
  const [stagnantItems, setStagnantItems] = useState<any[]>([
    { id: '1', name: 'BURBERRY BRIT EDP 100ML', article: 'BB-801', quantity: 4, lastSaleDate: '2025-11-15', daysStagnant: 78 },
    { id: '2', name: 'CALVIN KLEIN EUPHORIA EDP 100ML', article: 'CK-902', quantity: 3, lastSaleDate: '2025-11-20', daysStagnant: 73 }
  ])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [syncing, setSyncing] = useState(false)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fintech Chart Colors
  const COLORS = useMemo(() => ['#00F0FF', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'], [])

  // DEMO: Chart data with sample values
  const [salesChartData, setSalesChartData] = useState<any[]>([
    { day: 1, current: 15, previous: 12 },
    { day: 2, current: 18, previous: 14 },
    { day: 3, current: 22, previous: 16 },
    { day: 4, current: 19, previous: 18 },
    { day: 5, current: 25, previous: 20 },
    { day: 6, current: 28, previous: 22 },
    { day: 7, current: 24, previous: 19 },
    { day: 8, current: 30, previous: 25 },
    { day: 9, current: 27, previous: 23 },
    { day: 10, current: 32, previous: 26 },
  ])
  const [ordersChartData, setOrdersChartData] = useState<any[]>([
    { day: 1, current: 12, previous: 10 },
    { day: 2, current: 15, previous: 11 },
    { day: 3, current: 18, previous: 13 },
    { day: 4, current: 16, previous: 15 },
    { day: 5, current: 20, previous: 17 },
    { day: 6, current: 23, previous: 18 },
    { day: 7, current: 19, previous: 16 },
    { day: 8, current: 25, previous: 21 },
    { day: 9, current: 22, previous: 19 },
    { day: 10, current: 27, previous: 22 },
  ])


  const fetchChartData = useCallback(async () => {
    // DEMO MODE: Using static data, no need to fetch
    console.log('📊 Using demo chart data')
  }, [])

  const loadDashboardData = useCallback(async () => {
    // DEMO MODE: Using static data, no need to load from database
    console.log('✅ Using demo dashboard data')
    setLoading(false)
  }, [])

const handleSync = useCallback(async () => {
  try {
    setSyncing(true)
    console.log('🔄 Starting data synchronization...')

    const response = await fetch('/api/sync/async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'all' }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    if (result.success && result.syncId) {
      console.log('✅ Sync started:', result.syncId)

      let checkCount = 0
      const maxChecks = 600 // Максимум 20 минут (600 * 2 секунды) - синхронизация может быть долгой

      // Ждем завершения синхронизации (проверяем статус каждые 2 секунды)
      const checkStatus = async () => {
        try {
          checkCount++
          if (checkCount > maxChecks) {
            console.warn('⚠️ Sync timeout - stopping status checks')
            setSyncing(false)
            // Не показываем alert, просто останавливаем проверку и обновляем данные
            console.log('⏸️ Stopping status checks, but sync may still be running in background')
            await loadDashboardData()
            return
          }

          // Пробуем два способа получения статуса
          let statusResponse
          try {
            statusResponse = await fetch(`/api/sync/status/${result.syncId}`)
          } catch (err) {
            // Если динамический маршрут не работает, пробуем через query параметр
            console.log('⚠️ Trying alternative status endpoint...')
            statusResponse = await fetch(`/api/sync/async?id=${result.syncId}`)
          }

          if (!statusResponse.ok) {
            if (statusResponse.status === 404) {
              // Синхронизация еще не началась или завершилась
              console.log('⏳ Sync status not found yet, waiting...')
              // Пробуем альтернативный способ
              try {
                const altResponse = await fetch(`/api/sync/async?id=${result.syncId}`)
                if (altResponse.ok) {
                  const altStatus = await altResponse.json()
                  console.log('✅ Got status via alternative endpoint:', altStatus.status)
                  // Обрабатываем статус
                  if (altStatus.status === 'completed') {
                    console.log('✅ Sync completed!')
                    setSyncing(false)
                    await loadDashboardData()
                    return
                  } else if (altStatus.status === 'error' || altStatus.status === 'failed') {
                    console.error('❌ Sync failed:', altStatus.error)
                    setSyncing(false)
                    const errorMsg = altStatus.error || altStatus.errors?.[0]?.error || 'Неизвестная ошибка'
                    alert('Ошибка синхронизации: ' + errorMsg)
                    return
                  }
                }
              } catch (altErr) {
                // Игнорируем ошибку альтернативного способа
              }
              setTimeout(checkStatus, 2000)
              return
            }
            throw new Error(`HTTP ${statusResponse.status}`)
          }

          const status = await statusResponse.json()

          const progress = status.progress || 0
          const completed = status.completed || 0
          const total = status.total || 0
          const current = status.current || ''

          console.log(`📊 Sync status check ${checkCount}:`, {
            status: status.status,
            progress: `${progress}%`,
            completed: `${completed}/${total}`,
            current: current
          })

          if (status.status === 'completed') {
            console.log('✅ Sync completed!')
            setSyncing(false)
            // Перезагружаем данные дашборда
            await loadDashboardData()
          } else if (status.status === 'error' || status.status === 'failed') {
            console.error('❌ Sync failed:', status.error)
            setSyncing(false)
            const errorMsg = status.error || status.errors?.[0]?.error || 'Неизвестная ошибка'
            alert('Ошибка синхронизации: ' + errorMsg)
          } else if (status.status === 'running') {
            // Показываем прогресс пользователю (можно добавить индикатор прогресса)
            // Продолжаем проверку
            setTimeout(checkStatus, 2000)
          } else {
            // Неизвестный статус, продолжаем проверку
            console.log('⏳ Unknown status, continuing to check...')
            setTimeout(checkStatus, 2000)
          }
        } catch (err: any) {
          console.error('Error checking sync status:', err)
          // Если это 404, продолжаем проверку (синхронизация может еще не начаться)
          if (err?.message?.includes('404')) {
            setTimeout(checkStatus, 2000)
          } else {
            setSyncing(false)
            alert('Ошибка проверки статуса синхронизации: ' + (err?.message || 'Неизвестная ошибка'))
          }
        }
      }

      // Начинаем проверку через 2 секунды
      setTimeout(checkStatus, 2000)
    } else {
      console.error('❌ Sync failed:', result.error || 'Unknown error')
      setSyncing(false)
      alert('Ошибка запуска синхронизации: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error: any) {
    console.error('❌ Sync error:', error)
    setSyncing(false)
    alert('Ошибка синхронизации: ' + (error?.message || 'Неизвестная ошибка'))
  }
}, [loadDashboardData])

// Мемоизация отфильтрованных данных для графиков
// Всегда показываем все 4 склада, даже если данных нет
const validWarehousesData = useMemo(() => {
  const defaultWarehouses: WarehouseData[] = [
    { name: 'Склад Китай', nomenclatureCount: 0, quantityInPieces: 0, totalValue: 0, reserveQuantity: 0, reserveValue: 0, potentialProfit: 0 },
    { name: 'Основной склад', nomenclatureCount: 0, quantityInPieces: 0, totalValue: 0, reserveQuantity: 0, reserveValue: 0, potentialProfit: 0 },
    { name: 'Склад предзаказов', nomenclatureCount: 0, quantityInPieces: 0, totalValue: 0, reserveQuantity: 0, reserveValue: 0, potentialProfit: 0 },
    { name: 'Склад транзит', nomenclatureCount: 0, quantityInPieces: 0, totalValue: 0, reserveQuantity: 0, reserveValue: 0, potentialProfit: 0 },
    { name: 'Прочие', nomenclatureCount: 0, quantityInPieces: 0, totalValue: 0, reserveQuantity: 0, reserveValue: 0, potentialProfit: 0 },
  ]

  if (warehousesData && warehousesData.length > 0) {
    // Объединяем данные из state с дефолтными складами
    return defaultWarehouses.map(defaultWh => {
      const found = warehousesData.find(w => w && w.name === defaultWh.name)
      return found || defaultWh
    })
  }

  return defaultWarehouses
}, [warehousesData])

const warehousesWithValue = useMemo(() =>
  validWarehousesData.filter(w => w.totalValue > 0 || w.name !== 'Прочие'),
  [validWarehousesData]
)

const warehousesWithNomenclature = useMemo(() =>
  validWarehousesData.filter(w => w.nomenclatureCount > 0),
  [validWarehousesData]
)

const warehousesWithQuantity = useMemo(() =>
  validWarehousesData.filter(w => w.quantityInPieces >= 0),
  [validWarehousesData]
)

useEffect(() => {
  loadDashboardData()
  fetchChartData()

  // Автообновление каждые 5 минут
  const interval = setInterval(() => {
    loadDashboardData()
    fetchChartData()
  }, 5 * 60 * 1000)

  return () => clearInterval(interval)
}, [loadDashboardData, fetchChartData])

return (
  <div className="flex h-screen w-full bg-fintech-bg text-fintech-text-main font-sans overflow-hidden selection:bg-fintech-aqua/30">

    {/* Sidebar */}


    {/* Main Content */}
    <main className="flex-1 flex flex-col overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fintech-purple/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fintech-aqua/10 blur-[120px] rounded-full pointer-events-none"></div>



      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center z-30">
        <div className="flex items-center gap-4 w-1/3">
          <div className="relative w-full max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fintech-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Поиск транзакций, активов..." className="w-full bg-white/5 border border-fintech-border rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder-fintech-text-muted focus:outline-none focus:border-fintech-aqua/50 transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <AlertsCenter />
          </div>

          <KaspiPriceSync onSyncComplete={loadDashboardData} />

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-fintech-text-muted hover:text-white transition-colors border border-fintech-border"
            title="Настройки синхронизации"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>

          <button onClick={handleSync} disabled={syncing || loading} className="neon-button px-6 py-3 rounded-full flex items-center gap-2">
            {syncing ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            <span>Синхронизировать</span>
          </button>
        </div>
      </header>

      {/* Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={loadDashboardData}
      />

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 z-10">

        {/* Top Block: Professional Highlights (Finances) */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 glass-fintech rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <svg className="w-64 h-64 text-fintech-aqua" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.29 0 2.13-.72 2.13-1.71 0-1.12-.88-1.58-2.75-2.03-2.2-.53-3.66-1.52-3.66-3.42 0-1.8 1.35-2.93 3.06-3.29V4h2.67v1.93c1.5.27 2.91 1.23 3.11 3.13h-1.98c-.12-.92-1.03-1.61-2.26-1.61-1.18 0-1.95.66-1.95 1.57 0 .96.7 1.42 2.48 1.86 2.36.58 3.93 1.59 3.93 3.53 0 1.96-1.51 3.12-3.27 3.48z" /></svg>
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <h2 className="text-fintech-text-muted text-sm font-medium uppercase tracking-wider mb-2">Общий баланс</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-white tracking-tight text-glow">{financialData?.totalBalance?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} ₸</span>
                  <span className="px-3 py-1 rounded-full bg-fintech-green/10 text-fintech-green text-sm font-medium border border-fintech-green/20 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    +2.4%
                  </span>
                </div>
                <p className="text-fintech-text-muted mt-4 max-w-md">
                  Доступно для операций: <span className="text-fintech-aqua font-medium">{financialData?.balanceMinusReserve?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} ₸</span>
                </p>
              </div>

              {/* Mini Chart Area */}
              <div className="h-32 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChartData.slice(-7)}>
                    <Bar dataKey="current" fill="#00F0FF" radius={[2, 2, 0, 0]} barSize={8}>
                      {salesChartData.slice(-7).map((entry, index) => (
                        <Cell key={`cell-${index}`} fillOpacity={0.5 + (index / 14)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-fintech rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden">
            <h3 className="text-fintech-text-muted text-sm font-medium uppercase tracking-wider">Резерв логистики</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-white">{financialData?.logisticsReserve?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} ₸</span>
            </div>
            <div className="mt-6 h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-fintech-purple w-[35%] shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
            </div>
            <p className="mt-4 text-sm text-fintech-text-muted">Зарезервировано для предстоящих отгрузок</p>
          </div>

          {/* Potential Profit Card (Moved Here) */}
          <div
            onClick={() => setIsPotentialProfitModalOpen(true)}
            className="glass-fintech rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-fintech-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>

            <h3 className="text-fintech-text-muted text-sm font-medium uppercase tracking-wider relative z-10">Потенциальная прибыль</h3>

            <div className="mt-4 relative z-10">
              <span className="text-4xl font-bold text-fintech-green text-glow">{stats.potentialProfit.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</span>
            </div>

            <div className="mt-6 h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
              <div className="h-full bg-fintech-green w-[65%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>

            <p className="mt-4 text-sm text-fintech-text-muted relative z-10 group-hover:text-white transition-colors">Нажмите для детализации</p>
          </div>

          {/* Month Sales Card (Moved Here) */}
          <div
            onClick={() => setIsMonthSalesModalOpen(true)}
            className="glass-fintech rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-fintech-aqua" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>

            <h3 className="text-fintech-text-muted text-sm font-medium uppercase tracking-wider relative z-10">Продажи за месяц</h3>

            <div className="mt-4 relative z-10">
              <span className="text-4xl font-bold text-fintech-aqua text-glow">{stats.monthSales.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</span>
            </div>

            <div className="mt-6 h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
              <div className="h-full bg-fintech-aqua w-[70%] shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
            </div>

            <p className="mt-4 text-sm text-fintech-text-muted relative z-10 group-hover:text-white transition-colors">Нажмите для детализации</p>
          </div>
        </section>

        {/* Middle Row: Top Assets (Warehouses) */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Топ активов</h3>
            <button className="text-fintech-aqua text-sm font-medium hover:text-white transition-colors">Показать все</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {validWarehousesData.filter(w => w.quantityInPieces > 0 || w.name !== 'Прочие').map((warehouse, idx) => (
              <div
                key={warehouse.name}
                onClick={() => setSelectedWarehouse(warehouse.name)}
                className="glass-fintech glass-fintech-hover rounded-[1.5rem] p-6 cursor-pointer relative group flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-white/5 text-fintech-aqua group-hover:bg-fintech-aqua group-hover:text-black transition-colors duration-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${warehouse.quantityInPieces > 0 ? 'bg-fintech-green/10 text-fintech-green' : 'bg-white/5 text-fintech-text-muted'}`}>
                      {warehouse.quantityInPieces > 0 ? 'Активен' : 'Пусто'}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-4 truncate">{warehouse.name}</h4>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium mb-1">Товаров</span>
                      <span className="text-sm font-bold text-white">{warehouse.nomenclatureCount} SKU</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium mb-1">Остаток</span>
                      <span className="text-sm font-bold text-white">{warehouse.quantityInPieces.toLocaleString('ru-RU')} шт.</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium mb-1">Резерв</span>
                      <span className="text-sm font-bold text-fintech-purple">{(warehouse.reserveQuantity || 0).toLocaleString('ru-RU')} шт.</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium mb-1">Потенциал</span>
                      <span className="text-sm font-bold text-fintech-green">{(warehouse.potentialProfit || 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-fintech-text-muted uppercase tracking-widest font-medium block mb-1">Оценка активов</span>
                    <span className="text-xl font-bold text-white tracking-tight">
                      {(warehouse.name === 'Склад предзаказов' ? (warehouse.reserveValue || 0) : warehouse.totalValue).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₸
                    </span>
                  </div>

                  <div className="h-10 w-16 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ v: 10 + (idx * 2) }, { v: 15 - idx }, { v: 8 + idx }, { v: 12 }, { v: 20 - idx }]}>
                        <Line type="monotone" dataKey="v" stroke={idx % 2 === 0 ? '#00F0FF' : '#8B5CF6'} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Metrics Block (Moved to 3rd position) */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-fintech p-4 rounded-2xl relative overflow-hidden group hover:bg-white/5 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <p className="text-xs text-fintech-text-muted uppercase tracking-wider mb-1">Средняя маржа</p>
            <p className="text-xl font-bold text-yellow-500">{stats.avgMargin.toFixed(1)}%</p>
          </div>

          <ProcurementCard onClick={() => setIsProcurementModalOpen(true)} />

          <StagnantStockCard />




        </section>

        {/* Bottom Row: Transactions & Batches */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest Transactions (Sales) */}
          <div className="glass-fintech rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Динамика продаж</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fintech-aqua"></span>
                  <span className="text-xs text-fintech-text-muted">Текущий месяц</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fintech-text-muted/50"></span>
                  <span className="text-xs text-fintech-text-muted">Прошлый месяц</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorSalesCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSalesPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1121', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="current" name="Текущий" stroke="#00F0FF" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesCurrent)" />
                  <Area type="monotone" dataKey="previous" name="Прошлый" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorSalesPrev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Latest Batches (Orders) */}
          <div className="glass-fintech rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Динамика заказов</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fintech-purple"></span>
                  <span className="text-xs text-fintech-text-muted">Текущий месяц</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fintech-text-muted/50"></span>
                  <span className="text-xs text-fintech-text-muted">Прошлый месяц</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersChartData}>
                  <defs>
                    <linearGradient id="colorOrdersCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrdersPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1121', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="current" name="Текущий" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrdersCurrent)" />
                  <Area type="monotone" dataKey="previous" name="Прошлый" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorOrdersPrev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

      </div>
    </main>

    {selectedWarehouse && (
      <WarehouseDetailModal
        warehouseName={selectedWarehouse}
        onClose={() => setSelectedWarehouse(null)}
      />
    )}
    {/* Agent Panel */}
    <AgentPanel />
    <PotentialProfitModal
      isOpen={isPotentialProfitModalOpen}
      onClose={() => setIsPotentialProfitModalOpen(false)}
      items={potentialProfitItems}
    />

    <MonthSalesModal
      isOpen={isMonthSalesModalOpen}
      onClose={() => setIsMonthSalesModalOpen(false)}
      items={monthSalesItems}
    />

    <ProcurementRecommendationsModal
      isOpen={isProcurementModalOpen}
      onClose={() => setIsProcurementModalOpen(false)}
    />
  </div>
)
}
