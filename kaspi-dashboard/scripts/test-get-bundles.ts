
require('dotenv').config({ path: '.env.local' })
const { createMoySkladClient } = require('../lib/moy-sklad/client')

async function testGetBundles() {
    const client = createMoySkladClient({
        apiUrl: process.env.MOY_SKLAD_API_URL || 'https://api.moysklad.ru/api/remap/1.2',
        token: process.env.MOY_SKLAD_TOKEN,
    })

    console.log('Fetching bundles...')
    const data = await client.getBundles({ limit: 10 })
    console.log(`Found ${data.rows?.length} bundles.`)

    if (data.rows && data.rows.length > 0) {
        console.log('Sample bundle:', data.rows[0].name, data.rows[0].id)
    }

    // Check specifically for the missing bundle
    const missingId = 'd8a68594-4212-11f0-0a80-107100117900'
    console.log(`Checking for specific bundle ${missingId}...`)
    const specific = await client.client.get(`/entity/bundle/${missingId}`).then(r => r.data).catch(e => console.error(e.message))
    if (specific) {
        console.log('Specific bundle found:', specific.name, specific.id, 'Archived:', specific.archived)
    }
}

testGetBundles()
