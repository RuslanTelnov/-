// Типы для Supabase таблиц

export interface Product {
  id: string
  moysklad_id: string
  name: string
  code?: string
  article?: string
  description?: string
  price?: number
  sale_price?: number
  quantity?: number
  created_at: string
  updated_at: string
}

export interface Stock {
  id: string
  product_id: string
  stock: number
  reserve: number
  in_transit: number
  quantity: number
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  moysklad_id: string
  name: string
  moment: string
  sum: number
  quantity: number
  agent_name?: string
  organization_name?: string
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  moysklad_id: string
  name: string
  moment: string
  sum: number
  quantity: number
  agent_name?: string
  organization_name?: string
  created_at: string
  updated_at: string
}

export interface Counterparty {
  id: string
  moysklad_id: string
  name: string
  phone?: string
  email?: string
  inn?: string
  kpp?: string
  legal_address?: string
  actual_address?: string
  created_at: string
  updated_at: string
}

export interface TradeData {
  id: string
  category: string
  title: string
  description?: string
  data: Record<string, any>
  source?: string
  created_at: string
  updated_at: string
}

