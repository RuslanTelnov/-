// Скрипт для получения ссылки на Supabase

import { readFileSync } from 'fs'
import { resolve } from 'path'

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
    break
  } catch (err) {
    // Пробуем следующий путь
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ Ошибка: Не найдена переменная NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

// Извлекаем project reference из URL
// Формат: https://[project-ref].supabase.co
const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
const projectRef = urlMatch ? urlMatch[1] : null

if (!projectRef) {
  console.error('❌ Ошибка: Не удалось извлечь project reference из URL')
  console.error(`URL: ${supabaseUrl}`)
  process.exit(1)
}

const baseUrl = supabaseUrl.replace('/rest/v1', '').replace(/\/$/, '')

console.log('\n🔗 Ссылки на Supabase:\n')
console.log(`📋 REST API URL: ${supabaseUrl}`)
console.log(`🌐 Основной URL проекта: ${baseUrl}`)
console.log(`\n⚠️  ВАЖНО: Прямой URL проекта используется только для REST API!`)
console.log(`   Для доступа к интерфейсу используйте ссылки ниже.\n`)
console.log(`📊 Основная ссылка на Dashboard:`)
console.log(`   https://app.supabase.com/project/${projectRef}`)
console.log(`\n🔧 Полезные ссылки:`)
console.log(`   • SQL Editor: https://app.supabase.com/project/${projectRef}/sql/new`)
console.log(`   • Table Editor: https://app.supabase.com/project/${projectRef}/editor`)
console.log(`   • Database: https://app.supabase.com/project/${projectRef}/database`)
console.log(`   • Settings: https://app.supabase.com/project/${projectRef}/settings/general`)
console.log(`   • API Settings: https://app.supabase.com/project/${projectRef}/settings/api`)
console.log(`   • Authentication: https://app.supabase.com/project/${projectRef}/auth/users`)
console.log(`   • Storage: https://app.supabase.com/project/${projectRef}/storage/buckets`)
console.log(`\n💡 Если ссылки не работают:`)
console.log(`   1. Убедитесь, что вы авторизованы в Supabase`)
console.log(`   2. Перейдите на https://app.supabase.com`)
console.log(`   3. Выберите проект "${projectRef}" из списка`)
console.log(`   4. Или используйте прямой поиск: https://app.supabase.com/project/${projectRef}`)
console.log('')

