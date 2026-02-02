import { config } from 'dotenv'
config({ path: '.env.local' })

import { supabaseAdmin } from '../lib/supabase/server'
import { getWarehouseName } from '../lib/utils/warehouse'

async function run() {
    // 1. Find Preorder store
    const { data: stores } = await supabaseAdmin.from('stores').select('*')
    const preorderStore = (stores as any[])?.find(s => getWarehouseName(s.name) === 'Склад предзаказов')

    if (!preorderStore) {
        console.log('❌ Preorder store not found')
        return
    }

    console.log(`Checking stock for store: ${preorderStore.name} (${preorderStore.id})`)

    // 2. Get stock items
    const { data: stockItems } = await supabaseAdmin
        .from('stock')
        .select('product_id, quantity, reserve')
        .eq('store_id', preorderStore.id) as { data: any[] | null }

    if (!stockItems || stockItems.length === 0) {
        console.log('No stock items found')
        return
    }

    console.log(`Found ${stockItems.length} stock items.`)

    // 3. Get ALL products (to avoid .in() issues)
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, article, archived') as { data: any[] | null }

    const productsMap = new Map(products?.map(p => [p.id, p]))

    let totalQty = 0
    let totalReserve = 0
    let archivedQty = 0
    let archivedReserve = 0

    console.log('\n--- Detailed Items ---')
    stockItems.forEach(item => {
        const product = productsMap.get(item.product_id)
        const isArchived = product?.archived || false
        const isDisableKaspi = product?.disable_kaspi || false

        totalQty += item.quantity || 0
        totalReserve += item.reserve || 0

        if (item.reserve > 0 && isDisableKaspi) {
            console.log(`[${isArchived ? 'ARCHIVED' : 'ACTIVE'}, NO_KASPI] ${product?.name} (${product?.article}): Reserve=${item.reserve}`)
        }

        if (isArchived) {
            archivedQty += item.quantity || 0
            archivedReserve += item.reserve || 0
        }
    })

    console.log('\n--- Summary ---')
    console.log(`Total Quantity: ${totalQty}`)
    console.log(`Total Reserve: ${totalReserve}`)
    console.log(`Archived Quantity: ${archivedQty}`)
    console.log(`Archived Reserve: ${archivedReserve}`)
    console.log(`Net Quantity (excluding archived): ${totalQty - archivedQty}`)
    console.log(`Net Reserve (excluding archived): ${totalReserve - archivedReserve}`)
}

run()
