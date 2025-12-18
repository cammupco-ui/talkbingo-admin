'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/app/types';
import { saveQuestion, getNextQuestionId, checkSpelling } from '@/app/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CodeNameGenerator from './CodeNameGenerator';
import SpellCheckInput from './SpellCheckInput';

interface QuestionFormProps {
    initialQuestion: Question | null;
    isNew: boolean;
}

export default function QuestionForm({ initialQuestion, isNew }: QuestionFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [type, setType] = useState<'B' | 'T' | 'M'>(initialQuestion?.type || 'T');
    const [qId, setQId] = useState(initialQuestion?.q_id || '');
    const [loadingId, setLoadingId] = useState(false);

    // Form Fields State (Controlled for Spell Check)
    const [content, setContent] = useState(initialQuestion?.content || '');
    const [choiceA, setChoiceA] = useState((initialQuestion as any)?.choice_a || '');
    const [choiceB, setChoiceB] = useState((initialQuestion as any)?.choice_b || '');
    const [answers, setAnswers] = useState((initialQuestion as any)?.answers || '');
    const [keyword, setKeyword] = useState((initialQuestion as any)?.keyword?.join(', ') || '');
    const [gameCode, setGameCode] = useState((initialQuestion as any)?.game_code || '');

    // Manage CodeName text state to allow appending
    const [codeNamesText, setCodeNamesText] = useState((initialQuestion?.code_names || []).join('\n'));

    // Initial load for new question: fetch next ID for default type (T)
    useEffect(() => {
        if (isNew && !qId) {
            handleTypeChange('T');
        }
    }, [isNew, qId]);

    async function handleTypeChange(newType: 'B' | 'T' | 'M') {
        setType(newType);
        if (isNew) {
            setLoadingId(true);
            try {
                const nextId = await getNextQuestionId(newType);
                setQId(nextId);
            } catch (error) {
                console.error("Failed to get next ID:", error);
            } finally {
                setLoadingId(false);
            }
        }
    }

    const handleGeneratedCodes = (newCodes: string[]) => {
        const current = codeNamesText.trim();
        const appended = current ? `${current}\n${newCodes.join('\n')}` : newCodes.join('\n');
        setCodeNamesText(appended);
    };

    async function handleSubmit(formData: FormData) {
        // We override code_names in formData with our state
        const codes = codeNamesText.split('\n').map((s: string) => s.trim()).filter(Boolean);

        await saveQuestion({
            q_id: qId,
            type: type,
            content: content,
            ui_theme: (formData.get('ui_theme') as string) || '',
            code_names: codes,
            choice_a: choiceA,
            choice_b: choiceB,
            answers: answers,
            keyword: keyword.split(',').map((s: string) => s.trim()).filter(Boolean),
            game_code: gameCode,
            config: (formData.get('config') as string) || '',
        } as any);

        const params = new URLSearchParams(searchParams.toString());

        // Always enforce the type parameter to match the actual saved question type
        // This ensures that if the user created a 'Truth' question while in 'Balance' context,
        // they are redirected to the 'Truth' panel to see their new question.
        params.set('type', type);

        // Smart Redirect Logic:
        // If we have a 'page' param, it means the user came from a specific page in the list.
        // We preserve that state (already done by copying searchParams).
        // BUT, if we do NOT have a 'page' param (e.g., came from Dashboard or direct link),
        // we should default to sorting by 'updated_desc' so the user sees their just-edited question at the top.
        if (!params.has('page') && !params.has('sort')) {
            params.set('sort', 'updated_desc');
        }

        router.push(`/questions?${params.toString()}`);
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{isNew ? 'Create_TBM' : 'Edit Question'}</h1>
                <Link href="/questions" className="text-gray-600 hover:text-gray-900">Cancel</Link>
            </div>

            <form action={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                {/* ... (ID and Type fields) ... */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question ID (Order)</label>
                        <input
                            name="q_id"
                            value={qId}
                            readOnly
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 h-10 shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        {loadingId && <span className="text-xs text-blue-500">Generating ID...</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            name="type"
                            value={type}
                            onChange={(e) => handleTypeChange(e.target.value as any)}
                            disabled={!isNew}
                            className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 h-10 shadow-sm 
                                ${!isNew ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                        >
                            <option value="T">Truth</option>
                            <option value="B">Balance</option>
                            <option value="M">MiniGame</option>
                        </select>
                    </div>
                </div>

                <div>
                    <SpellCheckInput
                        label="Content"
                        value={content}
                        onChange={setContent}
                        required
                        multiline
                        rows={3}
                    />
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Type Specific Properties</h3>
                    {/* Render fields conditionally based on CURRENT type state */}

                    {type === 'B' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <SpellCheckInput
                                        label="Choice A"
                                        labelClassName="block text-xs font-medium text-gray-500"
                                        value={choiceA}
                                        onChange={setChoiceA}
                                    />
                                </div>
                                <div>
                                    <SpellCheckInput
                                        label="Choice B"
                                        labelClassName="block text-xs font-medium text-gray-500"
                                        value={choiceB}
                                        onChange={setChoiceB}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'T' && (
                        <div className="space-y-4">
                            <div>
                                <SpellCheckInput
                                    label="Answers"
                                    labelClassName="block text-xs font-medium text-gray-500"
                                    value={answers}
                                    onChange={setAnswers}
                                    placeholder="Comma separated answers"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Keywords</label>
                                <input
                                    name="keyword"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Comma separated"
                                />
                            </div>
                        </div>
                    )}

                    {type === 'M' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Game Code</label>
                                <input
                                    name="game_code"
                                    value={gameCode}
                                    onChange={(e) => setGameCode(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">Targeting (CodeNames)</h3>
                    <p className="text-xs text-gray-500 mb-2">Enter one CodeName per line. Format: [MP]-[CP]-[IR]-[SubRel]-[Intimacy]</p>
                    <textarea
                        name="code_names"
                        value={codeNamesText}
                        onChange={(e) => setCodeNamesText(e.target.value)}
                        rows={5}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <CodeNameGenerator
                        initialCodes={initialQuestion?.code_names || []}
                        onCodeChange={(newCodes) => setCodeNamesText(newCodes.join('\n'))}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
                        Save Question
                    </button>
                </div>
            </form>
        </div>
    );
}
