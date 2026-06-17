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
  'Gre', 'Sat', 'Gmat', 'Idioms', 'Phrasal verbs', 'Slang', 'Colloquial', 
  'Sports', 'Entertainment', 'Travel', 'Food', 'Cooking', 'Fashion',
  'Fitness', 'Hobby', 'Gaming', 'Internet', 'Marketing', 'Finance', 'Real estate',
  'Astronomy', 'Geology', 'Meteorology', 'Anthropology', 'Archaeology'
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
  Gre: 'Từ vựng GRE',
  Sat: 'Từ vựng SAT',
  Gmat: 'Từ vựng GMAT',
  Idioms: 'Thành ngữ (Idioms)',
  'Phrasal verbs': 'Cụm động từ',
  Slang: 'Từ lóng (Slang)',
  Colloquial: 'Khẩu ngữ (Giao tiếp)',
  Sports: 'Thể thao',
  Entertainment: 'Giải trí',
  Travel: 'Du lịch',
  Food: 'Đồ ăn',
  Cooking: 'Nấu ăn',
  Fashion: 'Thời trang',
  Fitness: 'Thể thao & Thể hình',
  Hobby: 'Sở thích',
  Gaming: 'Trò chơi (Gaming)',
  Internet: 'Internet',
  Marketing: 'Marketing',
  Finance: 'Tài chính',
  'Real estate': 'Bất động sản',
  Astronomy: 'Thiên văn học',
  Geology: 'Địa chất học',
  Meteorology: 'Khí tượng học',
  Anthropology: 'Nhân chủng học',
  Archaeology: 'Khảo cổ học'
};

export const RATING_LABELS: Record<ReviewRating, string> = {
  forgot: 'Quên',
  hard: 'Khó',
  good: 'Tốt',
  easy: 'Dễ',
};