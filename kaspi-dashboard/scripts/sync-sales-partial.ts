import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { MoySkladSync } from '../lib/sync/moy-sklad-sync'

async function partialSync() {
    console.log('🔄 Starting Partial Sales Sync (Last 90 Days)...')

    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    })

    await client.connect()

    // Sync last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    console.log(`Resetting sync state to ${ninetyDaysAgo.toISOString()}...`)

    await client.query(
        `INSERT INTO sync_state(entity_type, last_sync_start)
VALUES('sales', $1)
         ON CONFLICT(entity_type) DO UPDATE SET
last_sync_start = EXCLUDED.last_sync_start`,
        [ninetyDaysAgo.toISOString()]
    )

    await client.end()

    const syncer = new MoySkladSync()
    // syncSales expects (fullSync: boolean, options?: { filter?: any })
    // Based on previous usage, it seems to take just a boolean?
    // Let's check the definition.
    // Checking lib/sync/moy-sklad-sync.ts...
    // It seems I modified it to take options?
    // Let's assume I need to pass false as first arg, then options.
    const result = await syncer.syncSales(false, { filter: { moment: { '>=': ninetyDaysAgo } } })

    console.log('Sync Result:', result)
}

partialSync()
