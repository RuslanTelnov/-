import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Calculator } from '@/lib/utils/calculator'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Схема базы данных для контекста AI
const DATABASE_SCHEMA = `
Схема базы данных Supabase:

1. products - Товары
   - id (UUID, PRIMARY KEY)
   - moysklad_id (TEXT, UNIQUE) - ID из Мой склад
   - article (TEXT, UNIQUE) - Артикул товара ⭐ КЛЮЧЕВОЕ ПОЛЕ
   - name (TEXT) - Название товара
   - code (TEXT) - Код товара
   - description (TEXT) - Описание
   - price (DECIMAL) - Цена
   - sale_price (DECIMAL) - Цена продажи
   - quantity (INTEGER) - Количество
   - created_at, updated_at (TIMESTAMP)

2. stock - Остатки товаров
   - id (UUID, PRIMARY KEY)
   - product_id (UUID, FOREIGN KEY → products.id)
   - store_id (UUID, FOREIGN KEY → stores.id, nullable)
   - stock (DECIMAL) - Доступно
   - reserve (DECIMAL) - В резерве
   - in_transit (DECIMAL) - В пути
   - quantity (DECIMAL) - Общее количество
   - created_at, updated_at (TIMESTAMP)

3. stores - Склады
   - id (UUID, PRIMARY KEY)
   - moysklad_id (TEXT, UNIQUE)
   - name (TEXT) - Название склада
   - address (TEXT)
   - created_at, updated_at (TIMESTAMP)

4. sales - Продажи
   - id (UUID, PRIMARY KEY)
   - moysklad_id (TEXT, UNIQUE)
   - name (TEXT) - Номер документа
   - moment (TIMESTAMP) - Дата продажи
   - sum (DECIMAL) - Сумма продажи
   - quantity (DECIMAL) - Количество товаров
   - agent_name (TEXT) - Имя покупателя
   - organization_name (TEXT)
   - created_at, updated_at (TIMESTAMP)

5. purchases - Закупки
   - id (UUID, PRIMARY KEY)
   - moysklad_id (TEXT, UNIQUE)
   - name (TEXT) - Номер документа
   - moment (TIMESTAMP) - Дата закупки
   - sum (DECIMAL) - Сумма закупки
   - quantity (DECIMAL)
   - agent_name (TEXT) - Имя поставщика
   - organization_name (TEXT)
   - created_at, updated_at (TIMESTAMP)

6. counterparties - Контрагенты
   - id (UUID, PRIMARY KEY)
   - moysklad_id (TEXT, UNIQUE)
   - name (TEXT) - Название контрагента
   - phone (TEXT)
   - email (TEXT)
   - inn (TEXT) - ИНН
   - kpp (TEXT) - КПП
   - legal_address (TEXT)
   - actual_address (TEXT)
   - created_at, updated_at (TIMESTAMP)

7. customer_orders - Заказы покупателей
   - id (UUID, PRIMARY KEY)
   - moysklad_id (TEXT, UNIQUE)
   - name (TEXT) - Номер заказа
   - moment (TIMESTAMP)
   - sum (DECIMAL)
   - quantity (DECIMAL)
   - agent_name (TEXT)
   - organization_name (TEXT)
   - state_name (TEXT) - Статус заказа
   - positions (JSONB) - Позиции заказа с артикулами
   - created_at, updated_at (TIMESTAMP)

8. payments_in - Входящие платежи
   - id (UUID, PRIMARY KEY)
   - moysklad_id (TEXT, UNIQUE)
   - name (TEXT)
   - moment (TIMESTAMP)
   - sum (DECIMAL)
   - agent_name (TEXT)
   - organization_name (TEXT)
   - purpose (TEXT) - Назначение платежа
   - created_at, updated_at (TIMESTAMP)

9. payments_out - Исходящие платежи
   - Структура аналогична payments_in

10. cash_in, cash_out - Кассовые ордера
    - Структура аналогична payments_in

11. losses - Списания
    - id (UUID, PRIMARY KEY)
    - moysklad_id (TEXT, UNIQUE)
    - name (TEXT)
    - moment (TIMESTAMP)
    - sum (DECIMAL)
    - quantity (DECIMAL)
    - positions (JSONB) - Позиции списания
    - created_at, updated_at (TIMESTAMP)

12. turnover - Обороты товаров
    - id (UUID, PRIMARY KEY)
    - article (TEXT) - Артикул товара
    - product_name (TEXT)
    - quantity (DECIMAL) - Количество проданных единиц
    - sum (DECIMAL) - Сумма оборота
    - period_start (TIMESTAMP)
    - period_end (TIMESTAMP)
    - data (JSONB) - Полные данные из API
    - created_at, updated_at (TIMESTAMP)
    - UNIQUE(article, period_start, period_end)

13. profit_by_product - Прибыль по товарам
    - id (UUID, PRIMARY KEY)
    - article (TEXT) - Артикул товара
    - product_name (TEXT)
    - revenue (DECIMAL) - Выручка
    - cost (DECIMAL) - Себестоимость
    - profit (DECIMAL) - Прибыль (revenue - cost)
    - margin (DECIMAL) - Маржа в % ((profit / revenue) * 100)
    - period_start (TIMESTAMP)
    - period_end (TIMESTAMP)
    - data (JSONB)
    - created_at, updated_at (TIMESTAMP)
    - UNIQUE(article, period_start, period_end)

14. money_by_account - Деньги по счетам
    - id (UUID, PRIMARY KEY)
    - account_name (TEXT) - Название счета
    - account_type (TEXT) - Тип счета
    - balance (DECIMAL) - Остаток на счете
    - income (DECIMAL) - Поступления
    - outcome (DECIMAL) - Выплаты
    - period_start (TIMESTAMP)
    - period_end (TIMESTAMP)
    - data (JSONB)
    - created_at, updated_at (TIMESTAMP)
    - UNIQUE(account_name, period_start, period_end)

15. product_metrics - Метрики товаров
    - id (UUID, PRIMARY KEY)
    - article (TEXT, UNIQUE) - Артикул товара
    - product_name (TEXT)
    - turnover_ratio (DECIMAL) - Коэффициент оборачиваемости
    - turnover_days (DECIMAL) - Дни оборота
    - margin_percent (DECIMAL) - Маржа в %
    - margin_amount (DECIMAL) - Сумма маржи
    - liquidity_score (DECIMAL) - Оценка ликвидности (0-100)
    - sales_velocity (DECIMAL) - Скорость продаж (единиц/день)
    - total_revenue (DECIMAL) - Общая выручка
    - avg_revenue_per_day (DECIMAL) - Средняя выручка в день
    - current_stock (DECIMAL) - Текущий остаток
    - avg_stock (DECIMAL) - Средний остаток
    - recommendation (TEXT) - Рекомендация по товару
    - priority_score (DECIMAL) - Приоритетный балл (0-100)
    - period_start, period_end (TIMESTAMP)
    - calculated_at, created_at, updated_at (TIMESTAMP)

ВАЖНО:
- Для связи таблиц используй article (артикул) как ключ
- stock.product_id → products.id (связь через UUID)
- stock.store_id → stores.id (связь через UUID)
- Все суммы в базе в основных единицах (рубли/тенге), не в копейках
- Для работы с периодами используй period_start и period_end
`

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Определяем, содержит ли сообщение SQL запрос
    const isSQLQuery = /^\s*(SELECT|WITH|EXPLAIN|SHOW|DESCRIBE|DESC)\s+/i.test(message.trim())

    // Если это SQL запрос, выполняем его напрямую
    if (isSQLQuery) {
      try {
        const sqlResponse = await fetch(`${request.nextUrl.origin}/api/ai/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: message.trim() }),
        })

        const sqlData = await sqlResponse.json()

        if (!sqlResponse.ok) {
          return NextResponse.json({
            response: `Ошибка выполнения SQL запроса: ${sqlData.error}\n\nПроверьте синтаксис запроса и убедитесь, что используются правильные названия таблиц и полей.`,
            sqlError: true,
          })
        }

        // Форматируем результат SQL запроса
        const formattedResult = formatSQLResult(sqlData.data, sqlData.rowCount || 0)

        return NextResponse.json({
          response: formattedResult,
          sqlResult: true,
          data: sqlData.data,
          rowCount: sqlData.rowCount,
        })
      } catch (error: any) {
        return NextResponse.json({
          response: `Ошибка при выполнении SQL запроса: ${error.message}`,
          sqlError: true,
        })
      }
    }

    // Получаем данные из Supabase для контекста (если нужно)
    let dataContext = ''

    if (context?.includeData) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('article, name, price, quantity')
        .limit(5)

      const { data: sales } = await supabaseAdmin
        .from('sales')
        .select('name, sum, moment')
        .order('moment', { ascending: false })
        .limit(5)

      dataContext = `
Текущие данные из базы (примеры):
Товары: ${JSON.stringify(products || [])}
Последние продажи: ${JSON.stringify(sales || [])}
`
    }

    // Формируем историю сообщений для контекста
    const messagesHistory = history && Array.isArray(history)
      ? history.slice(-10) // Последние 10 сообщений
      : []

    const systemPrompt = `Ты - AI помощник для анализа данных склада "Мой склад". 
Ты помогаешь пользователю анализировать данные о товарах, продажах, закупках и остатках.

${DATABASE_SCHEMA}

${dataContext}

ВАЖНО:
1. Если пользователь хочет получить данные из базы, предложи ему написать SQL запрос
2. SQL запросы должны начинаться с SELECT, WITH, EXPLAIN, SHOW или DESCRIBE
3. Для связи таблиц используй article (артикул) как ключ
4. Примеры SQL запросов:
   - "SELECT * FROM products WHERE article = 'АРТИКУЛ123';"
   - "SELECT p.article, p.name, s.quantity FROM products p JOIN stock s ON p.id = s.product_id;"
   - "SELECT DATE(moment) as date, SUM(sum) as revenue FROM sales GROUP BY DATE(moment);"
5. Если пользователь задает вопрос, который требует данных из БД, предложи SQL запрос или выполни его сам
6. Отвечай на русском языке, будь конкретным и полезным
7. При выполнении SQL запросов показывай результаты в читаемом формате

КАЛЬКУЛЯТОР ДЛЯ РАСЧЕТОВ:
Для всех расчетов с товарами и деньгами используй калькулятор через API /api/calculator.
Доступные операции:
- calculateTotalValue(quantity, price) - общая стоимость товара
- calculateMargin(salePrice, purchasePrice) - маржа
- calculateMarginPercent(salePrice, purchasePrice) - процент маржи (от цены продажи)
- calculateMarkupPercent(salePrice, purchasePrice) - процент наценки (от себестоимости)
- calculateTurnover(sales, averageStock) - оборачиваемость
- calculateLiquidity(sales, stock, days) - ликвидность
- calculatePriority(turnover, margin, liquidity) - приоритет товара
- calculateFinancials(totalBalance, logisticsReserve) - финансовые показатели
- calculateROI(profit, investment) - ROI
- calculateBreakEven(fixedCosts, price, variableCosts) - точка безубыточности
- calculateDiscountedPrice(originalPrice, discountPercent) - цена со скидкой
- calculateEOQ(demand, orderingCost, holdingCost) - оптимальный размер заказа
- calculateNetProfit(revenue, costOfGoods, operatingExpenses, taxes) - чистая прибыль
- calculateProfitMargin(revenue, profit) - процент прибыли
- formatCurrency(amount, currency, locale) - форматирование денег
- formatNumber(number, decimals, locale) - форматирование чисел

Пример использования калькулятора:
Если пользователь спрашивает "сколько стоит 10 товаров по цене 1000", используй:
POST /api/calculator с { operation: 'calculateTotalValue', params: { quantity: 10, price: 1000 } }

Все расчеты должны выполняться через калькулятор для точности и консистентности.`

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Добавляем историю сообщений
    messagesHistory.forEach((msg: any) => {
      if (msg.role && msg.content) {
        messages.push({ role: msg.role, content: msg.content })
      }
    })

    // Добавляем текущее сообщение
    messages.push({ role: 'user', content: message })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content || 'Извините, не могу обработать запрос.'

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: error.message || 'AI request failed' },
      { status: 500 }
    )
  }
}

// Функция для форматирования результатов SQL запроса
function formatSQLResult(data: any[], rowCount: number): string {
  if (!data || data.length === 0) {
    return `✅ SQL запрос выполнен успешно.\n\nРезультат: 0 строк`
  }

  // Если данные в формате JSONB (из функции execute_readonly_query)
  const rows = data.map((row: any) => {
    if (row.result && typeof row.result === 'object') {
      return row.result
    }
    return row
  })

  let result = `✅ SQL запрос выполнен успешно.\n\n`
  result += `Найдено строк: ${rowCount}\n\n`

  // Показываем первые 50 строк
  const displayRows = rows.slice(0, 50)

  if (displayRows.length > 0) {
    result += `Результаты:\n`
    result += '```\n'

    // Форматируем как таблицу
    const keys = Object.keys(displayRows[0])
    const header = keys.join(' | ')
    result += header + '\n'
    result += '-'.repeat(header.length) + '\n'

    displayRows.forEach((row: any) => {
      const values = keys.map(key => {
        const value = row[key]
        if (value === null || value === undefined) return 'NULL'
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
      })
      result += values.join(' | ') + '\n'
    })

    result += '```\n'

    if (rows.length > 50) {
      result += `\n... и еще ${rows.length - 50} строк (показаны первые 50)`
    }
  }

  return result
}
