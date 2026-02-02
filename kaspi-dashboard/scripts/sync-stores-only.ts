// Скрипт для синхронизации только складов

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

// Создаем клиенты напрямую
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

async function syncStores() {
  console.log('🔄 Синхронизация складов из "Мой склад"...\n')

  try {
    let offset = 0
    const limit = 100
    let totalCount = 0

    while (true) {
      const data = await moySkladClient.getStores({ limit, offset })
      const stores = data.rows || []

      if (stores.length === 0) break

      console.log(`📦 Обработка ${stores.length} складов (offset: ${offset})...`)

      for (const store of stores) {
        const { error } = await supabaseAdmin.from('stores').upsert({
          moysklad_id: store.id,
          name: store.name || 'Без названия',
          address: store.address || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'moysklad_id',
        })

        if (error) {
          console.error(`❌ Ошибка синхронизации склада ${store.name}:`, error.message)
        } else {
          console.log(`   ✅ ${store.name}`)
        }
      }

      totalCount += stores.length
      offset += limit

      if (stores.length < limit) break
    }

    console.log(`\n✅ Синхронизация завершена!`)
    console.log(`📊 Всего синхронизировано складов: ${totalCount}`)

    // Показываем список синхронизированных складов
    const { data: syncedStores } = await supabaseAdmin
      .from('stores')
      .select('name')
      .order('name')

    if (syncedStores && syncedStores.length > 0) {
      console.log(`\n📋 Список складов в базе (${syncedStores.length}):`)
      syncedStores.forEach((s: any) => {
        console.log(`   - ${s.name}`)
      })
    }

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

syncStores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error)
    process.exit(1)
  })
