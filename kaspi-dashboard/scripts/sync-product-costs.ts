import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables before importing modules that use them
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
    console.log('🚀 Starting product costs sync...')

    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')

    const syncer = new MoySkladSync()
    const result = await syncer.syncProductCosts()

    if (result.success) {
        console.log(`✅ Successfully synced costs for ${result.count} products`)
    } else {
        console.error('❌ Failed to sync product costs:', result.error)
        process.exit(1)
    }
}

main().catch(console.error)
