import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { createMoySkladClient } from '../lib/moy-sklad/client'

type EndpointDescriptor = {
  id: string
  title: string
  apiPath: string
  supabaseTable: string
  uniqueKey: string
  description: string
  fetch: () => Promise<any>
}

const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '..', '.env.local'),
  resolve(__dirname, '..', '.env'),
]

function loadEnv() {
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
      console.log(`✅ Загружены переменные окружения из: ${envPath}`)
      return
    } catch {
      // keep trying other paths
    }
  }
  console.warn('⚠️ Не удалось найти .env файл, используются переменные окружения процесса')
}

function ensureAuth() {
  const token = process.env.MOY_SKLAD_TOKEN
  const username = process.env.MOY_SKLAD_USERNAME
  const password = process.env.MOY_SKLAD_PASSWORD

  if (!token && !(username && password)) {
    console.error('❌ Не заданы учетные данные для API "Мой склад"')
    console.error('Укажите MOY_SKLAD_TOKEN или пару MOY_SKLAD_USERNAME / MOY_SKLAD_PASSWORD')
    process.exit(1)
  }

  return { token, username, password }
}

function normalizeRows(data: any): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.rows)) return data.rows
  if (Array.isArray(data.documents)) return data.documents
  const firstArray = Object.values(data).find(value => Array.isArray(value))
  if (Array.isArray(firstArray)) return firstArray
  return []
}

