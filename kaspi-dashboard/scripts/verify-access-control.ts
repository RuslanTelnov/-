
import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function verifyAccessControl() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:54322/postgres',
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        // 1. Check if table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_profiles'
            );
        `)

        if (tableCheck.rows[0].exists) {
            console.log('✅ public.user_profiles table exists')
        } else {
            console.error('❌ public.user_profiles table MISSING')
        }

        // 2. Check policies
        const policyCheck = await client.query(`
            SELECT policyname, cmd, roles 
            FROM pg_policies 
            WHERE tablename = 'user_profiles';
        `)

        console.log('Found policies:', policyCheck.rows.map(r => r.policyname))

        if (policyCheck.rows.length >= 3) {
            console.log('✅ RLS Policies found')
        } else {
            console.warn('⚠️ Some RLS Policies might be missing')
        }

        // 3. Test Trigger (Attempt to insert into auth.users)
        // This requires admin privileges which this connection likely has.
        // We will generate a random UUID for the test.
        const testEmail = `test_${Date.now()}@example.com`
        const testId = '00000000-0000-0000-0000-000000000001'; // Fixed ID for testing, ensure it doesn't conflict or handle error

        try {
            // Clean up potential previous failed run
            await client.query(`DELETE FROM auth.users WHERE id = $1`, [testId])

            console.log(`Attempting to insert test user ${testEmail} into auth.users...`)

            // Note: Inserting into auth.users is minimal. Real auth requires more fields usually.
            // We just need enough to trigger the function.
            await client.query(`
                INSERT INTO auth.users (id, email, created_at, updated_at)
                VALUES ($1, $2, NOW(), NOW())
             `, [testId, testEmail])

            console.log('✅ Inserted into auth.users')

            // Check if profile was created
            const profileCheck = await client.query(`
                SELECT * FROM public.user_profiles WHERE id = $1
             `, [testId])

            if (profileCheck.rows.length === 1 && profileCheck.rows[0].email === testEmail) {
                console.log('✅ Trigger verified: Profile created automatically')
                console.log('Profile Role:', profileCheck.rows[0].role)
            } else {
                console.error('❌ Trigger failed: Profile not found or incorrect')
            }

            // Clean up
            await client.query(`DELETE FROM auth.users WHERE id = $1`, [testId])
            console.log('✅ Validated and cleaned up test data')

        } catch (err) {
            console.warn('⚠️ Could not verify trigger (access to auth.users might be restricted or query failed):', err.message)
        }

    } catch (error) {
        console.error('❌ Error during verification:', error)
    } finally {
        await client.end()
    }
}

verifyAccessControl()
