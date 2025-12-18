import { getQuestionById } from '@/app/actions';
import { Question } from '@/app/types';
import QuestionForm from './QuestionForm';

export const dynamic = 'force-dynamic';

export default async function QuestionEditPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const isNew = params.id === 'new';
    let question: Question | null = null;

    if (!isNew) {
        question = await getQuestionById(params.id);
    }
    // We don't construct a default object for new here; 
    // we let the Client Component handle the initial state or pass null.
    // However, existing logic passed a dummy object. Let's pass null for new.

    if (!question && !isNew) {
        return <div>Question not found</div>;
    }

    return <QuestionForm initialQuestion={question} isNew={isNew} />;
}
