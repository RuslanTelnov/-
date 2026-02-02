
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const KASPI_TOKEN = process.env.KASPI_API_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!KASPI_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const client = axios.create({
    baseURL: 'https://kaspi.kz/shop/api/v2',
    headers: {
        'X-Auth-Token': KASPI_TOKEN,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
    }
})

async function syncOrders() {
    console.log('🚀 Starting Kaspi Order History Sync...')

    // 1. Fetch products to map Code -> ID
    const { data: products } = await supabase
        .from('products')
        .select('id, code, article, name, kaspi_price')

    if (!products) {
        console.error('Failed to fetch products')
        return
    }

    // Create maps for fast lookup
    // Kaspi "code" in orders usually matches our "article" or "code"
    const codeMap = new Map(products.map(p => [p.code, p]))
    const articleMap = new Map(products.map(p => [p.article, p]))

    console.log(`📦 Loaded ${products.length} products from DB`)

    // 2. Fetch Orders
    const past = new Date()
    past.setDate(past.getDate() - 14) // Look back 14 days (API limit)

    let page = 0
    const pageSize = 20
    let totalProcessed = 0
    let updates = 0

    while (true) {
        try {
            console.log(`Fetching orders page ${page}...`)
            const resp = await client.get('/orders', {
                params: {
                    'page[number]': page,
                    'page[size]': pageSize,
                    'filter[orders][state]': 'ARCHIVE',
                    'filter[orders][creationDate][$ge]': past.getTime()
                }
            })

            const orders = resp.data.data
            if (!orders || orders.length === 0) {
                console.log('No more orders.')
                break
            }

            for (const order of orders) {
                const orderId = order.id
                // Fetch entries for this order
                try {
                    const entriesResp = await client.get(`/orders/${orderId}/entries`)
                    const entries = entriesResp.data.data

                    if (!entries) continue

                    for (const entry of entries) {
                        const attrs = entry.attributes

                        // SKU is in offer.code
                        const productCode = attrs.offer?.code
                        const price = attrs.basePrice || (attrs.totalPrice / attrs.quantity)

                        // Find product in our DB
                        let product = codeMap.get(productCode) || articleMap.get(productCode)

                        if (product) {
                            // console.log(`Found product: ${product.name} (${productCode}) - Price: ${price}`)

                            // Update history if price is valid
                            if (price > 0) {
                                // Insert into history
                                const { error: histError } = await supabase
                                    .from('kaspi_price_history')
                                    .insert({
                                        product_id: product.id,
                                        price: price,
                                        source: 'order',
                                        created_at: new Date(order.attributes.creationDate).toISOString()
                                    })

                                if (!histError) {
                                    // Update product current price if it's missing or if we want to update it
                                    // Only update if kaspi_price is null (preserve XML price as primary)
                                    if (!product.kaspi_price) {
                                        await supabase
                                            .from('products')
                                            .update({ kaspi_price: price })
                                            .eq('id', product.id)
                                        updates++
                                        console.log(`✅ Updated price for ${product.name}: ${price}`)
                                    }
                                }
                            }
                        } else {
                            // console.log(`Product not found for code: ${productCode}`)
                        }
                    }
                } catch (e: any) {
                    console.error(`Failed to fetch entries for order ${orderId}:`, e.message)
                }
            }

            totalProcessed += orders.length
            page++
            // if (page > 5) break // Safety limit removed for production

        } catch (e: any) {
            console.error('Error fetching orders:', e.message)
            break
        }
    }

    console.log(`🏁 Sync Complete. Processed ${totalProcessed} orders. Updated ${updates} products.`)
}

syncOrders()
