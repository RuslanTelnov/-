import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables immediately
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
    console.log('🚀 Starting incremental sync test...');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    if (!process.env.MOY_SKLAD_TOKEN && (!process.env.MOY_SKLAD_USERNAME || !process.env.MOY_SKLAD_PASSWORD)) {
        console.error('❌ Missing MoySklad credentials (need TOKEN or USERNAME+PASSWORD)');
        process.exit(1);
    }

    // Dynamic import to ensure env vars are loaded first
    const { MoySkladSync } = await import('../lib/sync/moy-sklad-sync');
    const sync = new MoySkladSync();

    try {
        console.log('📦 Syncing all entities...');
        const results = await sync.syncAll();
        console.log('✅ Sync completed successfully!');
        console.log('📊 Results:', JSON.stringify(results, null, 2));

        // Verify sync_state
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: syncState, error } = await supabase
            .from('sync_state')
            .select('*');

        if (error) {
            console.error('❌ Error fetching sync state:', error);
        } else {
            console.log('🕒 Sync State:', JSON.stringify(syncState, null, 2));
        }

    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

main();
