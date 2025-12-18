import { getQuestions } from '@/app/actions';
import { Question } from '@/app/types';
import Link from 'next/link';
import Pagination from '@/app/components/Pagination';
import { redirect } from 'next/navigation';

import QuestionFilterToolbar from './QuestionFilterToolbar';

export const dynamic = 'force-dynamic';

export default async function QuestionsPage(props: {
    searchParams: Promise<{
        q?: string;
        type?: string;
        page?: string;
        sort?: any;
        gender?: string;
        relation?: string;
        sub?: string;
        level?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    // Enforce Default Panel (Balance) if no type is present
    if (!searchParams.type) {
        redirect('/questions?type=B');
    }

    const search = searchParams.q;
    const type = searchParams.type as any;
    const page = Number(searchParams.page) || 1;
    const sort = searchParams.sort;

    // Enforce Default Panel (Balance) if no type is present
    if (!type) {
        // We can't use router.push in server component, but we can return a redirect if we wanted strictly server-side
        // Or render a client component that redirects.
        // For simplicity in a Server Component page, we can use the `redirect` function from next/navigation
    }

    const codeFilters = {
        gender: searchParams.gender,
        relation: searchParams.relation,
        sub: searchParams.sub,
        level: searchParams.level
    };

    // ... (dynamic export)

    const limit = 20;
    const skip = (page - 1) * limit;

    const { questions, total } = await getQuestions({ search, type, limit, skip, sort, codeFilters });

    let pageTitle = 'Questions';
    if (type === 'B') pageTitle = 'Balance Questions';
    if (type === 'T') pageTitle = 'Truth Questions';
    if (type === 'M') pageTitle = 'Mini Game Questions';

    // Construct New Question Link with context
    // If we have a type selected, pass it as initial type
    const newQuestionLink = type ? `/questions/new?type=${type}` : '/questions/new';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
                <div className="space-x-2">
                    <Link href={newQuestionLink} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                        New Question
                    </Link>
                </div>
            </div>

            <QuestionFilterToolbar hideTypeSelector={!!type} />

            <div className="rounded-md border bg-white shadow">
                {/* Existing Table Code... */}

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content / Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates (Upload/Create/Edit)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationships</th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">Edit</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {questions.map((q, index) => (
                            <tr key={q.q_id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-top">{q.q_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${q.type === 'T' ? 'bg-green-100 text-green-800' :
                                            q.type === 'B' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'}`}>
                                        {q.type}
                                    </span>
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

                {questions.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No questions found. Check your database connection or filters.
                    </div>
                )}
            </div>

            <Pagination total={total} limit={limit} currentPage={page} />
        </div>
    );
}
