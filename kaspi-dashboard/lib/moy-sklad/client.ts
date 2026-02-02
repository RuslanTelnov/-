import axios, { AxiosInstance } from 'axios'

export interface MoySkladConfig {
  apiUrl: string
  token?: string
  username?: string
  password?: string
}

class MoySkladClient {
  private client: AxiosInstance

  constructor(config: MoySkladConfig) {
    // Мой склад API использует Basic Authentication
    // Формат: Authorization: Basic base64(логин:пароль)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.token) {
      // Мой склад API поддерживает два формата:
      // 1. Bearer токен (для API токенов)
      // 2. Basic Auth с логин:пароль
      if (config.token.includes(':')) {
        // Это логин:пароль, используем Basic Auth
        headers['Authorization'] = `Basic ${Buffer.from(config.token).toString('base64')}`
      } else {
        // Это API токен - используем Bearer формат
        headers['Authorization'] = `Bearer ${config.token}`
      }
    } else if (config.username && config.password) {
      // Basic Auth с логином и паролем
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64')
      headers['Authorization'] = `Basic ${credentials}`
    }

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers,
    })
  }

  // Получение товаров
  async getProducts(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/product', { params })
    return response.data
  }

  // Получение комплектов
  async getBundles(params?: { limit?: number; offset?: number; filter?: string }) {
    // Clean params to remove undefined values
    const cleanParams = params ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined)) : undefined
    const response = await this.client.get('/entity/bundle', { params: cleanParams })
    return response.data
  }

  // Получение остатков по складам
  async getStock(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/report/stock/bystore', { params })
    return response.data
  }

  // Получение общих остатков (с ценами)
  async getStockAll(params?: { limit?: number; offset?: number; stockDays?: string }) {
    const response = await this.client.get('/report/stock/all', { params })
    return response.data
  }

  // Получение продаж
  async getSales(params?: { limit?: number; offset?: number; filter?: string; expand?: string; order?: string }) {
    const response = await this.client.get('/entity/demand', { params })
    return response.data
  }

  // Получение возвратов покупателей
  async getSalesReturns(params?: { limit?: number; offset?: number; filter?: string; expand?: string }) {
    const response = await this.client.get('/entity/salesreturn', { params })
    return response.data
  }

  // Получение закупок
  async getPurchases(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/supply', { params })
    return response.data
  }

  // Получение контрагентов
  async getCounterparties(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/counterparty', { params })
    return response.data
  }

  // Получение складов
  async getStores(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/store', { params })
    return response.data
  }

  // Получение заказов покупателей
  async getCustomerOrders(params?: { limit?: number; offset?: number; filter?: string; order?: string }) {
    const response = await this.client.get('/entity/customerorder', { params })
    return response.data
  }

  // Получение входящих платежей
  async getPaymentsIn(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/paymentin', { params })
    return response.data
  }

  // Получение исходящих платежей
  async getPaymentsOut(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/paymentout', { params })
    return response.data
  }

  // Получение приходных ордеров
  async getCashIn(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/cashin', { params })
    return response.data
  }

  // Получение расходных ордеров
  async getCashOut(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/cashout', { params })
    return response.data
  }

  // Получение списаний
  async getLosses(params?: { limit?: number; offset?: number; filter?: string }) {
    const response = await this.client.get('/entity/loss', { params })
    return response.data
  }

  // Получение отчета по оборотам
  async getTurnover(params?: {
    limit?: number
    offset?: number
    filter?: string
    momentFrom?: string
    momentTo?: string
  }) {
    const response = await this.client.get('/report/turnover/all', { params })
    return response.data
  }

  // Получение отчета по прибыли по товарам
  async getProfitByProduct(params?: {
    limit?: number
    offset?: number
    filter?: string
    momentFrom?: string
    momentTo?: string
  }) {
    const response = await this.client.get('/report/profit/byproduct', { params })
    return response.data
  }

  // Получение отчета по деньгам по счетам
  async getMoneyByAccount(params?: {
    limit?: number
    offset?: number
    filter?: string
    momentFrom?: string
    momentTo?: string
  }) {
    const response = await this.client.get('/report/money/byaccount', { params })
    return response.data
  }

  // Универсальный метод для получения любых данных
  async getData(endpoint: string, params?: Record<string, any>) {
    const response = await this.client.get(endpoint, { params })
    return response.data
  }
}

export const createMoySkladClient = (config: MoySkladConfig) => {
  return new MoySkladClient(config)
}

