// Скрипт для пересинхронизации остатков с правильными store_id

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { createMoySkladClient } from '../lib/moy-sklad/client'

// Загружаем переменные окружения
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
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

// Создаем клиенты
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения Supabase')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

const moySkladClient = createMoySkladClient({
  apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
  token: process.env.MOY_SKLAD_TOKEN,
  username: process.env.MOY_SKLAD_USERNAME,
  password: process.env.MOY_SKLAD_PASSWORD,
})

async function resyncStock() {
  console.log('🔄 Пересинхронизация остатков с правильными store_id...\n')

  try {
    // Сначала получаем все склады для быстрого поиска
    const { data: stores } = await supabaseAdmin
      .from('stores')
      .select('id, moy_sklad_id, name')

    if (!stores || stores.length === 0) {
      console.error('❌ Ошибка: Склады не синхронизированы! Сначала запустите: npm run sync-stores')
      process.exit(1)
    }

    const storesMap = new Map<string, string>() // moy_sklad_id -> id
    stores.forEach(store => {
      if (store.moy_sklad_id) {
        storesMap.set(store.moy_sklad_id, store.id)
      }
    })

    console.log(`✅ Загружено ${stores.length} складов для маппинга\n`)

    let offset = 0
    const limit = 100
    let totalProcessed = 0
    let totalUpdated = 0
    let totalErrors = 0


    // Use sync-stock-full logic or just use MoySkladSync class
    // But let's fix this script to use the correct endpoint or just rely on sync-stock-full.ts
    // Actually, let's just use MoySkladSync class like sync-stock-full.ts does.
    // But since I am editing this file, let's make it robust.

    // Better yet, let's just call the syncStock method from MoySkladSync class
    // which we know works (it was used in sync-stock-full.ts).
    // But wait, sync-stock-full.ts uses MoySkladSync.syncStock() which uses getStock().
    // Does getStock() return stock by store?
    // In moy-sklad-sync.ts:
    // const data = await this.moySkladClient.getStock({ limit, offset })
    // const stocks = data.rows || []
    // ...
    // for (const storeStock of stockItem.stockByStore) { ... }

    // So getStock() DOES return stockByStore.
    // Why did resync-stock.ts fail to process 0 items?
    // "Обработано: 0 остатков"
    // Maybe stocks.length was 0? No, it printed "Обработка 100 остатков".
    // Ah, "Обработано: 0" means totalProcessed was 0.
    // Inside the loop:
    // const article = stock.article || stock.assortment?.article
    // if (!article) continue
    // ...
    // if (stock.store?.id) { ... }

    // The issue is that getStock() returns aggregated stock items, and inside them `stockByStore`.
    // The current script iterates `stocks` (which are products) but tries to find `stock.store?.id` directly on the product row?
    // No, `getStock` (from report/stock/all?) or report/stock/bystore?
    // If it's `report/stock/all`, it returns flat list if filtered by store, or aggregated?
    // `moySkladClient.getStock` usually calls `report/stock/all`.
    // If called without filter, it returns aggregated stock?
    // Let's check `lib/moy-sklad/client.ts` if possible, but I can't see it.
    // However, `moy-sklad-sync.ts` iterates `stockItem.stockByStore`.
    // This script `resync-stock.ts` does NOT iterate `stockByStore`.
    // It expects `stock.store.id`.
    // If `getStock` returns `report/stock/all` without filter, it returns list of products with `stockByStore` array.
    // So `stock.store` is undefined on the top level item.

    // FIX: Iterate stockByStore.

    while (true) {
      const data = await moySkladClient.getStock({ limit, offset })
      const stocks = data.rows || []

      if (stocks.length === 0) break

      console.log(`📦 Обработка ${stocks.length} позиций (offset: ${offset})...`)

      for (const stockItem of stocks) {
        try {
          // Найти продукт по артикулу
          const article = stockItem.article || stockItem.assortment?.article
          if (!article) continue

          const { data: product } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('article', article)
            .single()

          if (!product) continue

          // Iterate over stockByStore
          if (stockItem.stockByStore && Array.isArray(stockItem.stockByStore)) {
            for (const storeStock of stockItem.stockByStore) {
              const storeHref = storeStock.store?.meta?.href
              if (!storeHref) continue

              const msStoreId = storeHref.split('/').pop()
              const storeId = storesMap.get(msStoreId)

              if (!storeId) continue

              const stockValue = parseFloat(storeStock.stock || 0)
              const reserveValue = parseFloat(storeStock.reserve || 0)
              const inTransitValue = parseFloat(storeStock.inTransit || 0)

              const upsertData = {
                product_id: product.id,
                store_id: storeId,
                stock: stockValue,
                reserve: reserveValue,
                in_transit: inTransitValue,
                quantity: stockValue, // Assuming quantity = stock
                updated_at: new Date().toISOString(),
              }

              const { error } = await supabaseAdmin
                .from('stock')
                .upsert(upsertData, { onConflict: 'product_id,store_id' })

              if (error) {
                console.error(`❌ Ошибка обновления: ${error.message}`)
                totalErrors++
              } else {
                totalUpdated++
              }
              totalProcessed++
            }
          }
        } catch (err: any) {
          console.error(`❌ Ошибка:`, err.message)
          totalErrors++
        }
      }

      offset += limit
      if (stocks.length < limit) break
    }

    console.log(`\n✅ Пересинхронизация завершена!`)
    console.log(`📊 Обработано: ${totalProcessed} остатков`)
    console.log(`✅ Обновлено: ${totalUpdated} остатков`)
    if (totalErrors > 0) {
      console.log(`❌ Ошибок: ${totalErrors}`)
    }

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

resyncStock()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error)
    process.exit(1)
  })

