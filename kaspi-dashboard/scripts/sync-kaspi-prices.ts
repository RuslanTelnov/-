
import dotenv from 'dotenv'

// Load env vars
dotenv.config({ path: '.env.local' })

const FEED_URL = 'https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml'

async function run() {
    console.log('🚀 Running Kaspi Sync...')
    try {
        // Dynamic import to ensure env vars are loaded first
        const { syncKaspiXmlFeed } = await import('../lib/kaspi/xml-feed')
        const result = await syncKaspiXmlFeed(FEED_URL)
        console.log('🏁 Sync Result:', result)
    } catch (error) {
        console.error('❌ Sync Failed:', error)
    }
}

run()
