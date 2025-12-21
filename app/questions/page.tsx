import { getQuestions } from '@/app/actions';
import { Question } from '@/app/types';
import Link from 'next/link';
import Pagination from '@/app/components/Pagination';
import { redirect } from 'next/navigation';

import QuestionFilterToolbar from './QuestionFilterToolbar';
import QuestionListTable from './QuestionListTable';

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

    const codeFilters = {
        gender: searchParams.gender,
        relation: searchParams.relation,
        sub: searchParams.sub,
        level: searchParams.level
    };

    const limit = 20;
    const skip = (page - 1) * limit;

    const { questions, total } = await getQuestions({ search, type, limit, skip, sort, codeFilters });

    let pageTitle = 'Questions';
    if (type === 'B') pageTitle = 'Balance Questions';
    if (type === 'T') pageTitle = 'Truth Questions';
    if (type === 'M') pageTitle = 'Mini Game Questions';

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

            <QuestionListTable questions={questions} searchParams={searchParams} />

            <Pagination total={total} limit={limit} currentPage={page} />
        </div>
    );
}
