import axios from 'axios'
import { config } from 'dotenv'
config({ path: '.env.local' })

const token = process.env.KASPI_API_TOKEN

async function probe() {
    if (!token) {
        console.error('No token found')
        return
    }

    const endpoints = [
        '/master/product/offer',
        '/offers',
        '/statistics/offers',
        '/xml/offers',
        '/points',
        '/connections'
    ]

    console.log('🔍 Probing Kaspi API endpoints for Price data...')

    for (const ep of endpoints) {
        try {
            const url = `https://kaspi.kz/shop/api/v2${ep}`
            console.log(`\nTesting ${ep}...`)
            const response = await axios.get(url, {
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                },
                params: {
                    'page[number]': 0,
                    'page[size]': 5
                }
            })
            console.log(`✅ ${ep} - Status: ${response.status}`)
            if (response.data?.data) {
                console.log(`   Data count: ${response.data.data.length}`)
                if (response.data.data.length > 0) {
                    console.log('   Sample:', JSON.stringify(response.data.data[0].attributes || response.data.data[0], null, 2))
                }
            }
        } catch (e: any) {
            console.log(`❌ ${ep} - Failed: ${e.response?.status} ${e.response?.statusText}`)
        }
    }
}

probe()
