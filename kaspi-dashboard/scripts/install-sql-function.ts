#!/usr/bin/env tsx
/**
 * Скрипт для автоматической установки SQL функции в Supabase
 * 
 * Использование:
 *   npm run install-sql-function
 * 
 * Или напрямую:
 *   tsx scripts/install-sql-function.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения Supabase')
  console.error('Убедитесь, что NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY установлены в .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function installSQLFunction() {
  try {
    console.log('📦 Чтение SQL скрипта...')
    
    const sqlPath = join(process.cwd(), 'supabase', 'migration-add-sql-function.sql')
    const sqlScript = readFileSync(sqlPath, 'utf-8')
    
    console.log('🚀 Выполнение SQL скрипта в Supabase...')
    
    // Выполняем SQL через RPC (если доступно) или напрямую
    // В Supabase нет прямого API для выполнения произвольного SQL,
    // поэтому выводим инструкции
    
    console.log('\n✅ SQL скрипт готов к выполнению!')
    console.log('\n📋 Инструкции:')
    console.log('1. Откройте ваш проект Supabase: https://supabase.com/dashboard')
    console.log('2. Перейдите в SQL Editor')
    console.log('3. Скопируйте содержимое файла: supabase/migration-add-sql-function.sql')
    console.log('4. Вставьте в SQL Editor и нажмите "Run"')
    console.log('\n📄 Содержимое скрипта:')
    console.log('─'.repeat(60))
    console.log(sqlScript)
    console.log('─'.repeat(60))
    
    // Альтернатива: попробовать выполнить через REST API (если доступно)
    console.log('\n💡 Альтернативный способ:')
    console.log('Вы можете использовать Supabase CLI для выполнения миграций:')
    console.log('  supabase db push')
    
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message)
    process.exit(1)
  }
}

installSQLFunction()

