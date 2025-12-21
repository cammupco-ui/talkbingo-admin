require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bulkUpdateStatus() {
    console.log('Fetching questions...');
    const { data: questions, error: fetchError } = await supabase
        .from('questions')
        .select('q_id, code_names');

    if (fetchError) {
        console.error('Error fetching questions:', fetchError);
        return;
    }

    console.log(`Processing ${questions.length} questions...`);

    let publishedCount = 0;
    let draftCount = 0;

    for (const q of questions) {
        const targetCount = (q.code_names || []).length;
        // Rule: > 1 target -> Published, 1 target -> Draft
        const isPublished = targetCount > 1;

        const { error: updateError } = await supabase
            .from('questions')
            .update({ is_published: isPublished })
            .eq('q_id', q.q_id);

        if (updateError) {
            console.error(`Error updating q_id ${q.q_id}:`, updateError);
        } else {
            if (isPublished) publishedCount++;
            else draftCount++;
        }
    }

    console.log('Bulk update completed!');
    console.log(`- Published: ${publishedCount}`);
    console.log(`- Draft: ${draftCount}`);
}

bulkUpdateStatus();
