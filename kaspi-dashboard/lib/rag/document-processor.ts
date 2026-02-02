// Преобразование данных из таблиц в документы для RAG
import { supabaseAdmin } from '../supabase/server'
import { Document } from './vector-store'

export interface ProcessingOptions {
    chunkSize?: number
    chunkOverlap?: number
    includeMetadata?: boolean
}

export class DocumentProcessor {
    /**
     * Обрабатывает продукты в документы
     */
    async processProducts(limit?: number): Promise<Document[]> {
        const query = (supabaseAdmin as any)
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (limit) {
            query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch products: ${error.message}`)
        }

        return (data || []).map((product: any) => ({
            content: this.formatProduct(product),
            metadata: {
                type: 'product',
                article: product.article,
                name: product.name,
                price: product.price,
            },
            sourceTable: 'products',
            sourceId: product.id,
        }))
    }

    /**
     * Обрабатывает метрики продуктов в документы
     */
    async processProductMetrics(limit?: number): Promise<Document[]> {
        const query = (supabaseAdmin as any)
            .from('product_metrics')
            .select('*')
            .order('priority_score', { ascending: false })

        if (limit) {
            query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch product metrics: ${error.message}`)
        }

        return (data || []).map((metric: any) => ({
            content: this.formatMetric(metric),
            metadata: {
                type: 'metric',
                article: metric.article,
                priority_score: metric.priority_score,
            },
            sourceTable: 'product_metrics',
            sourceId: metric.id,
        }))
    }

    /**
     * Обрабатывает продажи в документы
     */
    async processSales(limit?: number): Promise<Document[]> {
        const query = (supabaseAdmin as any)
            .from('sales')
            .select('*')
            .order('moment', { ascending: false })

        if (limit) {
            query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch sales: ${error.message}`)
        }

        return (data || []).map((sale: any) => ({
            content: this.formatSale(sale),
            metadata: {
                type: 'sale',
                sum: sale.sum,
                moment: sale.moment,
            },
            sourceTable: 'sales',
            sourceId: sale.id,
        }))
    }

    /**
     * Обрабатывает заказы покупателей в документы
     */
    async processCustomerOrders(limit?: number): Promise<Document[]> {
        const query = (supabaseAdmin as any)
            .from('customer_orders')
            .select('*')
            .order('moment', { ascending: false })

        if (limit) {
            query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch customer orders: ${error.message}`)
        }

        return (data || []).map((order: any) => ({
            content: this.formatCustomerOrder(order),
            metadata: {
                type: 'customer_order',
                name: order.name,
                sum: order.sum,
                moment: order.moment,
                agent: order.agent_name,
            },
            sourceTable: 'customer_orders',
            sourceId: order.moysklad_id,
        }))
    }

    /**
     * Форматирует продукт в текст
     */
    private formatProduct(product: any): string {
        return `Товар: ${product.name}
Артикул: ${product.article}
Код: ${product.code || 'Нет'}
Цена: ${product.price} ₸
Цена продажи: ${product.sale_price} ₸
Цена закупки: ${product.buy_price || 'Не указана'} ₸
Количество на складе: ${product.quantity}
Резерв: ${product.quantity_reserve || 0}
Вес: ${product.weight || 'Не указан'}
Объем: ${product.volume || 'Не указан'}
Владелец: ${product.owner || 'Не указан'}
Не выгружать на Kaspi: ${product.disable_kaspi ? 'Да' : 'Нет'}
Отключить демпинг: ${product.disable_dumping ? 'Да' : 'Нет'}
Предзаказ (дней): ${product.preorder_days || 'Нет'}
Архивный: ${product.archived ? 'Да' : 'Нет'}
Описание: ${product.description || 'Нет описания'}`
    }

    /**
     * Форматирует метрику в текст
     */
    private formatMetric(metric: any): string {
        return `Метрики товара: ${metric.product_name} (${metric.article})
Оборачиваемость: ${metric.turnover_ratio} (${metric.turnover_days} дней)
Маржинальность: ${metric.margin_percent}% (${metric.margin_amount} ₸)
Ликвидность: ${metric.liquidity_score}
Скорость продаж: ${metric.sales_velocity} шт/день
Выручка: ${metric.total_revenue} ₸
Текущий остаток: ${metric.current_stock}
Рекомендация: ${metric.recommendation || 'Нет рекомендаций'}
Приоритет: ${metric.priority_score}`
    }

    /**
     * Форматирует продажу в текст
     */
    private formatSale(sale: any): string {
        return `Продажа: ${sale.name}
Дата: ${new Date(sale.moment).toLocaleString('ru-RU')}
Сумма: ${sale.sum} ₸
Количество: ${sale.quantity}
Контрагент: ${sale.agent_name || 'Не указан'}
Организация: ${sale.organization_name || 'Не указана'}`
    }

    /**
     * Форматирует заказ покупателя в текст
     */
    private formatCustomerOrder(order: any): string {
        const positions = order.positions?.map((p: any) => `- ${p.name}: ${p.quantity} шт. x ${p.price} ₸`).join('\n') || 'Нет позиций'
        return `Заказ покупателя: ${order.name}
Дата: ${new Date(order.moment).toLocaleString('ru-RU')}
Статус: ${order.state_name || 'Не указан'}
Сумма: ${order.sum} ₸
НДС: ${order.vat_sum || 0} ₸
Контрагент: ${order.agent_name || 'Не указан'}
Организация: ${order.organization_name || 'Не указана'}
Склад: ${order.store_name || 'Не указан'}
Позиции:
${positions}`
    }
}

export function getDocumentProcessor(): DocumentProcessor {
    return new DocumentProcessor()
}
