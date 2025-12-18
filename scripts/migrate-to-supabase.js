require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    // 1. Migrate Balance Questions
    const balancePath = path.join(__dirname, '../../BalanceQuizData.csv');
    if (fs.existsSync(balancePath)) {
        console.log(`Processing ${balancePath}...`);
        const content = fs.readFileSync(balancePath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true
        });

        const balanceRows = records.map(record => {
            // Split CodeName by comma and trim whitespace
            const codeNames = (record.CodeName || '').split(',').map(s => s.trim()).filter(Boolean);

            return {
                q_id: record.q_id,
                type: 'B',
                content: record.content,
                // Store choices in details JSON
                details: {
                    choice_a: record.choice_a,
                    choice_b: record.choice_b
                },
                code_names: codeNames,
                created_at: new Date().toISOString()
            };
        }).filter(r => r.q_id && r.content); // Filter out empty or invalid rows

        if (balanceRows.length > 0) {
            const { error } = await supabase.from('questions').upsert(balanceRows, { onConflict: 'q_id' });
            if (error) console.error('Error inserting Balance questions:', error);
            else console.log(`Successfully migrated ${balanceRows.length} Balance questions.`);
        }
    } else {
        console.warn(`File not found: ${balancePath}`);
    }

    // 2. Migrate Truth Questions
    const truthPath = path.join(__dirname, '../../TruthQuizData.csv');
    if (fs.existsSync(truthPath)) {
        console.log(`Processing ${truthPath}...`);
        const content = fs.readFileSync(truthPath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true
        });

        const truthRows = records.map(record => {
            const codeNames = (record.CodeName || '').split(',').map(s => s.trim()).filter(Boolean);

            return {
                q_id: record.q_id,
                type: 'T',
                content: record.content,
                // Store answers in details JSON
                details: {
                    answers: record.answers
                },
                code_names: codeNames,
                created_at: new Date().toISOString()
            };
        }).filter(r => r.q_id && r.content);

        if (truthRows.length > 0) {
            const { error } = await supabase.from('questions').upsert(truthRows, { onConflict: 'q_id' });
            if (error) console.error('Error inserting Truth questions:', error);
            else console.log(`Successfully migrated ${truthRows.length} Truth questions.`);
        }
    } else {
        console.warn(`File not found: ${truthPath}`);
    }
}

migrate();
