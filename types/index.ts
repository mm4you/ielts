export interface Word {
  id: number;
  word: string;
  pos: string | null;
  ipa: string | null;
  meaning_vi: string;
  example: string | null;
  synonyms: string | null;
  topic: string;
  level: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewWord extends Word {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_date: Date;
}

export type ReviewRating = 'forgot' | 'hard' | 'good' | 'easy';

export const TOPICS = [
  'Academic',
  'Daily Update',
  'Education',
  'Environment',
  'Technology',
  'Health',
  'Crime',
  'Government',
  'Work',
  'Culture',
  'Globalization',
] as const;

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const POS_TYPES = [
  'Danh từ',
  'Động từ',
  'Tính từ',
  'Trạng từ',
  'Giới từ',
  'Liên từ',
  'Đại từ'
] as const;

export const TOPIC_LABELS: Record<string, string> = {
  Academic: 'Học thuật chung',
  'Daily Update': 'Từ vựng mới (Hằng ngày)',
  Education: 'Giáo dục',
  Environment: 'Môi trường',
  Technology: 'Công nghệ',
  Health: 'Sức khỏe',
  Crime: 'Tội phạm',
  Government: 'Chính phủ',
  Work: 'Công việc',
  Culture: 'Văn hóa',
  Globalization: 'Toàn cầu hóa',
};

export const RATING_LABELS: Record<ReviewRating, string> = {
  forgot: 'Quên',
  hard: 'Khó',
  good: 'Tốt',
  easy: 'Dễ',
};