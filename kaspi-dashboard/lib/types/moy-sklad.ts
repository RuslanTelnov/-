// Типы данных из Мой склад

export interface MoySkladProduct {
  id: string
  name: string
  code?: string
  article?: string
  description?: string
  price?: number
  salePrice?: number
  quantity?: number
  updated: string
  created: string
  meta: {
    href: string
    type: string
  }
}

export interface MoySkladStock {
  id: string
  name: string
  code?: string
  stock: number
  reserve: number
  inTransit: number
  quantity: number
  meta: {
    href: string
    type: string
  }
}

export interface MoySkladSale {
  id: string
  name: string
  moment: string
  sum: number
  quantity: number
  agent?: {
    name: string
  }
  organization?: {
    name: string
  }
  positions?: {
    quantity: number
    price: number
    assortment: {
      name: string
    }
  }[]
  meta: {
    href: string
    type: string
  }
}

export interface MoySkladPurchase {
  id: string
  name: string
  moment: string
  sum: number
  quantity: number
  agent?: {
    name: string
  }
  organization?: {
    name: string
  }
  meta: {
    href: string
    type: string
  }
}

export interface MoySkladCounterparty {
  id: string
  name: string
  phone?: string
  email?: string
  inn?: string
  kpp?: string
  legalAddress?: string
  actualAddress?: string
  meta: {
    href: string
    type: string
  }
}

