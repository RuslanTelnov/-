import { supabaseAdmin } from '../supabase/server'

interface ProductMetricsInput {
  article: string
  periodStart: Date
  periodEnd: Date
}

export class MetricsCalculator {
  // Расчет всех показателей для товара
  async calculateProductMetrics(input: ProductMetricsInput) {
    const { article, periodStart, periodEnd } = input

    // Получаем данные о товаре
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('article', article)
      .single() as { data: any, error: any }

    if (!product) {
      throw new Error(`Product with article ${article} not found`)
    }

    // Получаем остатки
    const { data: stock } = await supabaseAdmin
      .from('stock')
      .select('*')
      .eq('product_id', product.id)
      .single() as { data: any, error: any }

    // Получаем продажи за период
    const { data: sales } = await supabaseAdmin
      .from('sales')
      .select('*')
      .gte('moment', periodStart.toISOString())
      .lte('moment', periodEnd.toISOString())

    // Получаем заказы покупателей за период
    const { data: orders } = await supabaseAdmin
      .from('customer_orders')
      .select('*')
      .gte('moment', periodStart.toISOString())
      .lte('moment', periodEnd.toISOString())

    // Извлекаем продажи по артикулу из заказов
    const orderSales = orders?.flatMap((order: any) =>
      (order.positions || []).filter((pos: any) => pos.article === article)
    ) || []

    // Получаем отчет по прибыли
    const { data: profitData } = await supabaseAdmin
      .from('profit_by_product')
      .select('*')
      .eq('article', article)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .order('period_end', { ascending: false })
      .limit(1)
      .single() as { data: any, error: any }

    // Получаем отчет по оборотам
    const { data: turnoverData } = await supabaseAdmin
      .from('turnover')
      .select('*')
      .eq('article', article)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .order('period_end', { ascending: false })
      .limit(1)
      .single() as { data: any, error: any }

    // Расчет показателей
    const daysInPeriod = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)

    // Оборачиваемость
    const totalSalesQuantity = orderSales.reduce((sum, pos) => sum + (pos.quantity || 0), 0)
    const avgStock = stock?.quantity || 0
    const turnoverRatio = avgStock > 0 ? totalSalesQuantity / avgStock : 0
    const turnoverDays = turnoverRatio > 0 ? daysInPeriod / turnoverRatio : 999

    // Маржа
    const marginPercent = profitData?.margin || 0
    const marginAmount = profitData?.profit || 0

    // Выручка
    const totalRevenue = profitData?.revenue ||
      orderSales.reduce((sum, pos) => sum + (pos.price || 0) * (pos.quantity || 0), 0)
    const avgRevenuePerDay = daysInPeriod > 0 ? totalRevenue / daysInPeriod : 0

    // Ликвидность (скорость продаж)
    const salesVelocity = daysInPeriod > 0 ? totalSalesQuantity / daysInPeriod : 0

    // Оценка ликвидности (0-100)
    // Высокая скорость продаж + низкие остатки = высокая ликвидность
    const liquidityScore = this.calculateLiquidityScore(
      salesVelocity,
      avgStock,
      totalRevenue,
      daysInPeriod
    )

    // Приоритет для оптимизации (0-100)
    // Высокий приоритет: низкая маржа, низкая оборачиваемость, низкая ликвидность
    const priorityScore = this.calculatePriorityScore(
      marginPercent,
      turnoverRatio,
      liquidityScore,
      totalRevenue
    )

    // Рекомендации
    const recommendation = this.generateRecommendation(
      marginPercent,
      turnoverRatio,
      liquidityScore,
      avgStock,
      salesVelocity
    )

    // Сохраняем метрики
    const metrics = {
      article: article,
      product_name: product.name,
      turnover_ratio: turnoverRatio,
      turnover_days: turnoverDays,
      margin_percent: marginPercent,
      margin_amount: marginAmount,
      liquidity_score: liquidityScore,
      sales_velocity: salesVelocity,
      total_revenue: totalRevenue,
      avg_revenue_per_day: avgRevenuePerDay,
      current_stock: stock?.quantity || 0,
      avg_stock: avgStock,
      recommendation: recommendation,
      priority_score: priorityScore,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      calculated_at: new Date().toISOString(),
    }

