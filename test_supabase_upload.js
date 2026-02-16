
require('dotenv').config({ path: '../moysklad-web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('Testing Supabase connection...');

    // List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }
    console.log('Buckets:', buckets.map(b => b.name));

    const bucketName = 'videos';
    const videoBucket = buckets.find(b => b.name === bucketName);

    if (!videoBucket) {
        console.log(`Bucket '${bucketName}' not found. Attempting to create...`);
        const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true
        });
        if (createError) {
            console.error('Error creating bucket:', createError);
            return;
        }
        console.log(`Bucket '${bucketName}' created.`);
    } else {
        console.log(`Bucket '${bucketName}' exists.`);
    }

    // Test upload
    const testContent = Buffer.from('Test video content');
    const fileName = `test_video_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, testContent, {
            contentType: 'text/plain',
            upsert: true
        });

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

    console.log('Upload successful!');
    console.log('Public URL:', publicUrl);
}

testUpload();
