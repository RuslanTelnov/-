#!/usr/bin/env tsx
/**
 * Скрипт для настройки локального Supabase через Docker
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const ENV_DOCKER_FILE = '.env.docker'
const ENV_DOCKER_EXAMPLE = '.env.docker.example'

async function setupDockerSupabase() {
  console.log('🚀 Настройка локального Supabase через Docker...\n')

  // Проверяем наличие Docker
  try {
    const { execSync } = require('child_process')
    execSync('docker --version', { stdio: 'ignore' })
    console.log('✅ Docker установлен\n')
  } catch (error) {
    console.error('❌ Docker не установлен или не запущен')
    console.error('Установите Docker Desktop: https://www.docker.com/products/docker-desktop')
    process.exit(1)
  }

  // Проверяем наличие docker-compose
  try {
    const { execSync } = require('child_process')
    execSync('docker-compose --version', { stdio: 'ignore' })
    console.log('✅ Docker Compose установлен\n')
  } catch (error) {
    console.error('❌ Docker Compose не установлен')
    console.error('Установите Docker Compose или используйте Docker Desktop (включает Compose)')
    process.exit(1)
  }

  // Создаем .env.docker если его нет
  if (!existsSync(ENV_DOCKER_FILE)) {
    if (existsSync(ENV_DOCKER_EXAMPLE)) {
      const exampleContent = readFileSync(ENV_DOCKER_EXAMPLE, 'utf-8')
      writeFileSync(ENV_DOCKER_FILE, exampleContent)
      console.log(`✅ Создан файл ${ENV_DOCKER_FILE}`)
      console.log(`⚠️  ВАЖНО: Обновите пароли в ${ENV_DOCKER_FILE} перед запуском!\n`)
    } else {
      console.error(`❌ Файл ${ENV_DOCKER_EXAMPLE} не найден`)
      process.exit(1)
    }
  } else {
    console.log(`✅ Файл ${ENV_DOCKER_FILE} уже существует\n`)
  }

  // Создаем папку для миграций если её нет
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  if (!existsSync(migrationsDir)) {
    mkdirSync(migrationsDir, { recursive: true })
    console.log(`✅ Создана папка ${migrationsDir}`)
  }

  // Проверяем наличие docker-compose.yml
  if (!existsSync('docker-compose.yml')) {
    console.error('❌ Файл docker-compose.yml не найден')
    process.exit(1)
  }

  console.log('\n📋 Следующие шаги:')
  console.log('1. Обновите пароли в .env.docker (особенно POSTGRES_PASSWORD и JWT_SECRET)')
  console.log('2. Запустите: docker-compose up -d')
  console.log('3. Дождитесь запуска всех сервисов (может занять 1-2 минуты)')
  console.log('4. Выполните миграции: npm run migrate-local')
  console.log('5. Обновите .env.local с локальными URL:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=<из .env.docker>')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=<из .env.docker>')
  console.log('\n🌐 После запуска доступны:')
  console.log('   - API: http://localhost:8000')
  console.log('   - Studio: http://localhost:3001')
  console.log('   - PostgreSQL: localhost:54322')
  console.log('\n')
}

setupDockerSupabase().catch(console.error)

