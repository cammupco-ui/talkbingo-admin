const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error('.env.local not found');
    process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing fetching questions for Sub: Area/Hometown (Ar)...');

    // Manually generate some codes for "Ar" (Friend -> Area)
    // Relation B (Friend) -> Sub Ar
    const pairs = ['M-M', 'F-F', 'M-F', 'F-M'];
    const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];
    const codes = [];

    pairs.forEach(p => {
        levels.forEach(l => {
            codes.push(`${p}-B-Ar-${l}`);
        });
    });

    console.log(`Generated ${codes.length} possible codes (listing first 5):`, codes.slice(0, 5));

    const { data, error, count } = await supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .overlaps('code_names', codes)
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${count} questions.`);
        if (data && data.length > 0) {
            console.log('First question content:', data[0].content);
            console.log('First question codes:', data[0].code_names);
        } else {
            console.log('No questions found with these codes.');
        }
    }
}

test();