    await (supabaseAdmin as any).from('product_metrics').upsert(metrics, {
      onConflict: 'article',
    })

    return metrics
  }

  // Расчет оценки ликвидности (0-100)
  private calculateLiquidityScore(
    salesVelocity: number,
    avgStock: number,
    totalRevenue: number,
    daysInPeriod: number
  ): number {
    if (avgStock === 0) return 0

    // Нормализуем скорость продаж (предполагаем, что > 1 ед/день = хорошо)
    const velocityScore = Math.min(salesVelocity / 1, 1) * 40

    // Нормализуем выручку (предполагаем, что > 10000 в день = хорошо)
    const revenueScore = Math.min((totalRevenue / daysInPeriod) / 10000, 1) * 30

    // Низкие остатки при хороших продажах = высокая ликвидность
    const stockScore = avgStock > 0 && salesVelocity > 0
      ? Math.min(1 / (avgStock / salesVelocity), 1) * 30
      : 0

    return Math.min(velocityScore + revenueScore + stockScore, 100)
  }

  // Расчет приоритета для оптимизации (0-100)
  private calculatePriorityScore(
    marginPercent: number,
    turnoverRatio: number,
    liquidityScore: number,
    totalRevenue: number
  ): number {
    let score = 0

    // Низкая маржа = высокий приоритет (40%)
    if (marginPercent < 10) score += 40
    else if (marginPercent < 20) score += 30
    else if (marginPercent < 30) score += 20
    else score += 10

    // Низкая оборачиваемость = высокий приоритет (30%)
    if (turnoverRatio < 0.5) score += 30
    else if (turnoverRatio < 1) score += 20
    else if (turnoverRatio < 2) score += 10
    else score += 5

    // Низкая ликвидность = высокий приоритет (20%)
    if (liquidityScore < 30) score += 20
    else if (liquidityScore < 50) score += 15
    else if (liquidityScore < 70) score += 10
    else score += 5

    // Низкая выручка = высокий приоритет (10%)
    if (totalRevenue < 10000) score += 10
    else if (totalRevenue < 50000) score += 5
    else score += 2

    return Math.min(score, 100)
  }

  // Генерация рекомендаций
  private generateRecommendation(
    marginPercent: number,
    turnoverRatio: number,
    liquidityScore: number,
    avgStock: number,
    salesVelocity: number
  ): string {
    const recommendations: string[] = []

    if (marginPercent < 15) {
      recommendations.push('Низкая маржа - рассмотрите повышение цены или снижение себестоимости')
    }

    if (turnoverRatio < 1) {
      recommendations.push('Низкая оборачиваемость - возможно, избыточные остатки')
    }

    if (liquidityScore < 40) {
      recommendations.push('Низкая ликвидность - товар продается медленно')
    }

    if (avgStock > 0 && salesVelocity > 0 && avgStock / salesVelocity > 90) {
      recommendations.push('Высокие остатки - рассмотрите акцию или снижение закупок')
    }

    if (salesVelocity > 0 && avgStock / salesVelocity < 30 && salesVelocity > 1) {
      recommendations.push('Высокий спрос - рассмотрите увеличение остатков')
    }

    if (marginPercent > 30 && turnoverRatio > 2 && liquidityScore > 70) {
      recommendations.push('Отличные показатели - товар приносит хорошую прибыль')
    }

    return recommendations.length > 0
      ? recommendations.join('; ')
      : 'Показатели в норме, продолжайте мониторинг'
  }

  // Пересчет метрик для всех товаров
  async recalculateAllMetrics(periodStart?: Date, periodEnd?: Date) {
    const start = periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 дней назад
    const end = periodEnd || new Date()

    // Получаем все товары
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('article')

    if (!products) return { success: false, error: 'No products found' }

    const results = []
    for (const product of (products as any[])) {
      try {
        const metrics = await this.calculateProductMetrics({
          article: product.article,
          periodStart: start,
          periodEnd: end,
        })
        results.push({ article: product.article, success: true, metrics })
      } catch (error) {
        results.push({ article: product.article, success: false, error: String(error) })
      }
    }

    return {
      success: true,
      total: products.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    }
  }
}

