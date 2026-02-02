export interface StockItem {
    id: string
    product_id: string
    store_id: string
    stock: number
    reserve: number
    days_in_stock: number
    last_entry_date: string | null
    product: {
        article: string
        name: string
        cost_price: number
        sale_price: number
        price: number
        kaspi_price?: number
        image_url?: string
    }
}

export type SortField = 'days_in_stock' | 'stock' | 'cost_price' | 'name' | 'total_value'
export type SortOrder = 'asc' | 'desc'

export interface ProfitItem {
    id: string
    product_id: string
    article: string | null
    moment: string
    uom_name: string | null
    image_url: string | null
    sell_quantity: number
    sell_price: number
    sell_cost: number
    sell_sum: number
    sell_cost_sum: number
    return_quantity: number
    return_price: number
    return_cost: number
    return_sum: number
    return_cost_sum: number
    sales_margin: number
    period_start: string
    period_end: string
    product?: {
        name: string
        article: string
    }
}
