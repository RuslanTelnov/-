import dotenv from 'dotenv'
import * as path from 'path'
import axios from 'axios'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const MOY_SKLAD_TOKEN = process.env.MOY_SKLAD_TOKEN

async function inspectEntities() {
    const productId = 'c650bd1d-a8c9-11f0-0a80-164400054e2a'
    const storeId = '71113bbc-6630-11f0-0a80-198100321b87'

    console.log(`🔍 Inspecting Entities in MoySklad API...\n`)

    const headers = {
        'Authorization': `Bearer ${MOY_SKLAD_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
    }

    try {
        // 1. Inspect Product
        console.log(`--- Product ${productId} ---`)
        try {
            const pRes = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/product/${productId}`, { headers })
            console.log('Name:', pRes.data.name)
            console.log('Archived:', pRes.data.archived)
            console.log('Code:', pRes.data.code)
            console.log('Article:', pRes.data.article)
            console.log('Updated:', pRes.data.updated)
        } catch (e: any) {
            console.log('Error fetching product:', e.response?.status, e.response?.statusText)
        }

        // 2. Inspect Store
        console.log(`\n--- Store ${storeId} ---`)
        try {
            const sRes = await axios.get(`https://api.moysklad.ru/api/remap/1.2/entity/store/${storeId}`, { headers })
            console.log('Name:', sRes.data.name)
            console.log('Archived:', sRes.data.archived)
            console.log('Updated:', sRes.data.updated)
        } catch (e: any) {
            console.log('Error fetching store:', e.response?.status, e.response?.statusText)
        }

    } catch (e) {
        console.error('❌ Script Error:', e)
    }
}

inspectEntities()
