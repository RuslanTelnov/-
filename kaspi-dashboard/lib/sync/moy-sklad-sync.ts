import { createMoySkladClient } from '../moy-sklad/client'
import { supabaseAdmin } from '../supabase/server'
import { Calculator } from '../utils/calculator'
import { createClient } from '@supabase/supabase-js'
import { MetricsCalculator } from '../metrics/calculate-metrics'
import { checkMissingCostsAndNotify } from '../alerts/check-missing-costs'

export class MoySkladSync {
  private moySkladClient: ReturnType<typeof createMoySkladClient>

  constructor() {
    this.moySkladClient = createMoySkladClient({
      apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
      token: process.env.MOY_SKLAD_TOKEN,
      username: process.env.MOY_SKLAD_USERNAME,
      password: process.env.MOY_SKLAD_PASSWORD,
    })
  }

  // Получение времени последней успешной синхронизации
  private async getLastSyncTime(entityType: string): Promise<string | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('sync_state')
        .select('last_sync_start')
        .eq('entity_type', entityType)
        .maybeSingle()

      if (error) {
        console.error(`❌ Error getting sync state for ${entityType}:`, error.message)
        return null
      }
      return data?.last_sync_start || null
    } catch (error) {
      console.error(`❌ Error getting sync state for ${entityType}:`, error)
      return null
    }
  }

  // Helper to format date for MoySklad filter
  private formatDate(date: Date | string): string {
    const d = new Date(date)
    // MoySklad expects YYYY-MM-DD HH:mm:ss
    return d.toISOString().replace('T', ' ').substring(0, 19)
  }

  // Обновление состояния синхронизации
  private async updateSyncState(entityType: string, startTime: Date) {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('sync_state')
        .upsert({
          entity_type: entityType,
          last_sync_start: startTime.toISOString(),
          last_sync_end: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_type'
        })

      if (error) {
        console.error(`❌ Error updating sync state for ${entityType}:`, error.message)
      } else {
        console.log(`✅ Updated sync state for ${entityType}`)
      }
    } catch (error) {
      console.error(`❌ Error updating sync state for ${entityType}:`, error)
    }
  }

  // Синхронизация товаров (артикул - уникальный ключ)
  async syncProducts(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('products')
      const useIncremental = !force && lastSync

      // Если инкрементальная синхронизация, не используем фильтр archived=true отдельно,
      // так как updated фильтр вернет и архивные, если они менялись.
      // Но API МойСклад может требовать явного указания archived=true для поиска в архиве?
      // Проверим: обычно updated возвращает все. Но для безопасности можно пройтись дважды или
      // просто использовать updated.
      // Документация говорит: фильтр updated применяется ко всем сущностям.

      const filters = useIncremental
        ? [`updated>${this.formatDate(lastSync!)}`]
        : [undefined, 'archived=true']

      let totalCount = 0

      console.log(`🔄 Syncing products (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      for (const filter of filters) {
        let offset = 0
        const limit = 100

        while (true) {
          // Если инкрементальная, добавляем фильтр к запросу
          // Если полная, filter уже содержит нужный фильтр или undefined

          const queryFilter = filter // В данном случае filter уже готов к использованию

          const data = await this.moySkladClient.getProducts({ limit, offset, filter: queryFilter })
          const products = data.rows || []

          if (products.length === 0) break

          // Fetch existing products to map IDs
          const msIds = products.map((p: any) => p.id)
          const { data: existingProducts } = await (supabaseAdmin as any)
            .from('products')
            .select('id, moysklad_id')
            .in('moysklad_id', msIds)

          const existingMap = new Map(existingProducts?.map((p: any) => [p.moysklad_id, p.id]))

          // Пакетная вставка для оптимизации
          const productsToInsert = products
            // .filter((p: any) => p.article || p.code) // Removed to prevent FK violations in stock sync
            .map((product: any) => {
              // Извлекаем кастомные атрибуты
              const attrs = product.attributes || []
              const disableKaspi = attrs.find((a: any) => a.name === 'Не выгружать на Каспи')?.value ?? false
              const disableDumping = attrs.find((a: any) => a.name === 'Отключить демпинг')?.value ?? false
              const preorderDays = attrs.find((a: any) => a.name === 'Предзаказ')?.value ?? null

              // Гарантируем уникальный article
              let article = product.article || product.code || ('TEMP_' + product.id.slice(0, 8))

              // Если товар архивный, добавляем суффикс к артикулу, чтобы избежать конфликта уникальности
              // с активными товарами, имеющими тот же артикул
              if (product.archived) {
                article = `${article}_ARCHIVED_${product.id.slice(0, 4)}`
              }

              // Цены в API "Мой склад" приходят в копейках
              const priceInCents = product.price || product.salePrices?.[0]?.value || 0
              const salePriceInCents = product.salePrices?.[0]?.value || product.price || 0
              const buyPriceInCents = product.buyPrice?.value || 0

              return {
                id: existingMap.get(product.id) || product.id, // Use existing UUID or MS ID
                moysklad_id: product.id,
                article: article,
                name: product.name || 'Без названия',
                code: product.code || null,
                external_code: product.externalCode || null,
                description: product.description || null,
                category: product.pathName || null,
                category_id: product.productFolder?.id || null,
                price: priceInCents / 100,
                sale_price: salePriceInCents / 100,
                buy_price: buyPriceInCents / 100,
                weight: product.weight || null,
                volume: product.volume || null,
                image_url: product.images?.[0]?.meta?.href || null,
                quantity_reserve: product.quantityReserve || 0,
                updated_at: product.updated || new Date().toISOString(),
                archived: product.archived || false,
                modifications_count: product.modificationsCount || 0,
                owner: product.owner?.name || null,
                disable_kaspi: disableKaspi,
                disable_dumping: disableDumping,
                preorder_days: preorderDays,
              }
            })

          console.log(`📦 Prepared ${productsToInsert.length} products for upsert (offset: ${offset}, filter: ${queryFilter})`)
          if (productsToInsert.length > 0) {
            const { error: batchError } = await (supabaseAdmin as any)
              .from('products')
              .upsert(productsToInsert, {
                onConflict: 'id',
              })

            if (batchError) {
              console.error('❌ Error batch upserting products:', JSON.stringify(batchError, null, 2))
            } else {
              console.log(`✅ Successfully upserted ${productsToInsert.length} products`)
            }
          }

          totalCount += products.length
          offset += limit

          // Если получили меньше чем limit, значит это последняя страница
          if (products.length < limit) break
        }
      }

      await this.updateSyncState('products', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing products:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация модификаций (вариантов)
  async syncVariants(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('variants')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing variants (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getData('/entity/variant', { limit, offset, filter })
        const variants = data.rows || []

        if (variants.length === 0) break

        const variantsToInsert = variants.map((variant: any) => ({
          id: variant.id,
          moysklad_id: variant.id,
          name: variant.name,
          article: variant.article || '',
          price: variant.salePrices?.[0]?.value / 100 || 0,
          buy_price: variant.buyPrice?.value / 100 || 0,
          archived: variant.archived || false,
          updated_at: new Date().toISOString(),
          // Variants in MS don't have all product fields, but we map what we have
        }))

        const { error } = await (supabaseAdmin as any)
          .from('products')
          .upsert(variantsToInsert, { onConflict: 'moysklad_id' })

        if (error) {
          console.error('❌ Error upserting variants:', JSON.stringify(error, null, 2))
        }

        totalCount += variants.length
        offset += limit
        if (variants.length < limit) break
      }

      await this.updateSyncState('variants', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing variants:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация комплектов
  async syncBundles(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('bundles')
      const useIncremental = !force && lastSync

      const filters = useIncremental
        ? [`updated>${this.formatDate(lastSync!)}`]
        : [undefined, 'archived=true']

      let totalCount = 0

      console.log(`🔄 Syncing bundles (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      for (const filter of filters) {
        let offset = 0
        const limit = 100

        while (true) {
          const queryFilter = filter
          const data = await this.moySkladClient.getBundles({ limit, offset, filter: queryFilter })
          const bundles = data.rows || []

          if (bundles.length === 0) break

          // Fetch existing products to map IDs (check if bundle already exists as product)
          const msIds = bundles.map((b: any) => b.id)
          const { data: existingProducts } = await (supabaseAdmin as any)
            .from('products')
            .select('id, moysklad_id')
            .in('moysklad_id', msIds)

          const existingMap = new Map(existingProducts?.map((p: any) => [p.moysklad_id, p.id]))

          const bundlesToInsert = bundles.map((bundle: any) => {
            // Гарантируем уникальный article
            let article = bundle.article || bundle.code || ('BUNDLE_' + bundle.id.slice(0, 8))

            // Append _BUNDLE to avoid collision with products
            article = `${article}_BUNDLE`

            if (bundle.archived) {
              article = `${article}_ARCHIVED_${bundle.id.slice(0, 4)}`
            }

            // Bundles might not have explicit price field in the same way, or it might be calculated.
            // We'll try to get it if available, or default to 0.
            // Bundle structure usually has components.
            // We just need it in the DB so FK works.
            const priceInCents = bundle.price || 0 // Check if bundle has price field

            return {
              id: existingMap.get(bundle.id) || bundle.id,
              moysklad_id: bundle.id,
              article: article,
              name: bundle.name || 'Без названия',
              code: bundle.code || null,
              external_code: bundle.externalCode || null,
              description: bundle.description || null,
              category: null, // Bundles might not have product folder in the same way? Or they do.
              category_id: bundle.productFolder?.id || null,
              price: priceInCents / 100,
              sale_price: priceInCents / 100,
              buy_price: 0, // Bundles don't have buy price usually (sum of components)
              updated_at: bundle.updated || new Date().toISOString(),
              archived: bundle.archived || false,
              is_bundle: true // If we had this column. For now we don't, so just insert as product.
            }
          })

          console.log(`📦 Prepared ${bundlesToInsert.length} bundles for upsert (offset: ${offset})`)

          if (bundlesToInsert.length > 0) {
            const { error: batchError } = await (supabaseAdmin as any)
              .from('products')
              .upsert(bundlesToInsert, {
                onConflict: 'id',
              })

            if (batchError) {
              console.error('❌ Error batch upserting bundles:', JSON.stringify(batchError, null, 2))
            } else {
              console.log(`✅ Successfully upserted ${bundlesToInsert.length} bundles`)
            }
          }

          totalCount += bundles.length
          offset += limit
          if (bundles.length < limit) break
        }
      }

      await this.updateSyncState('bundles', startTime)
      return { success: true, count: totalCount }
    } catch (error: any) {
      console.error('Error syncing bundles:', error)
      if (error.response) {
        console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2))
      }
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация остатков
  async syncStock() {
    try {
      let offset = 0
      const limit = 100
      let totalCount = 0

      // Pre-fetch all product and store mappings with pagination to overcome 1000 row limit
      const productMap = new Map<string, string>()
      const storeMap = new Map<string, string>()

      console.log('Fetching product mappings...')
      let productOffset = 0
      while (true) {
        const { data: chunk, error } = await (supabaseAdmin as any)
          .from('products')
          .select('id, moysklad_id')
          .range(productOffset, productOffset + 999)

        if (error) {
          console.error('❌ Error fetching products for mapping:', error)
          break
        }
        if (!chunk || chunk.length === 0) break

        chunk.forEach((p: any) => productMap.set(p.moysklad_id, p.id))
        productOffset += 1000
        if (chunk.length < 1000) break
      }
      console.log(`✅ Loaded ${productMap.size} product mappings`)

      console.log('Fetching store mappings...')
      const { data: dbStores } = await (supabaseAdmin as any).from('stores').select('id, moysklad_id').limit(1000)
      dbStores?.forEach((s: any) => storeMap.set(s.moysklad_id, s.id))
      console.log(`✅ Loaded ${storeMap.size} store mappings`)

      while (true) {
        const data = await this.moySkladClient.getStock({ limit, offset })
        const stocks = data.rows || []

        if (stocks.length === 0) break

        const stockInserts: any[] = []

        console.log(`Processing ${stocks.length} stock items...`)

        for (const stockItem of stocks) {
          const productHref = stockItem.meta?.href || ''
          // Robust extraction: get the last UUID from the href
          const msProductId = productHref.split('/').pop()?.split('?')[0]
          const dbProductId = productMap.get(msProductId!)

          if (!dbProductId) {
            console.warn(`⚠️ Product not found in DB for MS ID: ${msProductId}`)
            continue
          }

          if (Array.isArray(stockItem.stockByStore)) {
            for (const storeStock of stockItem.stockByStore) {
              const storeHref = storeStock.meta?.href || ''
              const msStoreId = storeHref.split('/entity/store/')[1]?.split('?')[0]
              const dbStoreId = storeMap.get(msStoreId)

              if (!dbStoreId) {
                // Store mapping might be missing if it's a new store not yet synced
                continue
              }

              const stockValue = parseFloat(storeStock.stock || 0) || 0
              const reserveValue = parseFloat(storeStock.reserve || 0) || 0
              const inTransitValue = parseFloat(storeStock.inTransit || 0) || 0

              stockInserts.push({
                product_id: dbProductId,
                store_id: dbStoreId,
                stock: stockValue,
                reserve: reserveValue,
                in_transit: inTransitValue,
                quantity: stockValue,
                updated_at: new Date().toISOString(),
              })
            }
          }
        }

        console.log(`Prepared ${stockInserts.length} stock inserts`)

        // Batch upsert
        if (stockInserts.length > 0) {
          let successCount = 0
          let errorCount = 0

          // Upsert one by one to handle errors individually
          for (const stockInsert of stockInserts) {
            try {
              const { error } = await (supabaseAdmin as any)
                .from('stock')
                .upsert(stockInsert, {
                  onConflict: 'product_id,store_id',
                })

              if (error) {
                // Ignore FK violations if product/store doesn't exist yet
                if (error.code === '23503') {
                  console.warn(`⚠️ FK violation (missing product/store): ${stockInsert.product_id} / ${stockInsert.store_id}`)
                } else {
                  console.error('❌ Error upserting stock:', JSON.stringify(error, null, 2))
                }
                errorCount++
              } else {
                successCount++
              }
            } catch (err: any) {
              console.error('❌ Exception upserting stock:', err)
              errorCount++
            }
          }

          console.log(`✅ Synced ${successCount} stock items, errors: ${errorCount} (offset: ${offset})`)
        } else {
          console.warn(`⚠️ No stock items to insert (offset: ${offset})`)
        }

        totalCount += stocks.length
        offset += limit

        if (stocks.length < limit) break
      }

      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing stock:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация исторических цен (из отчета report/profit/byproduct)
  async syncHistoricalCosts(days: number = 365) {
    try {
      console.log(`🔄 Syncing historical costs for last ${days} days...`)

      const momentFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00'
      const momentTo = new Date().toISOString().split('T')[0] + ' 23:59:59'

      let offset = 0
      const limit = 100
      let totalCount = 0
      let updatedCount = 0

      while (true) {
        const data = await this.moySkladClient.getData('/report/profit/byproduct', {
          limit,
          offset,
          momentFrom,
          momentTo
        })

        const rows = data.rows || []
        if (rows.length === 0) break

        // Collect MS IDs
        const msIds = rows.map((row: any) => {
          const productHref = row.assortment.meta.href || ''
          return productHref.split('/entity/product/')[1]?.split('?')[0]
        }).filter(Boolean)

        if (msIds.length === 0) {
          offset += limit
          continue
        }

        // Fetch DB products that have 0 or null cost_price
        const { data: productsToUpdate } = await (supabaseAdmin as any)
          .from('products')
          .select('id, moysklad_id, cost_price')
          .in('moysklad_id', msIds)
          .or('cost_price.is.null,cost_price.eq.0')

        const msIdToDbProduct = new Map(productsToUpdate?.map((p: any) => [p.moysklad_id, p]))

        const updates = []

        for (const row of rows) {
          const productHref = row.assortment.meta.href || ''
          const msId = productHref.split('/entity/product/')[1]?.split('?')[0]

          if (!msId) continue

          const dbProduct = msIdToDbProduct.get(msId) as any // Cast to any to avoid TS error
          if (!dbProduct) continue // Product not found or already has cost > 0

          // Calculate average cost
          if (row.sellQuantity > 0) {
            const avgCost = (row.sellCostSum / 100) / row.sellQuantity

            if (avgCost > 0) {
              updates.push({
                id: dbProduct.id,
                cost_price: avgCost,
                updated_at: new Date().toISOString()
              })
            }
          }
        }

        // Batch update
        if (updates.length > 0) {
          // Run in parallel chunks
          const chunkSize = 20
          for (let i = 0; i < updates.length; i += chunkSize) {
            const chunk = updates.slice(i, i + chunkSize)
            await Promise.all(chunk.map(async (update) => {
              const { error } = await (supabaseAdmin as any)
                .from('products')
                .update({
                  cost_price: update.cost_price,
                  updated_at: update.updated_at
                })
                .eq('id', update.id)

              if (error) {
                console.error(`❌ Error updating historical cost for ${update.id}:`, error)
              } else {
                updatedCount++
              }
            }))
          }
        }

        totalCount += rows.length
        offset += limit
        if (rows.length < limit) break
      }

      console.log(`✅ Finished syncing historical costs. Processed ${totalCount} rows, updated ${updatedCount} products.`)
      return { success: true, count: updatedCount }

    } catch (error) {
      console.error('Error syncing historical costs:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация себестоимости и дней на складе (из отчета report/stock/all)
  async syncProductCosts() {
    try {
      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log('🔄 Syncing product costs and stock days...')

      while (true) {
        // Добавляем stockDays=true для получения дней на складе
        const data = await this.moySkladClient.getStockAll({ limit, offset, stockDays: 'true' })
        const rows = data.rows || []

        if (rows.length === 0) break

        // Collect all MS IDs to fetch corresponding DB IDs
        const msIds = rows.map((row: any) => {
          const productHref = row.meta?.href || ''
          return productHref.split('/entity/product/')[1]?.split('?')[0]
        }).filter(Boolean)

        if (msIds.length === 0) {
          offset += limit
          continue
        }

        // Fetch DB IDs for these MS IDs
        const { data: existingProducts } = await (supabaseAdmin as any)
          .from('products')
          .select('id, moysklad_id')
          .in('moysklad_id', msIds)

        const msIdToDbId = new Map(existingProducts?.map((p: any) => [p.moysklad_id, p.id]))

        const productUpdates = []
        const stockUpdates = []

        for (const row of rows) {
          // Extract product ID (MS ID)
          const productHref = row.meta?.href || ''
          const msId = productHref.split('/entity/product/')[1]?.split('?')[0]

          if (!msId) continue

          const dbId = msIdToDbId.get(msId)
          if (!dbId) {
            // Product not found in DB, skip update
            continue
          }

          // price in report/stock/all is typically the cost price (avg cost) in cents
          const costPrice = (row.price || 0) / 100
          const stockDays = parseFloat(row.stockDays || 0)

          // Calculate last_entry_date
          const lastEntryDate = new Date()
          lastEntryDate.setDate(lastEntryDate.getDate() - stockDays)

          productUpdates.push({
            id: dbId, // Use DB ID
            cost_price: costPrice,
            updated_at: new Date().toISOString()
          })

          // Prepare stock update (we will execute these individually or in parallel)
          stockUpdates.push({
            product_id: dbId, // Use DB ID
            days_in_stock: Math.round(stockDays),
            stock_days: Math.round(stockDays),
            last_entry_date: lastEntryDate.toISOString()
          })
        }

        // 1. Update Products (Individual updates to ensure reliability)
        if (productUpdates.length > 0) {
          // Run in parallel chunks
          const chunkSize = 20
          for (let i = 0; i < productUpdates.length; i += chunkSize) {
            const chunk = productUpdates.slice(i, i + chunkSize)
            await Promise.all(chunk.map(async (update) => {
              const { error } = await (supabaseAdmin as any)
                .from('products')
                .update({
                  cost_price: update.cost_price,
                  updated_at: update.updated_at
                })
                .eq('id', update.id)

              if (error) {
                console.error(`❌ Error updating product cost for ${update.id}:`, error)
              }
            }))
          }
        }

        // 2. Update Stock (Individual updates by product_id for all stores)
        // Since we want to update ALL stock entries for this product with the same days_in_stock
        if (stockUpdates.length > 0) {
          // Run in parallel chunks to avoid overwhelming DB but faster than serial
          const chunkSize = 20
          for (let i = 0; i < stockUpdates.length; i += chunkSize) {
            const chunk = stockUpdates.slice(i, i + chunkSize)
            await Promise.all(chunk.map(async (update) => {
              const { error } = await (supabaseAdmin as any)
                .from('stock')
                .update({
                  days_in_stock: update.days_in_stock,
                  stock_days: update.stock_days,
                  last_entry_date: update.last_entry_date,
                  updated_at: new Date().toISOString()
                })
                .eq('product_id', update.product_id)

              if (error) {
                console.error(`❌ Error updating stock analytics for product ${update.product_id}:`, error)
              }
            }))
          }
          console.log(`✅ Updated stock analytics for ${stockUpdates.length} products`)
        }

        totalCount += rows.length
        offset += limit

        if (rows.length < limit) break
      }

      // Trigger alert check if there were updates
      if (totalCount > 0) {
        // Run in background to not block response
        checkMissingCostsAndNotify().catch(err => console.error('Error in background alert check:', err))
      }

      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing product costs:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация продаж
  async syncSales(force = false, options?: { filter?: any }) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('sales')
      const useIncremental = !force && lastSync && !options?.filter

      let filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      if (options?.filter) {
        // If custom filter provided (e.g. moment >= date), construct it manually or merge
        // For now, simple override if moment is passed
        if (options.filter.moment && options.filter.moment['>=']) {
          filter = `moment>=${this.formatDate(options.filter.moment['>='])}`
        }
      }

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing sales (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        // Request positions expansion and customer order state
        const data = await this.moySkladClient.getSales({ limit, offset, filter, expand: 'positions,customerOrder.state' })
        const sales = data.rows || []
        console.log(`Fetched ${sales.length} sales. First sale moment: ${sales[0]?.moment}`)

        if (sales.length === 0) break

        for (const sale of sales) {
          // Сумма в API "Мой склад" приходит в копейках
          const sumInCents = parseFloat(sale.sum || 0)
          const sum = sumInCents ? sumInCents / 100 : 0

          // Check for cancellation based on linked Customer Order state
          const orderState = sale.customerOrder?.state?.name || ''
          const isCancelled = orderState.toLowerCase().includes('отмен') ||
            orderState.toLowerCase().includes('возврат')

          // 1. Upsert Sales Document
          await (supabaseAdmin as any).from('sales').upsert({
            moysklad_id: sale.id,
            name: sale.name || 'Без названия',
            moment: sale.moment || new Date().toISOString(),
            sum: sum,
            quantity: parseFloat(sale.quantity || 0) || 0, // This might still be 0 if API doesn't provide it
            agent_name: sale.agent?.name || null,
            organization_name: sale.organization?.name || null,
            is_cancelled: isCancelled,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })

          // 2. Process Positions
          if (sale.positions && sale.positions.rows) {
            const positions = sale.positions.rows

            // Collect product MS IDs to map to DB IDs
            const msIds = positions.map((pos: any) => {
              const productHref = pos.assortment?.meta?.href || ''
              // Assortment can be product, bundle, service, or variant.
              // We assume product or variant.
              // href: .../entity/product/UUID or .../entity/variant/UUID
              return productHref.split('/').pop()?.split('?')[0]
            }).filter(Boolean)

            // Fetch DB IDs
            const { data: existingProducts } = await (supabaseAdmin as any)
              .from('products')
              .select('id, moysklad_id')
              .in('moysklad_id', msIds)

            const msIdToDbId = new Map(existingProducts?.map((p: any) => [p.moysklad_id, p.id]))

            const positionInserts = positions.map((pos: any) => {
              const productHref = pos.assortment?.meta?.href || ''
              const msProductId = productHref.split('/').pop()?.split('?')[0]
              const dbProductId = msIdToDbId.get(msProductId)

              if (!dbProductId) return null // Skip if product not found in DB

              return {
                sales_doc_id: sale.id,
                product_id: dbProductId,
                moy_sklad_product_id: msProductId,
                quantity: parseFloat(pos.quantity || 0),
                price: (parseFloat(pos.price || 0) / 100),
                discount: parseFloat(pos.discount || 0),
                vat: parseFloat(pos.vat || 0),
                moment: sale.moment, // Inherit moment from doc
                created_at: new Date().toISOString()
              }
            }).filter(Boolean)

            if (positionInserts.length > 0) {
              // We delete existing positions for this doc to avoid duplicates if re-syncing
              // But since we don't have a unique constraint on positions (except ID), we might duplicate.
              // Better to delete by sales_doc_id first.
              await (supabaseAdmin as any)
                .from('sales_positions')
                .delete()
                .eq('sales_doc_id', sale.id)

              const { error: posError } = await (supabaseAdmin as any)
                .from('sales_positions')
                .insert(positionInserts)

              if (posError) {
                console.error(`❌ Error inserting positions for sale ${sale.name}:`, posError)
              }
            }
          }
        }

        totalCount += sales.length
        offset += limit

        if (sales.length < limit) break
      }

      await this.updateSyncState('sales', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing sales:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация возвратов покупателей
  async syncSalesReturns(force = false, options?: { filter?: any }) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('sales_returns')
      const useIncremental = !force && lastSync && !options?.filter

      let filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      if (options?.filter) {
        if (options.filter.moment && options.filter.moment['>=']) {
          filter = `moment>=${this.formatDate(options.filter.moment['>='])}`
        }
      }

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing sales returns (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getSalesReturns({ limit, offset, filter })
        const returns = data.rows || []

        if (returns.length === 0) break

        for (const ret of returns) {
          const sumInCents = parseFloat(ret.sum || 0)
          const sum = sumInCents ? sumInCents / 100 : 0

          await (supabaseAdmin as any).from('sales_returns').upsert({
            moysklad_id: ret.id,
            moment: ret.moment || new Date().toISOString(),
            sum: sum,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += returns.length
        offset += limit

        if (returns.length < limit) break
      }

      await this.updateSyncState('sales_returns', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing sales returns:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация закупок
  async syncPurchases(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('purchases')
      const useIncremental = !force && lastSync

      // API закупок (supply) поддерживает фильтрацию по updated
      // Проверим документацию: да, поддерживает.
      // Но метод getPurchases в client.ts не принимает filter?
      // Проверим client.ts: getPurchases(params?: { limit?: number; offset?: number })
      // Надо обновить client.ts чтобы он принимал filter для getPurchases
      // Пока предположим что я обновлю client.ts или передам filter через any

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing purchases (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        // Cast to any to bypass type check until client is updated
        const data = await this.moySkladClient.getPurchases({ limit, offset, filter })
        const purchases = data.rows || []

        if (purchases.length === 0) break

        for (const purchase of purchases) {
          // Сумма в API "Мой склад" приходит в копейках
          const sumInCents = parseFloat(purchase.sum || 0)
          const sum = sumInCents ? sumInCents / 100 : 0

          await (supabaseAdmin as any).from('purchases').upsert({
            moysklad_id: purchase.id,
            name: purchase.name || 'Без названия',
            moment: purchase.moment || new Date().toISOString(),
            sum: sum,
            quantity: parseFloat(purchase.quantity || 0) || 0,
            agent_name: purchase.agent?.name || null,
            organization_name: purchase.organization?.name || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += purchases.length
        offset += limit

        if (purchases.length < limit) break
      }

      await this.updateSyncState('purchases', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing purchases:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация контрагентов
  async syncCounterparties(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('counterparties')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing counterparties (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getCounterparties({ limit, offset, filter })
        const counterparties = data.rows || []

        if (counterparties.length === 0) break

        for (const counterparty of counterparties) {
          await (supabaseAdmin as any).from('counterparties').upsert({
            moysklad_id: counterparty.id,
            name: counterparty.name,
            phone: counterparty.phone,
            email: counterparty.email,
            inn: counterparty.inn,
            kpp: counterparty.kpp,
            legal_address: counterparty.legalAddress,
            actual_address: counterparty.actualAddress,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += counterparties.length
        offset += limit

        if (counterparties.length < limit) break
      }

      await this.updateSyncState('counterparties', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing counterparties:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация складов
  async syncStores(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('stores')
      const useIncremental = !force && lastSync

      const filters = useIncremental
        ? [`updated>${this.formatDate(lastSync!)}`]
        : [undefined, 'archived=true']

      let totalCount = 0

      console.log(`🔄 Syncing stores (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      for (const filter of filters) {
        let offset = 0
        const limit = 100

        while (true) {
          const queryFilter = filter
          const data = await this.moySkladClient.getStores({ limit, offset, filter: queryFilter })
          const stores = data.rows || []

          if (stores.length === 0) break

          for (const store of stores) {
            const { error } = await (supabaseAdmin as any).from('stores').upsert({
              id: store.id, // Use MoySklad ID as UUID
              moysklad_id: store.id,
              name: store.name,
              address: store.address,
              account_id: store.accountId || null,
              shared: store.shared || false,
              updated: store.updated || null,
              description: store.description || null,
              code: store.code || null,
              external_code: store.externalCode || null,
              archived: store.archived || false,
              address_addinfo: store.addressFull?.addInfo || null,
              path_name: store.pathName || null,
              group_id: store.group?.meta?.href?.split('/').pop() || null,
              owner_id: store.owner?.meta?.href?.split('/').pop() || null,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'moysklad_id',
            })

            if (error) {
              console.error('❌ Error upserting store:', store.name, JSON.stringify(error, null, 2))
            } else {
              console.log('✅ Successfully upserted store:', store.name)
            }
          }

          totalCount += stores.length
          offset += limit

          if (stores.length < limit) break
        }
      }

      await this.updateSyncState('stores', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing stores:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация заказов покупателей
  async syncCustomerOrders(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('customer_orders')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing customer orders (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getCustomerOrders({
          limit,
          offset,
          order: 'moment,desc',
          filter
        })
        const orders = data.rows || []

        if (orders.length === 0) break

        for (const order of orders) {
          // Извлекаем артикулы из позиций
          const positions = order.positions?.rows?.map((pos: any) => ({
            article: pos.assortment?.article,
            name: pos.assortment?.name,
            quantity: pos.quantity,
            price: pos.price / 100,
          })) || []

          const { error } = await (supabaseAdmin as any).from('customer_orders').upsert({
            id: order.id, // Use order.id as primary key
            name: order.name,
            moment: order.moment,
            sum: order.sum / 100 || 0,
            vat_sum: order.vatSum / 100 || 0,
            quantity: order.quantity || 0,
            agent_name: order.agent?.name,
            agent_id: order.agent?.meta?.href?.split('/').pop() || null,
            organization_name: order.organization?.name,
            organization_id: order.organization?.meta?.href?.split('/').pop() || null,
            state_name: order.state?.name,
            state_id: order.state?.meta?.href?.split('/').pop() || null,
            store_id: order.store?.meta?.href?.split('/').pop() || null,
            owner_id: order.owner?.meta?.href?.split('/').pop() || null,
            group_id: order.group?.meta?.href?.split('/').pop() || null,
            rate_currency: order.rate?.currency?.meta?.href?.split('/').pop() || null,
            rate_value: order.rate?.value || null,
            rate_multiplier: order.rate?.multiplier || null,
            printed: order.printed || false,
            published: order.published || false,
            deleted: order.deleted || null,
            positions: positions,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          })
        }

        totalCount += orders.length
        offset += limit

        if (orders.length < limit) break
      }

      await this.updateSyncState('customer_orders', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing customer orders:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация входящих платежей
  async syncPaymentsIn(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('payments_in')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing payments in (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getPaymentsIn({ limit, offset, filter })
        const payments = data.rows || []

        if (payments.length === 0) break

        for (const payment of payments) {
          await (supabaseAdmin as any).from('payments_in').upsert({
            moysklad_id: payment.id,
            name: payment.name,
            moment: payment.moment,
            sum: payment.sum / 100 || 0,
            vat_sum: payment.vatSum / 100 || 0,
            agent_name: payment.agent?.name,
            agent_id: payment.agent?.meta?.href?.split('/').pop() || null,
            organization_name: payment.organization?.name,
            organization_id: payment.organization?.meta?.href?.split('/').pop() || null,
            purpose: payment.paymentPurpose,
            incoming_number: payment.incomingNumber || null,
            incoming_date: payment.incomingDate || null,
            rate_currency: payment.rate?.currency?.meta?.href?.split('/').pop() || null,
            rate_value: payment.rate?.value || null,
            rate_multiplier: payment.rate?.multiplier || null,
            group_id: payment.group?.meta?.href?.split('/').pop() || null,
            owner_id: payment.owner?.meta?.href?.split('/').pop() || null,
            state_name: payment.state?.name || null,
            state_id: payment.state?.meta?.href?.split('/').pop() || null,
            operations: payment.operations?.map((op: any) => op.meta?.href?.split('/').pop()).join(',') || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += payments.length
        offset += limit

        if (payments.length < limit) break
      }

      await this.updateSyncState('payments_in', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing payments in:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация исходящих платежей
  async syncPaymentsOut(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('payments_out')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing payments out (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getPaymentsOut({ limit, offset, filter })
        const payments = data.rows || []

        if (payments.length === 0) break

        for (const payment of payments) {
          await (supabaseAdmin as any).from('payments_out').upsert({
            moysklad_id: payment.id,
            name: payment.name,
            moment: payment.moment,
            sum: payment.sum / 100 || 0,
            vat_sum: payment.vatSum / 100 || 0,
            agent_name: payment.agent?.name,
            agent_id: payment.agent?.meta?.href?.split('/').pop() || null,
            organization_name: payment.organization?.name,
            organization_id: payment.organization?.meta?.href?.split('/').pop() || null,
            purpose: payment.paymentPurpose,
            incoming_number: payment.incomingNumber || null,
            incoming_date: payment.incomingDate || null,
            rate_currency: payment.rate?.currency?.meta?.href?.split('/').pop() || null,
            rate_value: payment.rate?.value || null,
            rate_multiplier: payment.rate?.multiplier || null,
            group_id: payment.group?.meta?.href?.split('/').pop() || null,
            owner_id: payment.owner?.meta?.href?.split('/').pop() || null,
            state_name: payment.state?.name || null,
            state_id: payment.state?.meta?.href?.split('/').pop() || null,
            operations: payment.operations?.map((op: any) => op.meta?.href?.split('/').pop()).join(',') || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += payments.length
        offset += limit

        if (payments.length < limit) break
      }

      await this.updateSyncState('payments_out', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing payments out:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация приходных ордеров
  async syncCashIn(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('cash_in')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing cash in (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getCashIn({ limit, offset, filter })
        const cashIns = data.rows || []

        if (cashIns.length === 0) break

        for (const cashIn of cashIns) {
          await (supabaseAdmin as any).from('cash_in').upsert({
            moysklad_id: cashIn.id,
            name: cashIn.name,
            moment: cashIn.moment,
            sum: cashIn.sum / 100 || 0,
            agent_name: cashIn.agent?.name,
            agent_id: cashIn.agent?.meta?.href?.split('/').pop() || null,
            organization_name: cashIn.organization?.name,
            organization_id: cashIn.organization?.meta?.href?.split('/').pop() || null,
            incoming_number: cashIn.incomingNumber || null,
            incoming_date: cashIn.incomingDate || null,
            state_name: cashIn.state?.name || null,
            state_id: cashIn.state?.meta?.href?.split('/').pop() || null,
            rate_currency: cashIn.rate?.currency?.meta?.href?.split('/').pop() || null,
            rate_value: cashIn.rate?.value || null,
            rate_multiplier: cashIn.rate?.multiplier || null,
            group_id: cashIn.group?.meta?.href?.split('/').pop() || null,
            owner_id: cashIn.owner?.meta?.href?.split('/').pop() || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += cashIns.length
        offset += limit

        if (cashIns.length < limit) break
      }

      await this.updateSyncState('cash_in', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing cash in:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация расходных ордеров
  async syncCashOut(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('cash_out')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing cash out (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getCashOut({ limit, offset, filter })
        const cashOuts = data.rows || []

        if (cashOuts.length === 0) break

        for (const cashOut of cashOuts) {
          await (supabaseAdmin as any).from('cash_out').upsert({
            moysklad_id: cashOut.id,
            name: cashOut.name,
            moment: cashOut.moment,
            sum: cashOut.sum / 100 || 0,
            agent_name: cashOut.agent?.name,
            agent_id: cashOut.agent?.meta?.href?.split('/').pop() || null,
            organization_name: cashOut.organization?.name,
            organization_id: cashOut.organization?.meta?.href?.split('/').pop() || null,
            incoming_number: cashOut.incomingNumber || null,
            incoming_date: cashOut.incomingDate || null,
            state_name: cashOut.state?.name || null,
            state_id: cashOut.state?.meta?.href?.split('/').pop() || null,
            rate_currency: cashOut.rate?.currency?.meta?.href?.split('/').pop() || null,
            rate_value: cashOut.rate?.value || null,
            rate_multiplier: cashOut.rate?.multiplier || null,
            group_id: cashOut.group?.meta?.href?.split('/').pop() || null,
            owner_id: cashOut.owner?.meta?.href?.split('/').pop() || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += cashOuts.length
        offset += limit

        if (cashOuts.length < limit) break
      }

      await this.updateSyncState('cash_out', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing cash out:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация списаний
  async syncLosses(force = false) {
    try {
      const startTime = new Date()
      const lastSync = await this.getLastSyncTime('losses')
      const useIncremental = !force && lastSync

      const filter = useIncremental ? `updated>${this.formatDate(lastSync!)}` : undefined

      let offset = 0
      const limit = 100
      let totalCount = 0

      console.log(`🔄 Syncing losses (Incremental: ${useIncremental}, Last: ${lastSync})...`)

      while (true) {
        const data = await this.moySkladClient.getLosses({ limit, offset, filter })
        const losses = data.rows || []

        if (losses.length === 0) break

        for (const loss of losses) {
          await (supabaseAdmin as any).from('losses').upsert({
            moysklad_id: loss.id,
            name: loss.name,
            moment: loss.moment,
            sum: (loss.sum || 0) / 100,
            description: loss.description,
            state_name: loss.state?.name || null,
            state_id: loss.state?.meta?.href?.split('/').pop() || null,
            store_id: loss.store?.meta?.href?.split('/').pop() || null,
            organization_id: loss.organization?.meta?.href?.split('/').pop() || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'moysklad_id',
          })
        }

        totalCount += losses.length
        offset += limit

        if (losses.length < limit) break
      }

      await this.updateSyncState('losses', startTime)
      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing losses:', error)
      return { success: false, error: String(error) }
    }
  }

  // Helper to format date for MoySklad (YYYY-MM-DD HH:mm:ss)
  private formatDateForMoySklad(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toISOString().replace('T', ' ').substring(0, 19)
  }

  // Синхронизация оборотов
  async syncTurnover(periodStart?: string, periodEnd?: string) {
    try {
      // Default to last 30 days if not provided
      const end = periodEnd ? new Date(periodEnd) : new Date()
      const start = periodStart ? new Date(periodStart) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

      const momentFrom = this.formatDateForMoySklad(start.toISOString())
      const momentTo = this.formatDateForMoySklad(end.toISOString())

      let offset = 0
      const limit = 100
      let totalCount = 0

      while (true) {
        const data = await this.moySkladClient.getTurnover({
          limit,
          offset,
          momentFrom,
          momentTo
        })
        const rows = data.rows || []

        if (rows.length === 0) break

        for (const row of rows) {
          await (supabaseAdmin as any).from('turnover').upsert({
            product_id: row.assortment?.meta?.href?.split('/').pop() || null,
            article: row.assortment?.article || null, // Add article for easier lookup
            uom_name: row.assortment?.uom?.name || null,
            uom_href: row.assortment?.uom?.meta?.href || null,
            image_href: row.assortment?.image?.meta?.href || null,
            image_title: row.assortment?.image?.title || null,
            image_filename: row.assortment?.image?.filename || null,
            image_updated: row.assortment?.image?.updated || null,
            image_tiny_href: row.assortment?.image?.tiny?.href || null,
            image_miniature_href: row.assortment?.image?.miniature?.href || null,
            assortment_href: row.assortment?.meta?.href || null,
            assortment_type: row.assortment?.meta?.type || null,

            on_period_start_quantity: row.onPeriodStart?.quantity || 0,
            on_period_start_sum: row.onPeriodStart?.sum / 100 || 0,
            income_quantity: row.income?.quantity || 0,
            income_sum: row.income?.sum / 100 || 0,
            outcome_quantity: row.outcome?.quantity || 0,
            outcome_sum: row.outcome?.sum / 100 || 0,
            on_period_end_quantity: row.onPeriodEnd?.quantity || 0,
            on_period_end_sum: row.onPeriodEnd?.sum / 100 || 0,

            period_start: start.toISOString(),
            period_end: end.toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'product_id,period_start,period_end',
          })
        }

        totalCount += rows.length
        offset += limit

        if (rows.length < limit) break
      }

      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing turnover:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация прибыли по товарам
  async syncProfitByProduct(periodStart?: string, periodEnd?: string) {
    try {
      // Default to last 30 days if not provided
      const end = periodEnd ? new Date(periodEnd) : new Date()
      const start = periodStart ? new Date(periodStart) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

      const momentFrom = this.formatDateForMoySklad(start.toISOString())
      const momentTo = this.formatDateForMoySklad(end.toISOString())

      let offset = 0
      const limit = 100
      let totalCount = 0

      while (true) {
        const data = await this.moySkladClient.getProfitByProduct({
          limit,
          offset,
          momentFrom,
          momentTo
        })
        const rows = data.rows || []

        if (rows.length === 0) break

        // Fetch existing products to map IDs
        const msIds = rows.map((r: any) => r.assortment?.meta?.href?.split('/').pop()).filter(Boolean)
        const { data: existingProducts } = await (supabaseAdmin as any)
          .from('products')
          .select('id, moysklad_id')
          .in('moysklad_id', msIds)

        const existingMap = new Map(existingProducts?.map((p: any) => [p.moysklad_id, p.id]))

        for (const row of rows) {
          const msId = row.assortment?.meta?.href?.split('/').pop() || null
          const productId = existingMap.get(msId) || msId // Use DB ID if exists, else MS ID (which will fail FK if not in DB)

          // console.log(`Processing profit for product: ${productId} (MS ID: ${msId})`)

          const { error } = await (supabaseAdmin as any).from('profit_by_product').upsert({
            product_id: productId,
            article: row.assortment?.article || null,
            moment: end.toISOString(),
            uom_name: row.uom?.name,
            image_url: row.image?.miniature?.href,

            sell_quantity: row.sellQuantity || 0,
            sell_price: row.sellPrice / 100 || 0,
            sell_cost: row.sellCost / 100 || 0,
            sell_sum: row.sellSum / 100 || 0,
            sell_cost_sum: row.sellCostSum / 100 || 0,
            return_quantity: row.returnQuantity || 0,
            return_price: row.returnPrice / 100 || 0,
            return_cost: row.returnCost / 100 || 0,
            return_sum: row.returnSum / 100 || 0,
            return_cost_sum: row.returnCostSum / 100 || 0,
            sales_margin: row.margin || 0,

            period_start: start.toISOString(),
            period_end: end.toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'product_id,period_start,period_end',
          })

          if (error) {
            console.error(`❌ Profit Upsert Error for ${productId}:`, JSON.stringify(error))
          }
        }

        totalCount += rows.length
        offset += limit

        if (rows.length < limit) break
      }

      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing profit by product:', error)
      return { success: false, error: String(error) }
    }
  }

  // Синхронизация денег по счетам
  async syncMoneyByAccount(periodStart?: string, periodEnd?: string) {
    try {
      let offset = 0
      const limit = 100
      let totalCount = 0

      const params: any = { limit, offset }
      if (periodStart) params.momentFrom = periodStart
      if (periodEnd) params.momentTo = periodEnd

      while (true) {
        const data = await this.moySkladClient.getMoneyByAccount(params)
        const accounts = data.rows || []

        if (accounts.length === 0) break

        for (const account of accounts) {
          const { error } = await (supabaseAdmin as any).from('money_by_account').upsert({
            account_name: account.account?.name || account.name || 'Unknown Account',
            account_type: account.account?.accountType,
            balance: account.balance / 100 || 0,
            income: account.income / 100 || 0,
            outcome: account.outcome / 100 || 0,
            period_start: periodStart ? new Date(periodStart).toISOString() : null,
            period_end: periodEnd ? new Date(periodEnd).toISOString() : null,

            organization_name: account.organization?.name || null,
            organization_href: account.organization?.meta?.href || null,
            account_href: account.account?.meta?.href || null,

            data: account,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'account_name,period_start,period_end',
          })

          if (error) {
            console.error('❌ Money Upsert Error:', error)
          }
        }

        totalCount += accounts.length
        offset += limit

        if (accounts.length < limit) break
      }

      return { success: true, count: totalCount }
    } catch (error) {
      console.error('Error syncing money by account:', error)
      return { success: false, error: String(error) }
    }
  }

  // Полная синхронизация всех данных
  async syncAll(periodStart?: string, periodEnd?: string) {
    console.log('🚀 Starting optimized parallel sync...')
    const startTime = Date.now()

    // Phase 1: Base Entities (Sequential to ensure mapping availability)
    console.log('📦 Phase 1: Syncing Base Entities...')
    const products = await this.syncProducts()
    const variants = await this.syncVariants()
    const bundles = await this.syncBundles()
    // const counterparties = await this.syncCounterparties()
    const stores = await this.syncStores()

    // Phase 2: Transactional Data (Dependent on Base)
    // These can run in parallel with each other, but after Phase 1
    console.log('💸 Phase 2: Syncing Transactions...')
    const [
      stock,
      sales,
      purchases,
      customerOrders,
      paymentsIn,
      paymentsOut,
      cashIn,
      cashOut,
      losses
    ] = await Promise.all([
      this.syncStock(),
      this.syncSales(),
      this.syncPurchases(),
      this.syncCustomerOrders(),
      this.syncPaymentsIn(),
      this.syncPaymentsOut(),
      this.syncCashIn(),
      this.syncCashOut(),
      this.syncLosses()
    ])

    // Phase 3: Reports (Dependent on Transactions)
    // These are heavy analytical queries that should run after data is up to date
    console.log('📊 Phase 3: Syncing Reports...')
    const [turnover, profitByProduct, moneyByAccount] = await Promise.all([
      this.syncTurnover(periodStart, periodEnd),
      this.syncProfitByProduct(periodStart, periodEnd),
      this.syncMoneyByAccount(periodStart, periodEnd)
    ])

    const results = {
      products,
      stock,
      sales,
      purchases,
      stores,
      customerOrders,
      paymentsIn,
      paymentsOut,
      cashIn,
      cashOut,
      losses,
      turnover,
      profitByProduct,
      moneyByAccount,
    }

    // Calculate metrics after syncing all data
    try {
      console.log('🔄 Calculating product metrics...')
      const calculator = new MetricsCalculator()
      const metricsResult = await calculator.recalculateAllMetrics(
        periodStart ? new Date(periodStart) : undefined,
        periodEnd ? new Date(periodEnd) : undefined
      )
      console.log(`✅ Metrics calculation completed: ${metricsResult.successful} successful, ${metricsResult.failed} failed`)

      const duration = (Date.now() - startTime) / 1000
      console.log(`🏁 Full Sync completed in ${duration.toFixed(1)}s`)

      return { ...results, metrics: metricsResult }
    } catch (error) {
      console.error('❌ Error calculating metrics during syncAll:', error)
      return { ...results, metrics: { success: false, error: String(error) } }
    }
  }
}
