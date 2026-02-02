// Скрипт для исправления цен в базе данных
// Цены в API "Мой склад" приходят в копейках, но должны быть в рублях/тенге

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Загружаем переменные окружения
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
]

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
    break
  } catch (err) {
    // Пробуем следующий путь
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения Supabase')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function fixPrices() {
  console.log('🔍 Проверка и исправление цен...\n')

  try {
    // Получаем все товары с ценами
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, article, name, price, sale_price')
      .not('price', 'is', null)
      .limit(1000)

    if (error) {
      console.error('❌ Ошибка получения товаров:', error)
      return
    }

    if (!products || products.length === 0) {
      console.log('✅ Нет товаров с ценами для проверки')
      return
    }

    console.log(`📊 Найдено ${products.length} товаров с ценами\n`)

    // Проверяем, какие цены выглядят как копейки (больше 1000)
    const suspiciousPrices = products.filter(p => 
      (p.price && p.price > 1000) || (p.sale_price && p.sale_price > 1000)
    )

    console.log(`⚠️  Найдено ${suspiciousPrices.length} товаров с подозрительно высокими ценами (> 1000 ₸)\n`)

    if (suspiciousPrices.length === 0) {
      console.log('✅ Все цены выглядят корректно (не требуют исправления)')
      return
    }

    // Показываем примеры
    console.log('📋 Примеры товаров с высокими ценами:')
    suspiciousPrices.slice(0, 5).forEach((p: any) => {
      console.log(`   - ${p.article}: ${p.name}`)
      console.log(`     Цена: ${p.price} ₸ → ${(p.price / 100).toFixed(2)} ₸`)
      if (p.sale_price) {
        console.log(`     Цена продажи: ${p.sale_price} ₸ → ${(p.sale_price / 100).toFixed(2)} ₸`)
      }
    })

    console.log('\n❓ Исправить цены? (деление на 100)')
    console.log('   Это действие обновит все цены, которые > 1000 ₸')
    console.log('   Запустите скрипт с флагом --fix для автоматического исправления\n')

    // Если передан флаг --fix, исправляем
    if (process.argv.includes('--fix')) {
      console.log('🔧 Исправление цен...\n')

      let fixedCount = 0
      let errorCount = 0

      for (const product of suspiciousPrices) {
        try {
          const updates: any = {}
          
          if (product.price && product.price > 1000) {
            updates.price = product.price / 100
          }
          
          if (product.sale_price && product.sale_price > 1000) {
            updates.sale_price = product.sale_price / 100
          }

          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabaseAdmin
              .from('products')
              .update(updates)
              .eq('id', product.id)

            if (updateError) {
              console.error(`❌ Ошибка обновления ${product.article}:`, updateError.message)
              errorCount++
            } else {
              fixedCount++
            }
          }
        } catch (err: any) {
          console.error(`❌ Ошибка обработки ${product.article}:`, err.message)
          errorCount++
        }
      }

      console.log(`\n✅ Исправлено: ${fixedCount} товаров`)
      if (errorCount > 0) {
        console.log(`❌ Ошибок: ${errorCount}`)
      }
    } else {
      console.log('💡 Для исправления запустите: npm run fix-prices -- --fix')
    }

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error.message)
    process.exit(1)
  }
}

fixPrices()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error)
    process.exit(1)
  })

