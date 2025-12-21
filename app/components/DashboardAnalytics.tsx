'use client';

import { useState, useEffect } from 'react';
import StatsChart from './StatsChart';
import { DetailedRelationStat, getQuestions } from '@/app/actions';
import { Question } from '@/app/types';
import Link from 'next/link';
import { X, Eye, EyeOff, Trash2, CheckSquare, Square, RefreshCcw } from 'lucide-react';

interface DashboardAnalyticsProps {
    initialStats: DetailedRelationStat[];
    children?: React.ReactNode;
}

export default function DashboardAnalytics({ initialStats, children }: DashboardAnalyticsProps) {
    const [selectedSub, setSelectedSub] = useState<string | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);

    // Local Hiding Feature States
    const [hiddenIds, setHiddenIds] = useState<string[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewHidden, setViewHidden] = useState(false);

    // Load hidden IDs from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('talkbingo_admin_hidden_questions');
        if (saved) {
            try {
                setHiddenIds(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse hidden IDs", e);
            }
        }
    }, []);

    // Save hidden IDs to localStorage
    const saveHiddenIds = (ids: string[]) => {
        setHiddenIds(ids);
        localStorage.setItem('talkbingo_admin_hidden_questions', JSON.stringify(ids));
    };

    useEffect(() => {
        if (selectedSub) {
            fetchQuestions(selectedSub, selectedLevel);
        }
    }, [selectedSub, selectedLevel]);

    const fetchQuestions = async (sub: string, level: string | null) => {
        setLoading(true);
        try {
            const result = await getQuestions({
                codeFilters: { sub, ...(level ? { level } : {}) },
                limit: 50
            });
            setQuestions(result.questions);
        } catch (error) {
            console.error("Failed to fetch questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBarClick = (sub: string, level?: string) => {
        setSelectedSub(sub);
        setSelectedLevel(level || null);
        setSelectedIds([]); // Clear selection on new filter
        // Scroll to result frame
        setTimeout(() => {
            document.getElementById('stats-results-frame')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleHideSelected = () => {
        const newHidden = Array.from(new Set([...hiddenIds, ...selectedIds]));
        saveHiddenIds(newHidden);
        setSelectedIds([]);
    };

    const handleUnhideSelected = () => {
        const newHidden = hiddenIds.filter(id => !selectedIds.includes(id));
        saveHiddenIds(newHidden);
        setSelectedIds([]);
    };

    // Filter questions based on hidden state
    const displayedQuestions = questions.filter(q =>
        viewHidden ? hiddenIds.includes(q.q_id) : !hiddenIds.includes(q.q_id)
    );

    return (
        <div className="space-y-8">
            <StatsChart data={initialStats} onBarClick={handleBarClick} />

            {/* Children (Recent Activity) */}
            {children}

            {/* Results Frame (Inline) */}
            <div id="stats-results-frame" className="scroll-mt-6">
                {selectedSub && (
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            {initialStats.find(s => s.subValue === selectedSub)?.label || selectedSub} 질문 리스트
                                            <span className={`${viewHidden ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} text-xs font-bold px-2 py-0.5 rounded-full`}>
                                                {displayedQuestions.length} {viewHidden && '(숨김)'}
                                            </span>
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {viewHidden ? '현재 숨겨진 질문 목록입니다.' : '해당 관계의 레벨별 질문을 확인하세요.'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setViewHidden(!viewHidden);
                                                setSelectedIds([]);
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewHidden
                                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                }`}
                                        >
                                            {viewHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            {viewHidden ? 'Active Questions' : 'Go Hidden'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedSub(null)}
                                            className="text-sm font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1"
                                        >
                                            닫기 <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    {/* Level Selector Tabs */}
                                    <div className="flex flex-wrap gap-1 p-1 bg-gray-100/80 rounded-lg w-fit">
                                        <button
                                            onClick={() => setSelectedLevel(null)}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedLevel === null
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            전체
                                        </button>
                                        {['L1', 'L2', 'L3', 'L4', 'L5'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setSelectedLevel(level)}
                                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedLevel === level
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                Level {level.replace('L', '')}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Batch Actions */}
                                    {selectedIds.length > 0 && (
                                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                            <span className="text-xs font-medium text-gray-500 mr-1">{selectedIds.length}개 선택됨</span>
                                            {viewHidden ? (
                                                <button
                                                    onClick={handleUnhideSelected}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm shadow-green-100"
                                                >
                                                    <RefreshCcw className="w-3.5 h-3.5" />
                                                    다시 리스트에서 보기
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleHideSelected}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-900 transition-all shadow-sm"
                                                >
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                    Hide Selected
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    <p className="text-sm text-gray-500">질문을 불러오는 중...</p>
                                </div>
                            ) : displayedQuestions.length > 0 ? (
                                <div className="space-y-4">
                                    {displayedQuestions.map((q) => (
                                        <div key={q.q_id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0 group">
                                            <div className="flex items-center gap-4 flex-1">
                                                <button
                                                    onClick={() => toggleSelect(q.q_id)}
                                                    className={`shrink-0 transition-colors ${selectedIds.includes(q.q_id) ? 'text-blue-600' : 'text-gray-300 hover:text-gray-400'}`}
                                                >
                                                    {selectedIds.includes(q.q_id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                </button>
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full 
                                                    ${q.type === 'T' ? 'bg-green-100 text-green-700' :
                                                        q.type === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    <span className="font-bold text-sm">{q.type}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium group-hover:text-blue-600 transition-colors ${viewHidden ? 'text-gray-400' : ''}`}>{q.content}</p>
                                                    <p className="text-sm text-gray-500">
                                                        ID: {q.q_id} •
                                                        {selectedLevel ? (
                                                            <span className="text-blue-600/70 font-medium"> Level {selectedLevel.replace('L', '')}</span>
                                                        ) : (
                                                            ` ${q.code_names?.length || 0} 타켓`
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/questions/${q.q_id}`}
                                                className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium hover:bg-gray-50 hover:border-blue-200 transition-all font-semibold shrink-0"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    ))}
                                    {displayedQuestions.length >= 50 && (
                                        <div className="text-center pt-6 border-t mt-4 border-dashed">
                                            <p className="text-sm text-gray-500">최근 50개 질문만 표시됩니다.</p>
                                            <Link href="/questions" className="text-blue-600 text-sm font-medium hover:underline mt-1 inline-block">
                                                전체 질문 목록에서 보기
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <p>{viewHidden ? '숨겨진 질문이 없습니다.' : '해당 관계 및 레벨의 질문이 없습니다.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
