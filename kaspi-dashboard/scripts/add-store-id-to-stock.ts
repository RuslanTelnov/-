// Скрипт для добавления колонки store_id в таблицу stock

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения Supabase')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function addStoreIdColumn() {
  console.log('🔄 Добавление колонки store_id в таблицу stock...\n')

  try {
    // Читаем SQL миграцию
    const migrationPath = resolve(process.cwd(), 'supabase', 'migration-add-store-to-stock.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Выполнение миграции...\n')

    // Выполняем SQL через RPC или напрямую
    // Supabase не поддерживает выполнение произвольного SQL через клиент
    // Нужно выполнить вручную в SQL Editor или использовать PostgREST

    // Проверяем, существует ли колонка
    let checkData, checkError;
    try {
      const result = await supabaseAdmin.rpc('exec_sql', {
        sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'stock' AND column_name = 'store_id'
      ` });
      checkData = result.data;
      checkError = result.error;
    } catch (e) {
      checkError = { message: 'RPC not available' };
    }

    // Если RPC не доступен, используем альтернативный способ
    if (checkError || !checkData) {
      console.log('⚠️ RPC не доступен, используем альтернативный способ...')
      console.log('\n📋 Выполните следующий SQL в SQL Editor Supabase:\n')
      console.log(migrationSQL)
      console.log('\n💡 После выполнения миграции запустите: npm run resync-stock\n')
      return
    }

    // Если колонка уже существует
    if (checkData && checkData.length > 0) {
      console.log('✅ Колонка store_id уже существует в таблице stock')
      return
    }

    // Выполняем миграцию
    console.log('Выполнение SQL миграции...')
    // Здесь нужно выполнить SQL вручную, так как Supabase клиент не поддерживает произвольный SQL

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message)
    console.log('\n📋 Выполните следующий SQL в SQL Editor Supabase:\n')
    const migrationPath = resolve(process.cwd(), 'supabase', 'migration-add-store-to-stock.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    console.log(migrationSQL)
    console.log('\n💡 После выполнения миграции запустите: npm run resync-stock\n')
  }
}

addStoreIdColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error)
    process.exit(1)
  })

