'use server';

import { supabase } from '@/lib/supabase';
import { Question, QuestionFilter, BaseQuestion, BalanceQuestion, TruthQuestion, MiniGameQuestion } from '@/app/types';
import { revalidatePath } from 'next/cache';
import { GENDER_PAIRS, RELATION_MAP, INTIMACY_LEVELS } from '@/app/constants';

// Helper to generate all code combinations matching a filter criteria
function generatePossibleCodes(filters: { gender?: string; relation?: string; sub?: string; level?: string }): string[] {
    const pairs = filters.gender ? [filters.gender] : GENDER_PAIRS.map(g => g.value);
    const levels = filters.level ? [filters.level] : INTIMACY_LEVELS;

    let rels: string[] = [];
    if (filters.relation) {
        rels = [filters.relation];
    } else {
        rels = Object.keys(RELATION_MAP);
    }

    const codes: string[] = [];

    // Cartesian product
    pairs.forEach(pair => {
        rels.forEach(rel => {
            const relDef = RELATION_MAP[rel];
            if (!relDef) return;

            let subs = relDef.subs.map(s => s.value);
            if (filters.sub) {
                // If a sub filter is active, only include if it belongs to this relation
                if (subs.includes(filters.sub)) {
                    subs = [filters.sub];
                } else {
                    // Filter sub doesn't belong to this relation, this path is impossible for this relation
                    // But if relation was not specified, we might be iterating other relations
                    // If the user selected a Sub, they usually selected a Relation too (UI enforces it).
                    // If they just selected Sub (if UI allowed), we only keep matches.
                    subs = [];
                }
            }

            subs.forEach(sub => {
                levels.forEach(level => {
                    codes.push(`${pair}-${rel}-${sub}-${level}`);
                });
            });
        });
    });

    return codes;
}


// Note: We need to fix the return type in signature too
export async function getQuestions(filter: QuestionFilter = {}): Promise<{ questions: Question[], total: number }> {
    const { type, search, limit = 50, skip = 0, sort = 'created_desc', codeFilters } = filter;

    let query = supabase
        .from('questions')
        .select('*', { count: 'exact' });

    if (type) {
        query = query.eq('type', type);
    }

    if (search) {
        // Search in content OR q_id (case insensitive)
        query = query.or(`content.ilike.%${search}%,q_id.ilike.%${search}%`);
    }

    if (codeFilters) {
        // Check if any filter is actually active
        if (codeFilters.gender || codeFilters.relation || codeFilters.sub || codeFilters.level) {
            const possibleCodes = generatePossibleCodes(codeFilters);

            // Use overlaps operator (array contains any of these)
            // If possibleCodes is huge, this might be a large query URL, but for <1000 items it's usually OK.
            // If it's empty (impossible combo), we should return no results?
            if (possibleCodes.length > 0) {
                query = query.overlaps('code_names', possibleCodes);
            } else {
                // Impossible filter - return no results
                // We can force empty by impossible ID
                query = query.eq('q_id', 'IMPOSSIBLE');
            }
        }
    }

    // Sort Logic
    switch (sort) {
        case 'created_asc':
            query = query.order('created_at', { ascending: true });
            break;
        case 'created_desc':
            query = query.order('created_at', { ascending: false });
            break;
        case 'updated_asc':
            query = query.order('updated_at', { ascending: true });
            break;
        case 'updated_desc':
            query = query.order('updated_at', { ascending: false });
            break;
        case 'q_id_asc':
            query = query.order('q_id', { ascending: true });
            break;
        case 'q_id_desc':
        default:
            query = query.order('q_id', { ascending: false });
            break;
    }

    const countQuery = await query;
    const total = countQuery.count || 0;

    query = query.range(skip, skip + limit - 1);

    const { data, error } = await query;

    if (error) {
        console.error("Failed to fetch questions:", error);
        throw new Error("Failed to fetch questions");
    }

    return {
        questions: data.map(mapRowToQuestion),
        total: total
    };
}

export async function getQuestionById(q_id: string): Promise<Question | null> {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('q_id', q_id)
        .single();

    if (error || !data) return null;

    return mapRowToQuestion(data);
}

