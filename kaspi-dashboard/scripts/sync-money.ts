
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function syncMoney() {
    console.log('🚀 Starting Money Sync...')
    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync')
    const sync = new MoySkladSync()

    // Sync for last 30 days (default)
    const result = await sync.syncMoneyByAccount()

    console.log('Sync Result:', result)
}

syncMoney()
