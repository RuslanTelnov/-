
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

async function run() {
    console.log('🚀 Starting Kaspi API Comprehensive Test...')

    // 1. Get a few real SKUs from our DB to test with
    const { data: products } = await supabase
        .from('products')
        .select('article, code, name')
        .not('article', 'is', null)
        .limit(3)

    if (!products || products.length === 0) {
        console.log('No products found in DB to test with.')
        return
    }

    console.log(`📦 Testing with products: ${products.map(p => p.article).join(', ')}`)

    const client = axios.create({
        baseURL: 'https://kaspi.kz/shop/api/v2',
        headers: {
            'X-Auth-Token': KASPI_TOKEN,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
        }
    })

    // Helper to log response
    const logResp = (name: string, resp: any) => {
        console.log(`\n--- ${name} ---`)
        console.log(`Status: ${resp.status}`)
        if (resp.data?.data) {
            console.log(`Count: ${resp.data.data.length}`)
            if (resp.data.data.length > 0) {
                const item = resp.data.data[0]
                console.log('Sample Attributes:', JSON.stringify(item.attributes, null, 2))
            }
        } else {
            console.log('Data:', JSON.stringify(resp.data, null, 2))
        }
    }

    const logError = (name: string, err: any) => {
        console.log(`\n❌ ${name} Failed: ${err.response?.status} - ${JSON.stringify(err.response?.data || err.message)}`)
    }

    // Test 1: Try different base URLs and endpoints
    const variations = [
        // v2 endpoints
        { url: '/products', baseURL: 'https://kaspi.kz/shop/api/v2' },
        { url: '/offers', baseURL: 'https://kaspi.kz/shop/api/v2' },
        // v1 endpoints?
        { url: '/products', baseURL: 'https://kaspi.kz/shop/api/v1' },
        { url: '/offers', baseURL: 'https://kaspi.kz/shop/api/v1' },
        // No version?
        { url: '/products', baseURL: 'https://kaspi.kz/shop/api' },
        { url: '/offers', baseURL: 'https://kaspi.kz/shop/api' },
        // Import endpoint base?
        { url: '/import', baseURL: 'https://kaspi.kz/shop/api/products' },
    ]

    for (const item of variations) {
        try {
            console.log(`\nTesting ${item.baseURL}${item.url}...`)
            const customClient = axios.create({
                baseURL: item.baseURL,
                headers: {
                    'X-Auth-Token': KASPI_TOKEN,
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                }
            })
            const resp = await customClient.get(item.url, {
                params: { 'page[number]': 0, 'page[size]': 1 }
            })
            logResp(`${item.baseURL}${item.url}`, resp)
        } catch (e) {
            console.log(`❌ ${item.baseURL}${item.url}: ${e.response?.status || e.message}`)
        }
    }

    // Test 2: Fix Orders call
    try {
        console.log('\nTesting /orders with include=entries and date filter...')
        const past = new Date()
        past.setDate(past.getDate() - 10) // 10 days ago (max is 14)

        const resp = await client.get('/orders', {
            params: {
                'page[number]': 0,
                'page[size]': 5,
                'filter[orders][state]': 'ARCHIVE',
                'filter[orders][creationDate][$ge]': past.getTime(),
                'include': 'entries'
            }
        })
        logResp('/orders (with entries)', resp)

        // Check if we can extract product info from entries
        if (resp.data?.included) {
            console.log('Included Entries:', JSON.stringify(resp.data.included, null, 2))
        }
    } catch (e) { logError('/orders', e) }



}

run()
