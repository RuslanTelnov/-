require('dotenv').config({ path: '.env.local' })
const { MoySkladSync } = require('../lib/sync/moy-sklad-sync')

async function runBundleSync() {
    const syncManager = new MoySkladSync()
    console.log('Starting bundle sync...')
    try {
        const result = await syncManager.syncBundles(true) // Force full sync
        console.log('Bundle sync result:', result)
    } catch (e: any) {
        console.error('Sync Error:', e)
        if (e.response) {
            console.error('Response Status:', e.response.status)
            const errorData = JSON.stringify(e.response.data, null, 2)
            console.error('Response Data:', errorData)
            require('fs').writeFileSync('bundle_error.log', errorData)
        }
    }
}

runBundleSync()
