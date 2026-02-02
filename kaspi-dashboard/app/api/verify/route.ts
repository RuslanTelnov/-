import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const requiredTables = [
      'products',
      'stock',
      'sales',
      'purchases',
      'counterparties',
      'stores',
      'customer_orders',
      'payments_in',
      'payments_out',
      'cash_in',
      'cash_out',
      'losses',
      'turnover',
      'profit_by_product',
      'money_by_account',
      'product_metrics',
      'trade_data',
    ]

    const results: Record<string, { exists: boolean; error?: string; columns?: string[] }> = {}

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          if (error.code === '42P01') {
            results[tableName] = { exists: false, error: 'Table not found' }
          } else {
            results[tableName] = { exists: false, error: error.message }
          }
        } else {
          results[tableName] = { exists: true }
        }
      } catch (err: any) {
        results[tableName] = { exists: false, error: err.message }
      }
    }

    // Проверяем структуру products
    const { data: productsSample, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, moysklad_id, article, name')
      .limit(1)

    const allTablesExist = Object.values(results).every(r => r.exists)
    const productsStructureOk = !productsError && productsSample !== null

    return NextResponse.json({
      success: allTablesExist && productsStructureOk,
      tables: results,
      productsStructure: productsStructureOk ? 'OK' : 'Error',
      message: allTablesExist
        ? 'Все таблицы созданы успешно!'
        : 'Некоторые таблицы отсутствуют',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Ошибка при проверке базы данных'
      },
      { status: 500 }
    )
  }
}

