#!/usr/bin/env tsx
/**
 * Скрипт для выполнения миграций в локальном Supabase
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function migrateLocalSupabase() {
  console.log('🔄 Выполнение миграций в локальном Supabase...\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Проверяем подключение
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1)
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    console.log('✅ Подключение к Supabase успешно\n')
  } catch (error: any) {
    console.error('❌ Ошибка подключения к Supabase:', error.message)
    console.error('Убедитесь, что Docker контейнеры запущены: docker-compose up -d')
    process.exit(1)
  }

  // Читаем основной файл схемы
  const schemaFile = join(process.cwd(), 'supabase', 'schema-working.sql')
  if (!existsSync(schemaFile)) {
    console.error(`❌ Файл ${schemaFile} не найден`)
    process.exit(1)
  }

  console.log('📄 Выполняю основную схему (schema-working.sql)...')
  const schemaSQL = readFileSync(schemaFile, 'utf-8')
  
  // Выполняем через RPC если доступно, иначе выводим инструкции
  try {
    // Разбиваем на отдельные команды и выполняем
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`   Найдено ${statements.length} SQL команд`)
    console.log('   ⚠️  Выполните schema-working.sql вручную через Studio или psql')
    console.log('   📝 Или используйте: psql -h localhost -p 54322 -U postgres -d postgres -f supabase/schema-working.sql\n')
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message)
  }

  // Выполняем миграции
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  if (existsSync(migrationsDir)) {
    const migrations = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    if (migrations.length > 0) {
      console.log(`📦 Найдено ${migrations.length} миграций:`)
      migrations.forEach(m => console.log(`   - ${m}`))
      console.log('   ⚠️  Выполните миграции вручную через Studio или psql\n')
    }
  }

  console.log('✅ Миграции готовы к выполнению')
  console.log('\n📋 Инструкции:')
  console.log('1. Откройте Supabase Studio: http://localhost:3001')
  console.log('2. Перейдите в SQL Editor')
  console.log('3. Скопируйте содержимое supabase/schema-working.sql')
  console.log('4. Выполните SQL')
  console.log('5. Повторите для миграций (migration-add-store-to-stock.sql и др.)')
  console.log('\nИли используйте psql:')
  console.log('   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/schema-working.sql')
}

migrateLocalSupabase().catch(console.error)

