
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const KASPI_TOKEN = process.env.KASPI_API_TOKEN

if (!KASPI_TOKEN) {
    console.error('Missing KASPI_API_TOKEN')
    process.exit(1)
}

const client = axios.create({
    baseURL: 'https://kaspi.kz/shop/api/v2',
    headers: {
        'X-Auth-Token': KASPI_TOKEN,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
    }
})

async function run() {
    console.log('🚀 Probing /statistics/offers...')

    const past = new Date()
    past.setDate(past.getDate() - 30) // Try 30 days
    const now = new Date()

    try {
        const resp = await client.get('/statistics/offers', {
            params: {
                'page[number]': 0,
                'page[size]': 10,
                'filter[offers][date][$ge]': past.getTime(),
                'filter[offers][date][$le]': now.getTime()
            }
        })

        console.log(`Status: ${resp.status}`)
        if (resp.data?.data) {
            console.log(`Count: ${resp.data.data.length}`)
            if (resp.data.data.length > 0) {
                console.log('Sample:', JSON.stringify(resp.data.data[0], null, 2))
            }
        } else {
            console.log('Data:', JSON.stringify(resp.data, null, 2))
        }

    } catch (e: any) {
        console.error(`❌ Failed: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`)
    }
}

run()
