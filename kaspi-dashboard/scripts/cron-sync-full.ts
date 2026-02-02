
import { spawn } from 'child_process'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const XML_FEED_URL = process.env.KASPI_XML_FEED_URL || 'https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml'

async function runFullSync() {
    console.log('🚀 Starting Full Kaspi Sync (Hybrid Mode)...')
    const startTime = Date.now()

    // 1. Run XML Sync (Primary source for active items)
    console.log('\n📦 Phase 1: XML Feed Sync')
    try {
        const { syncKaspiXmlFeed } = await import('../lib/kaspi/xml-feed')
        const result = await syncKaspiXmlFeed(XML_FEED_URL)
        if (!result.success) {
            console.error('❌ XML Sync Failed:', result.error)
        }
    } catch (e: any) {
        console.error('❌ XML Sync Exception:', e.message)
    }

    // 2. Run Order History Sync (Secondary source for sold items)
    console.log('\n📜 Phase 2: Order History Sync')
    try {
        await runScript('scripts/sync-kaspi-orders.ts')
    } catch (e: any) {
        console.error('❌ Order Sync Failed:', e.message)
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n🏁 Full Sync Complete in ${duration}s`)
}

function runScript(scriptPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(process.cwd(), scriptPath)
        const proc = spawn('npx', ['tsx', fullPath], {
            stdio: 'inherit',
            shell: true
        })

        proc.on('close', (code) => {
            if (code === 0) resolve()
            else reject(new Error(`Script exited with code ${code}`))
        })

        proc.on('error', (err) => reject(err))
    })
}

runFullSync()
