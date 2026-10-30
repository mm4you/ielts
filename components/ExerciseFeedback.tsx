import { MessageBar } from '@fluentui/react-components';
import { spellingDifference, type ExerciseResult } from '@/lib/exercises';

export default function ExerciseFeedback({result}:{result:ExerciseResult}) {
  const diff=result.typo?spellingDifference(result.typo,result.correctAnswer):null;
  return <div className="exercise-feedback">
    <MessageBar intent={result.outcome==='correct'?'success':result.outcome==='review'?'info':'warning'}>
      {result.outcome==='correct'?'Đúng rồi.':result.outcome==='review'?'Cách điền này cần được xem lại, chưa tính là sai.':'Thử nhớ cách viết và cách dùng bên dưới nhé.'}
    </MessageBar>
    {diff&&<p className="spelling-difference"><del>{result.typo}</del><span aria-hidden="true"> → </span><span aria-label={'Viết đúng: '+result.correctAnswer}>{diff.prefix}<mark>{diff.added}</mark>{diff.suffix}</span></p>}
    <p className="exercise-completed"><strong>{result.completedText}</strong></p>
    <p>{result.meaningVi}</p>
    <p>{result.explanation}</p>
    {result.outcome==='review'&&<p>Đáp án của bạn chưa có trong danh sách đã kiểm tra. Câu trả lời đã được giữ lại để đối chiếu; điểm và số câu sai không tăng.</p>}
    <blockquote><p>{result.exampleEn}</p><p lang="vi">{result.exampleVi}</p></blockquote>
  </div>;
}