async function main() {
  loadEnv()
  const auth = ensureAuth()

  const moySkladClient = createMoySkladClient({
    apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    token: auth.token,
    username: auth.username,
    password: auth.password,
  })

  const endpoints: EndpointDescriptor[] = [
    {
      id: 'products',
      title: 'Товары',
      apiPath: '/entity/product',
      supabaseTable: 'products',
      uniqueKey: 'article',
      description: 'Основной каталог товаров. Артикул используется как ключ.',
      fetch: () => moySkladClient.getProducts({ limit: 50 }),
    },
    {
      id: 'stock',
      title: 'Остатки',
      apiPath: '/report/stock/all',
      supabaseTable: 'stock',
      uniqueKey: 'product_id + store_id',
      description: 'Остатки по складам, резервы и товары в пути.',
      fetch: () => moySkladClient.getStock({ limit: 50 }),
    },
    {
      id: 'stores',
      title: 'Склады',
      apiPath: '/entity/store',
      supabaseTable: 'stores',
      uniqueKey: 'moy_sklad_id',
      description: 'Каталог складов и точек хранения.',
      fetch: () => moySkladClient.getStores({ limit: 50 }),
    },
    {
      id: 'sales',
      title: 'Продажи (отгрузки)',
      apiPath: '/entity/demand',
      supabaseTable: 'sales',
      uniqueKey: 'moy_sklad_id',
      description: 'Документы отгрузок (demand). Содержат суммы и контрагентов.',
      fetch: () => moySkladClient.getSales({ limit: 50 }),
    },
    {
      id: 'purchases',
      title: 'Закупки (поступления)',
      apiPath: '/entity/supply',
      supabaseTable: 'purchases',
      uniqueKey: 'moy_sklad_id',
      description: 'Документы поступлений (supply) от поставщиков.',
      fetch: () => moySkladClient.getPurchases({ limit: 50 }),
    },
    {
      id: 'counterparties',
      title: 'Контрагенты',
      apiPath: '/entity/counterparty',
      supabaseTable: 'counterparties',
      uniqueKey: 'moy_sklad_id',
      description: 'Партнеры, клиенты и поставщики.',
      fetch: () => moySkladClient.getCounterparties({ limit: 50 }),
    },
    {
      id: 'customerOrders',
      title: 'Заказы покупателей',
      apiPath: '/entity/customerorder',
      supabaseTable: 'customer_orders',
      uniqueKey: 'moy_sklad_id',
      description: 'Документы заказов покупателей с позициями.',
      fetch: () => moySkladClient.getCustomerOrders({ limit: 25 }),
    },
    {
      id: 'paymentsIn',
      title: 'Входящие платежи',
      apiPath: '/entity/paymentin',
      supabaseTable: 'payments_in',
      uniqueKey: 'moy_sklad_id',
      description: 'Поступления денежных средств.',
      fetch: () => moySkladClient.getPaymentsIn({ limit: 50 }),
    },
    {
      id: 'paymentsOut',
      title: 'Исходящие платежи',
      apiPath: '/entity/paymentout',
      supabaseTable: 'payments_out',
      uniqueKey: 'moy_sklad_id',
      description: 'Списания денежных средств.',
      fetch: () => moySkladClient.getPaymentsOut({ limit: 50 }),
    },
    {
      id: 'cashIn',
      title: 'Приходные ордера',
      apiPath: '/entity/cashin',
      supabaseTable: 'cash_in',
      uniqueKey: 'moy_sklad_id',
      description: 'Движение наличных в кассу.',
      fetch: () => moySkladClient.getCashIn({ limit: 50 }),
    },
    {
      id: 'cashOut',
      title: 'Расходные ордера',
      apiPath: '/entity/cashout',
      supabaseTable: 'cash_out',
      uniqueKey: 'moy_sklad_id',
      description: 'Движение наличных из кассы.',
      fetch: () => moySkladClient.getCashOut({ limit: 50 }),
    },
    {
      id: 'losses',
      title: 'Списания',
      apiPath: '/entity/loss',
      supabaseTable: 'losses',
      uniqueKey: 'moy_sklad_id',
      description: 'Документы списаний с позициями и артикулами.',
      fetch: () => moySkladClient.getLosses({ limit: 50 }),
    },
    {
      id: 'turnover',
      title: 'Отчет по оборотам',
      apiPath: '/report/turnover/all',
      supabaseTable: 'turnover',
      uniqueKey: 'article + period',
      description: 'Сводные данные по движениям товаров.',
      fetch: () => moySkladClient.getTurnover({ limit: 50 }),
    },
    {
      id: 'profitByProduct',
      title: 'Прибыль по товарам',
      apiPath: '/report/profit/byproduct',
      supabaseTable: 'profit_by_product',
      uniqueKey: 'article + period',
      description: 'Отчет по выручке, себестоимости и прибыли.',
      fetch: () => moySkladClient.getProfitByProduct({ limit: 50 }),
    },
    {
      id: 'moneyByAccount',
      title: 'Деньги по счетам',
      apiPath: '/report/money/byaccount',
      supabaseTable: 'money_by_account',
      uniqueKey: 'account_name + period',
      description: 'Остатки по счетам и движение денежных средств.',
      fetch: () => moySkladClient.getMoneyByAccount({ limit: 50 }),
    },
  ]

  const results = []

  for (const endpoint of endpoints) {
    console.log(`↗️  Запрос к ${endpoint.apiPath} (${endpoint.title})`)
    try {
      const raw = await endpoint.fetch()
      const rows = normalizeRows(raw)
      const sampleFields = rows[0] ? Object.keys(rows[0]).slice(0, 25) : []

      results.push({
        id: endpoint.id,
        title: endpoint.title,
        apiPath: endpoint.apiPath,
        supabaseTable: endpoint.supabaseTable,
        uniqueKey: endpoint.uniqueKey,
        description: endpoint.description,
        sampleCount: rows.length,
        sampleFields,
      })

      console.log(`   ✅ получено ${rows.length} записей, примеры полей: ${sampleFields.join(', ') || 'нет данных'}`)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.errors || error?.message || 'Unknown error'
      results.push({
        id: endpoint.id,
        title: endpoint.title,
        apiPath: endpoint.apiPath,
        supabaseTable: endpoint.supabaseTable,
        uniqueKey: endpoint.uniqueKey,
        description: endpoint.description,
        error: errorMessage,
      })
      console.error(`   ❌ ошибка: ${JSON.stringify(errorMessage)}`)
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
    totalEndpoints: results.length,
    endpoints: results,
  }

  const outputPath = resolve(__dirname, '..', 'docs', 'moy-sklad-endpoints.json')
  if (!existsSync(dirname(outputPath))) {
    mkdirSync(dirname(outputPath), { recursive: true })
  }
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`\n💾 Результат сохранен в ${outputPath}`)
  console.log('Используйте этот файл для составления SQL и проверки схемы Supabase.')
}

main().catch(err => {
  console.error('❌ Не удалось собрать информацию об эндпоинтах:', err)
  process.exit(1)
})

