'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/app/types';
import Link from 'next/link';
import { Eye, EyeOff, CheckSquare, Square, RefreshCcw, Loader2 } from 'lucide-react';
import { toggleQuestionStatus } from '@/app/actions';

interface QuestionListTableProps {
    questions: Question[];
    searchParams: any;
}

export default function QuestionListTable({ questions, searchParams }: QuestionListTableProps) {
    // Local Hiding Feature States
    const [hiddenIds, setHiddenIds] = useState<string[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewHidden, setViewHidden] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const router = useRouter(); // Need to import useRouter at top

    async function handleToggleStatus(q_id: string, currentStatus: boolean) {
        setTogglingId(q_id);
        try {
            await toggleQuestionStatus(q_id, currentStatus);
            router.refresh(); // Force refresh to show updated data
        } catch (error) {
            console.error("Failed to toggle status", error);
            alert("상태 변경에 실패했습니다.");
        } finally {
            setTogglingId(null);
        }
    }

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
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        Showing {displayedQuestions.length} {viewHidden ? 'Hidden' : 'Active'} Questions
                    </span>
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
                </div>

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

            <div className="rounded-md border bg-white shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-10 px-6 py-3"></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content / Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates (Upload/Create/Edit)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationships</th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">Edit</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {displayedQuestions.map((q) => (
                            <tr key={q.q_id} className={`hover:bg-gray-50 transition-colors ${viewHidden ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap align-top">
                                    <button
                                        onClick={() => toggleSelect(q.q_id)}
                                        className={`transition-colors ${selectedIds.includes(q.q_id) ? 'text-blue-600' : 'text-gray-300 hover:text-gray-400'}`}
                                    >
                                        {selectedIds.includes(q.q_id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-top">{q.q_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${q.type === 'T' ? 'bg-green-100 text-green-800' :
                                            q.type === 'B' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'}`}>
                                        {q.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                    <button
                                        onClick={() => handleToggleStatus(q.q_id, !!q.is_published)}
                                        disabled={togglingId === q.q_id}
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-all hover:ring-2 hover:ring-offset-1 
                                            ${q.is_published
                                                ? 'bg-green-100 text-green-800 hover:ring-green-200'
                                                : 'bg-gray-100 text-gray-800 hover:ring-gray-200'} 
                                            ${togglingId === q.q_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        title={q.is_published ? 'Click to set as Draft' : 'Click to publish'}
                                    >
                                        {togglingId === q.q_id ? (
                                            <Loader2 className="w-3 h-3 animate-spin mr-1 self-center" />
                                        ) : null}
                                        {q.is_published ? 'Published' : 'Draft'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 align-top">
                                    <div className="font-medium text-gray-900 mb-1">{q.content}</div>
                                    {q.type === 'B' && (
                                        <div className="text-xs text-gray-500 bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="font-bold text-blue-600">A:</span> {(q as any).choice_a} <br />
                                            <span className="font-bold text-red-600">B:</span> {(q as any).choice_b}
                                        </div>
                                    )}
                                    {q.type === 'T' && (q as any).answers && (
                                        <div className="text-xs text-gray-500 bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="font-bold">Answers:</span> {(q as any).answers}
                                        </div>
                                    )}
                                    {q.type === 'M' && (
                                        <div className="text-xs text-gray-500 bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="font-bold">Code:</span> {(q as any).game_code}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 flex flex-col gap-0.5 align-top">
                                    <div><span className="font-semibold w-12 inline-block">Up:</span> {q.created_at ? new Date(q.created_at).toLocaleDateString() : '-'}</div>
                                    <div><span className="font-semibold w-12 inline-block">Cr:</span> {q.created_at ? new Date(q.created_at).toLocaleDateString() : '-'}</div>
                                    <div><span className="font-semibold w-12 inline-block">Ed:</span> {q.updated_at ? new Date(q.updated_at).toLocaleDateString() : '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {q.code_names?.length || 0} Targets
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link
                                        href={`/questions/${q.q_id}?${new URLSearchParams(Object.entries(searchParams).reduce((acc, [k, v]) => ({ ...acc, [k]: v as string }), {})).toString()}`}
                                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(displayedQuestions.length === 0) && (
                    <div className="p-8 text-center text-gray-500">
                        {viewHidden ? '숨겨진 질문이 없습니다.' : '표시할 질문이 없습니다.'}
                    </div>
                )}
            </div>
        </div>
    );
}
