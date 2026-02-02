import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения Supabase')
  console.error('Проверьте файл .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabase() {
  console.log('🔍 Проверка подключения к Supabase...\n')

  try {
    // Проверяем подключение
    const { data: tables, error: tablesError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (tablesError && tablesError.code !== 'PGRST116') {
      throw tablesError
    }

    console.log('✅ Подключение к Supabase успешно!\n')

    // Список всех таблиц, которые должны быть
    const requiredTables = [
      'products',
      'stock',
      'sales',
      'purchases',
      'counterparties',
      'stores',
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
      'trade_data',
    ]

    console.log('📊 Проверка таблиц:\n')

    let allTablesExist = true

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error && error.code === '42P01') {
          console.log(`❌ ${tableName} - не найдена`)
          allTablesExist = false
        } else {
          console.log(`✅ ${tableName} - существует`)
        }
      } catch (err: any) {
        if (err.code === '42P01') {
          console.log(`❌ ${tableName} - не найдена`)
          allTablesExist = false
        } else {
          console.log(`⚠️  ${tableName} - ошибка проверки: ${err.message}`)
        }
      }
    }

    console.log('\n')

    // Проверяем структуру таблицы products
    console.log('🔍 Проверка структуры таблицы products:\n')

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (productsError) {
      console.error('❌ Ошибка при проверке products:', productsError.message)
    } else {
      console.log('✅ Таблица products доступна')
      
      // Проверяем наличие ключевых столбцов
      const requiredColumns = ['id', 'moy_sklad_id', 'article', 'name']
      console.log('\n📋 Проверка столбцов:')
      
      // Попробуем получить метаданные через запрос
      const { data: sample } = await supabase
        .from('products')
        .select('id, moy_sklad_id, article, name')
        .limit(1)
      
      if (sample !== null) {
        console.log('✅ Все ключевые столбцы присутствуют')
      } else {
        console.log('⚠️  Не удалось проверить столбцы напрямую')
      }
    }

    console.log('\n')

    if (allTablesExist) {
      console.log('🎉 Все таблицы созданы успешно!')
      console.log('\n📝 Следующие шаги:')
      console.log('1. Добавьте ключи от "Мой склад" в .env.local')
      console.log('2. Запустите: npm run dev')
      console.log('3. Откройте http://localhost:3000')
      console.log('4. Перейдите на вкладку "Синхронизация"')
      console.log('5. Нажмите "Синхронизировать всё"')
    } else {
      console.log('⚠️  Некоторые таблицы отсутствуют. Выполните schema-working.sql еще раз.')
    }

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message)
    console.error('\nПроверьте:')
    console.error('1. Правильность ключей Supabase в .env.local')
    console.error('2. Что SQL схема была выполнена в Supabase')
    process.exit(1)
  }
}

verifyDatabase()

