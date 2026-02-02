import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { parseSimpleSelect, executeViaPostgREST } from '@/lib/sql-executor/sql-to-postgrest'

export const dynamic = 'force-dynamic'

// Разрешенные SQL команды (только SELECT)
const ALLOWED_KEYWORDS = ['SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'DESCRIBE', 'DESC']

// Запрещенные SQL команды
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
  'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'MERGE', 'REPLACE'
]

/**
 * Валидация SQL запроса
 * Разрешает только SELECT запросы для безопасности
 */
function validateSQLQuery(query: string): { valid: boolean; error?: string } {
  const trimmedQuery = query.trim().toUpperCase()

  // Проверка на пустой запрос
  if (!trimmedQuery) {
    return { valid: false, error: 'SQL запрос не может быть пустым' }
  }

  // Проверка на запрещенные команды
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (trimmedQuery.includes(keyword)) {
      return {
        valid: false,
        error: `Команда ${keyword} запрещена. Разрешены только SELECT запросы.`
      }
    }
  }

  // Проверка, что запрос начинается с разрешенной команды
  const startsWithAllowed = ALLOWED_KEYWORDS.some(keyword =>
    trimmedQuery.startsWith(keyword)
  )

  if (!startsWithAllowed) {
    return {
      valid: false,
      error: 'Разрешены только SELECT запросы. Запрос должен начинаться с SELECT, WITH, EXPLAIN, SHOW или DESCRIBE.'
    }
  }

  // Дополнительная проверка на вложенные опасные команды
  const dangerousPatterns = [
    /;\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/i,
    /UNION.*SELECT.*FROM.*INFORMATION_SCHEMA/i,
    /pg_sleep|sleep|waitfor/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return {
        valid: false,
        error: 'Обнаружена потенциально опасная конструкция в запросе.'
      }
    }
  }

  return { valid: true }
}

/**
 * Выполнение SQL через Supabase RPC или прямой доступ через PostgREST
 */
async function executeQuery(query: string): Promise<{ data: any[]; error?: any }> {
  try {
    // Сначала пробуем использовать функцию execute_readonly_query, если она существует
    let rpcData, rpcError;
    try {
      const result = await (supabaseAdmin as any).rpc('execute_readonly_query', {
        query_text: query
      });
      rpcData = result.data;
      rpcError = result.error;
    } catch (e) {
      rpcError = { message: 'Function not found' };
    }

    if (!rpcError && rpcData) {
      // Функция существует и работает
      const results = Array.isArray(rpcData)
        ? rpcData.map((row: any) => row.result || row)
        : []
      return { data: results }
    }

    // Если функция не существует, пробуем парсить и выполнить через PostgREST
    const parsed = parseSimpleSelect(query)

    if (parsed) {
      // Выполняем через PostgREST API
      return await executeViaPostgREST(parsed, supabaseAdmin)
    }

    // Если запрос слишком сложный, возвращаем ошибку с подсказкой
    return {
      data: [],
      error: {
        message: 'Сложные SQL запросы (JOIN, подзапросы, агрегации) требуют установки функции execute_readonly_query. Простые SELECT запросы работают автоматически.',
        hint: 'Попробуйте упростить запрос или установите функцию из supabase/migration-add-sql-function.sql'
      }
    }
  } catch (error: any) {
    return { data: [], error }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'SQL запрос обязателен и должен быть строкой' },
        { status: 400 }
      )
    }

    // Валидация SQL запроса
    const validation = validateSQLQuery(query)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Невалидный SQL запрос' },
        { status: 400 }
      )
    }

    // Выполнение запроса
    const { data, error } = await executeQuery(query)

    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json(
        {
          error: error.message || 'Ошибка выполнения SQL запроса',
          details: process.env.NODE_ENV === 'development' ? error : undefined,
          hint: error.message?.includes('execute_readonly_query')
            ? 'Установите функцию execute_readonly_query в Supabase (см. docs/SQL_SETUP.md)'
            : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      rowCount: Array.isArray(data) ? data.length : 0,
      success: true
    })
  } catch (error: any) {
    console.error('SQL API error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Внутренняя ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
