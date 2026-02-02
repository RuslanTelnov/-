// Менеджер для работы с торговыми данными
// Будет использоваться для насыщения базы данных информацией о торговле в Казахстане

import { supabaseAdmin } from '../supabase/server'

export interface TradeDataInput {
  category: string
  title: string
  description?: string
  data: Record<string, any>
  source?: string
}

export class TradeDataManager {
  // Сохранение торговых данных
  async saveTradeData(input: TradeDataInput) {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('trade_data')
        .insert({
          category: input.category,
          title: input.title,
          description: input.description,
          data: input.data,
          source: input.source,
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error saving trade data:', error)
      return { success: false, error }
    }
  }

  // Получение торговых данных по категории
  async getTradeDataByCategory(category: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('trade_data')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error getting trade data:', error)
      return { success: false, error }
    }
  }

  // Получение всех торговых данных
  async getAllTradeData(limit = 100) {
    try {
      const { data, error } = await supabaseAdmin
        .from('trade_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error getting all trade data:', error)
      return { success: false, error }
    }
  }

  // Пример: Сохранение данных о рыночных ценах
  async saveMarketPrices(prices: Record<string, number>, source = 'external_api') {
    return this.saveTradeData({
      category: 'market_prices',
      title: 'Рыночные цены на товары',
      description: 'Актуальные рыночные цены на товары в Казахстане',
      data: { prices },
      source,
    })
  }

  // Пример: Сохранение данных о трендах
  async saveTrends(trends: any[], source = 'analytics') {
    return this.saveTradeData({
      category: 'trends',
      title: 'Тренды в торговле',
      description: 'Актуальные тренды в торговле Казахстана',
      data: { trends },
      source,
    })
  }
}

