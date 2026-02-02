// Загружаем переменные окружения вручную
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Пробуем загрузить из разных мест
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '..', '.env.local'),
  resolve(__dirname, '..', '.env'),
]

let envLoaded = false
for (const envPath of envPaths) {
  try {
    const envFile = readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=:#]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      }
    })
    envLoaded = true
    console.log(`✅ Загружены переменные окружения из: ${envPath}`)
    break
  } catch (err) {
    // Пробуем следующий путь
  }
}

if (!envLoaded) {
  console.warn('⚠️ Не удалось загрузить .env файл, используем переменные окружения системы')
}

// Создаем клиент напрямую
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения Supabase')
  console.error('Проверьте файл .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

interface TableStatus {
  name: string
  count: number
  error?: string
  sample?: any
}

async function checkSupabaseStatus() {
  console.log('🔍 Проверка статуса Supabase...\n')

  // Проверка подключения
  try {
    const { data, error } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true })
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message)
      return
    }
    console.log('✅ Подключение к Supabase успешно\n')
  } catch (err: any) {
    console.error('❌ Не удалось подключиться к Supabase:', err.message)
    return
  }

  // Список таблиц для проверки
  const tables = [
    'products',
    'stock',
    'stores',
    'sales',
    'purchases',
    'counterparties',
    'customer_orders',
    'payments_in',
    'payments_out',
    'cash_in',
    'cash_out',
    'losses',
    'turnover',
    'profit_by_product',
    'money_by_account',
    'product_metrics',
  ]

  const statuses: TableStatus[] = []

  console.log('📊 Проверка таблиц:\n')

  for (const tableName of tables) {
    try {
      // Получаем количество записей
      const { count, error: countError } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        statuses.push({
          name: tableName,
          count: 0,
          error: countError.message,
        })
        console.log(`❌ ${tableName}: Ошибка - ${countError.message}`)
        continue
      }

      // Получаем образец данных (если есть записи)
      let sample = null
      if (count && count > 0) {
        const { data: sampleData } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1)
          .single()
        sample = sampleData
      }

      statuses.push({
        name: tableName,
        count: count || 0,
        sample: sample ? Object.keys(sample).slice(0, 5) : null, // Первые 5 полей
      })

      const statusIcon = count && count > 0 ? '✅' : '⚠️'
      console.log(`${statusIcon} ${tableName}: ${count || 0} записей`)
    } catch (err: any) {
      statuses.push({
        name: tableName,
        count: 0,
        error: err.message,
      })
      console.log(`❌ ${tableName}: Ошибка - ${err.message}`)
    }
  }

  // Детальная информация по основным таблицам
  console.log('\n📈 Детальная статистика:\n')

  // Products
  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('article, name, price, sale_price, quantity')
      .limit(5)

    if (products && products.length > 0) {
      console.log('📦 Примеры товаров:')
      products.forEach((p: any) => {
        console.log(`   - ${p.article || 'N/A'}: ${p.name || 'Без названия'} (цена: ${p.price || 0} ₸, кол-во: ${p.quantity || 0})`)
      })
    }
  } catch (err: any) {
    console.log('   ⚠️ Не удалось получить примеры товаров')
  }

  // Stock
  try {
    const { count: stockCount } = await supabaseAdmin
      .from('stock')
      .select('*', { count: 'exact', head: true })

    if (stockCount && stockCount > 0) {
      const { data: stockData } = await supabaseAdmin
        .from('stock')
        .select('quantity, stock, reserve, in_transit')
        .limit(5)

      console.log('\n📊 Примеры остатков:')
      stockData?.forEach((s: any) => {
        console.log(`   - Остаток: ${s.quantity || s.stock || 0}, Резерв: ${s.reserve || 0}, В пути: ${s.in_transit || 0}`)
      })
    }
  } catch (err: any) {
    console.log('   ⚠️ Не удалось получить примеры остатков')
  }

  // Stores
  try {
    const { data: stores } = await supabaseAdmin
      .from('stores')
      .select('name')
      .limit(10)

    if (stores && stores.length > 0) {
      console.log('\n🏪 Склады:')
      stores.forEach((s: any) => {
        console.log(`   - ${s.name || 'Без названия'}`)
      })
    }
  } catch (err: any) {
    console.log('   ⚠️ Не удалось получить склады')
  }

  // Финансы
  try {
    const { data: moneyData } = await supabaseAdmin
      .from('money_by_account')
      .select('balance, income, outcome, period_end')
      .order('period_end', { ascending: false })
      .limit(1)

    if (moneyData && moneyData.length > 0) {
      const latest = moneyData[0]
      console.log('\n💰 Финансы (последний период):')
      console.log(`   - Баланс: ${latest.balance || 0} ₸`)
      console.log(`   - Доход: ${latest.income || 0} ₸`)
      console.log(`   - Расход: ${latest.outcome || 0} ₸`)
      console.log(`   - Период: ${latest.period_end || 'N/A'}`)
    }
  } catch (err: any) {
    console.log('   ⚠️ Не удалось получить финансовые данные')
  }

  // Итоговая сводка
  console.log('\n' + '='.repeat(50))
  console.log('📊 ИТОГОВАЯ СВОДКА')
  console.log('='.repeat(50))

  const totalRecords = statuses.reduce((sum, s) => sum + s.count, 0)
  const tablesWithData = statuses.filter(s => s.count > 0).length
  const tablesWithErrors = statuses.filter(s => s.error).length

  console.log(`Всего таблиц: ${statuses.length}`)
  console.log(`Таблиц с данными: ${tablesWithData}`)
  console.log(`Таблиц с ошибками: ${tablesWithErrors}`)
  console.log(`Всего записей: ${totalRecords}`)

  console.log('\n✅ Проверка завершена')
}

// Запуск
checkSupabaseStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error)
    process.exit(1)
  })

