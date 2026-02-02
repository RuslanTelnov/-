import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabaseAdmin } from '../lib/supabase/server'
import { getWarehouseName } from '../lib/utils/warehouse'

async function run() {
    console.log('📊 Analyzing Preorder Warehouse Value...')

    // 1. Get Preorder Store ID
    const { data: stores } = await supabaseAdmin.from('stores').select('*')
    const preorderStore = (stores as any[])?.find(s => getWarehouseName(s.name) === 'Склад предзаказов')

    if (!preorderStore) {
        console.log('❌ Preorder store not found')
        return
    }
    console.log(`Store: ${preorderStore.name} (${preorderStore.id})`)

    // 2. Get Stock Items
    const { data: stockItems } = await supabaseAdmin
        .from('stock')
        .select('product_id, quantity, reserve')
        .eq('store_id', preorderStore.id) as { data: any[] | null }

    if (!stockItems || stockItems.length === 0) {
        console.log('No stock items found')
        return
    }

    // 3. Get ALL Products (to avoid .in() limits or issues)
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, article, price, sale_price, archived, disable_kaspi') as { data: any[] | null }

    const productsMap = new Map(products?.map(p => [p.id, p]))

    let totalReserve = 0
    let totalReserveValue = 0
    let totalQuantity = 0
    let totalValue = 0

    console.log('\n--- Detailed Breakdown ---')
    console.log('Format: [Status] Name (Article) | Reserve * Price = Value')

    stockItems.forEach(item => {
        const product = productsMap.get(item.product_id)
        if (!product) return

        // Logic from Dashboard.tsx
        const quantity = item.quantity || 0
        const reserve = item.reserve || 0

        // For Preorder, price is sale_price or price
        const price = product.sale_price || product.price || 0

        const itemValue = quantity * price
        const itemReserveValue = reserve * price

        // Filter logic from Dashboard.tsx (simplified)
        // Dashboard filters out archived products now
        if (product.archived) return

        totalQuantity += quantity
        totalValue += itemValue

        totalReserve += reserve
        totalReserveValue += itemReserveValue

        if (reserve > 0) {
            console.log(`[${product.archived ? 'ARCH' : 'ACT'}] ${product.name} (${product.article}) | ${reserve} * ${price} = ${itemReserveValue}`)
        }
    })

    console.log('\n--- Summary (Active Products Only) ---')
    console.log(`Total Quantity: ${totalQuantity}`)
    console.log(`Total Value (Qty * Price): ${totalValue.toLocaleString('ru-RU')} ₸`)
    console.log(`Total Reserve: ${totalReserve}`)
    console.log(`Total Reserve Value (Reserve * Price): ${totalReserveValue.toLocaleString('ru-RU')} ₸`)
}

run()
