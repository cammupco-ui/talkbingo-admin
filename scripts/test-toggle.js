require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testToggle() {
    // 1. Get a question
    const { data: questions } = await supabase.from('questions').select('*').limit(1);
    if (!questions || questions.length === 0) {
        console.log("No questions found");
        return;
    }

    const q = questions[0];
    console.log(`Original Status for ${q.q_id}: ${q.is_published}`);

    // 2. Toggle it
    const newStatus = !q.is_published;
    const { error } = await supabase
        .from('questions')
        .update({ is_published: newStatus })
        .eq('q_id', q.q_id);

    if (error) {
        console.error("Update failed:", error);
        return;
    }
    console.log("Update successful");

    // 3. Verify
    const { data: updated } = await supabase.from('questions').select('*').eq('q_id', q.q_id).single();
    console.log(`New Status for ${updated.q_id}: ${updated.is_published}`);

    // 4. Revert
    await supabase.from('questions').update({ is_published: q.is_published }).eq('q_id', q.q_id);
    console.log("Reverted Changes");
}

testToggle();
