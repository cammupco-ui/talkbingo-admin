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
        case 'status_asc': // Draft (false) first
            query = query.order('is_published', { ascending: true });
            break;
        case 'status_desc': // Published (true) first
            query = query.order('is_published', { ascending: false });
            break;
        case 'q_id_desc':
        default:
            query = query.order('q_id', { ascending: false });
            break;
    }

    // Single point of execution
    const { data, error, count } = await query.range(skip, skip + limit - 1);

    if (error) {
        console.error("Failed to fetch questions:", error);
        throw new Error("Failed to fetch questions");
    }

    return {
        questions: (data || []).map(mapRowToQuestion),
        total: count || 0
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
    const { q_id, type, code_names, content, is_published, ...props } = data;

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
        is_published: !!is_published,
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

export async function toggleQuestionStatus(q_id: string, currentStatus: boolean): Promise<void> {
    const { error } = await supabase
        .from('questions')
        .update({
            is_published: !currentStatus,
            updated_at: new Date().toISOString()
        })
        .eq('q_id', q_id);

    if (error) {
        console.error("Failed to toggle question status:", error);
        throw new Error("Failed to toggle question status");
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
        updated_at: row.updated_at,
        is_published: !!row.is_published,
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

export interface DetailedRelationStat {
    subValue: string;
    label: string;
    relationLabel: string;
    levelCounts: Record<string, number>; // L1: count, L2: count, ...
    total: number;
}

export async function getDetailedStats(): Promise<DetailedRelationStat[]> {
    // Fetch all questions with their code_names
    const { data, error } = await supabase
        .from('questions')
        .select('code_names');

    if (error) {
        console.error("Failed to fetch detailed stats:", error);
        return [];
    }

    const statsMap: Record<string, DetailedRelationStat> = {};

    // Initialize map with all possible sub-relations
    Object.entries(RELATION_MAP).forEach(([relKey, relDef]) => {
        relDef.subs.forEach(sub => {
            statsMap[sub.value] = {
                subValue: sub.value,
                label: sub.label,
                relationLabel: relDef.label,
                levelCounts: {
                    'L1': 0,
                    'L2': 0,
                    'L3': 0,
                    'L4': 0,
                    'L5': 0
                },
                total: 0
            };
        });
    });

    // Aggregate
    (data || []).forEach(row => {
        const codes = row.code_names || [];
        // A question can belong to multiple codes. 
        // We count it once per (sub-relation, level) pair it belongs to.
        // Actually, if a question has both M-M-B-Ar-L1 and F-F-B-Ar-L1, it's the same (Ar, L1).
        // Let's unique the pairs for this question.
        const seenPairs = new Set<string>();

        codes.forEach((code: string) => {
            const parts = code.split('-');
            if (parts.length >= 4) {
                // Format: G-G-Rel-Sub-Level
                // Wait, some codes might be G-G-Rel-Sub-Level (5 parts)
                // Example: M-M-B-Ar-L1 (5 parts)
                const rel = parts[2];
                const sub = parts[parts.length - 2];
                const level = parts[parts.length - 1];

                const pairKey = `${sub}-${level}`;
                if (!seenPairs.has(pairKey)) {
                    if (statsMap[sub]) {
                        statsMap[sub].levelCounts[level] = (statsMap[sub].levelCounts[level] || 0) + 1;
                        statsMap[sub].total++;
                        seenPairs.add(pairKey);
                    }
                }
            }
        });
    });

    return Object.values(statsMap).filter(s => s.total > 0 || true); // Maybe keep 0s for chart consistency
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

        const tryPNU = () => {
            console.log("DAUM failed, trying PNU fallback...");
            results = []; // Clear any partial results
            hanspell.spellCheckByPNU(text, 6000,
                onResult,
                () => resolve(results),
                (err: any) => {
                    console.error("PNU Spell check error:", err);
                    resolve([]); // Both failed
                }
            );
        };

        // Try DAUM first
        hanspell.spellCheckByDAUM(text, 6000,
            onResult,
            () => resolve(results),
            (err: any) => {
                console.error("DAUM Spell check error:", err);
                tryPNU(); // Fallback to PNU
            }
        );
    });
}