export async function saveQuestion(data: Question): Promise<void> {
    const { q_id, type, code_names, content, ...props } = data;

    // Extract type-specific details
    let details = {};
    if (type === 'B') {
        const b = data as BalanceQuestion;
        details = { choice_a: b.choice_a, choice_b: b.choice_b };
    } else if (type === 'T') {
        const t = data as TruthQuestion;
        details = { answers: t.answers };
    } else if (type === 'M') {
        const m = data as MiniGameQuestion;
        details = { game_code: m.game_code, config: m.config };
    }

    // Clean code_names
    const cleanedCodeNames = (code_names || []).filter(Boolean);

    const payload = {
        q_id,
        type,
        content,
        code_names: cleanedCodeNames,
        details,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('questions')
        .upsert(payload, { onConflict: 'q_id' });

    if (error) {
        console.error("Failed to save question:", error);
        throw new Error("Failed to save question");
    }

    revalidatePath('/questions');
}

// Helper: Map Supabase Row to Question Type
function mapRowToQuestion(row: any): Question {
    const base = {
        elementId: row.id, // Use UUID as elementId
        q_id: row.q_id,
        type: row.type,
        content: row.content,
        code_names: row.code_names || [],
        created_at: row.created_at,
    };

    const details = row.details || {};

    if (row.type === 'B') {
        return {
            ...base,
            choice_a: details.choice_a || '',
            choice_b: details.choice_b || '',
        } as BalanceQuestion;
    } else if (row.type === 'T') {
        return {
            ...base,
            answers: details.answers || '',
        } as TruthQuestion;
    } else if (row.type === 'M') {
        return {
            ...base,
            game_code: details.game_code || '',
            difficulty: details.difficulty || 1,
            config: details.config || '{}',
        } as MiniGameQuestion;
    }

    return base as Question; // Fallback
}


export interface DashboardStats {
    total: number;
    balance: number;
    truth: number;
    miniGame: number;
    newThisWeek: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const [totalRes, balanceRes, truthRes, miniRes, recentRes] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'B'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'T'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('type', 'M'),
        supabase.from('questions').select('*', { count: 'exact', head: true })
            .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
        total: totalRes.count || 0,
        balance: balanceRes.count || 0,
        truth: truthRes.count || 0,
        miniGame: miniRes.count || 0,
        newThisWeek: recentRes.count || 0,
    };
}

export async function getRecentQuestions(limit: number = 5): Promise<Question[]> {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('updated_at', { ascending: false }) // or created_at
        .limit(limit);

    if (error) {
        console.error("Failed to fetch recent questions:", error);
        return [];
    }

    return (data || []).map(mapRowToQuestion);
}

export async function getNextQuestionId(type: 'B' | 'T' | 'M'): Promise<string> {
    // 1. Get the latest ID for this type
    // Format: [Type]25-[Sequence] (e.g., T25-00001)
    // We search for IDs starting with the Type prefix
    const prefix = `${type}25-`;

    const { data, error } = await supabase
        .from('questions')
        .select('q_id')
        .ilike('q_id', `${prefix}%`)
        .order('q_id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Failed to fetch latest ID:", error);
        // Fallback to 00001 if error or manual handling needed
        return `${prefix}00001`;
    }

    if (!data || data.length === 0) {
        return `${prefix}00001`;
    }

    const lastId = data[0].q_id;
    // Extract sequence number
    const parts = lastId.split('-');
    if (parts.length < 2) return `${prefix}00001`;

    const seqStr = parts[1];
    const seqNum = parseInt(seqStr, 10);

    if (isNaN(seqNum)) return `${prefix}00001`;

    // Increment and pad
    const nextSeq = seqNum + 1;
    const nextSeqStr = nextSeq.toString().padStart(5, '0');

    return `${parts[0]}-${nextSeqStr}`;
}

export async function checkSpelling(text: string): Promise<{ token: string, suggestions: string[], info: string, context?: string }[]> {
    // Dynamic import/require to ignore type issues with hanspell if needed
    const hanspell = require('hanspell');

    if (!text.trim()) return [];

    return new Promise((resolve) => {
        let results: { token: string, suggestions: string[], info: string }[] = [];

        const onResult = (data: any) => {
            // data structure from hanspell usually contains multiple error objects
            // We'll normalize it
            if (Array.isArray(data)) {
                const mapped = data.map(item => ({
                    token: item.token,
                    suggestions: item.suggestions,
                    info: item.info,
                    context: item.context
                }));
                results = results.concat(mapped);
            }
        };

        const onEnd = () => {
            resolve(results);
        };

        const onError = (err: any) => {
            console.error("Spell check error:", err);
            resolve([]); // Return empty on error to handle gracefully
        };

        // using DAUM speller as PNU is unreliable
        hanspell.spellCheckByDAUM(text, 6000, onResult, onEnd, onError);
    });
}
