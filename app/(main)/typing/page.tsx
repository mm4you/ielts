import type { Metadata } from 'next';
import TypingGame from './TypingGame';
export const metadata: Metadata = { title: 'Chíu chíu luyện gõ — IELTS Vocab', description: 'Gõ đúng từ để bắn mục tiêu và luyện phản xạ bàn phím.' };
export default function TypingPage() { return <TypingGame />; }
