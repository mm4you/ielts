import { ReviewRating } from '@/types';

export const MASTERY_INTERVAL_DAYS = 21;
// Old reviewed rows can have repetition_count=0 after forgetting, but interval=1.
export const studiedProgressWhere = { OR: [{ interval_days: { gt: 0 } }, { repetition_count: { gt: 0 } }] };
export function dueProgressWhere(userId: string, now = new Date()) {
  return { userId, next_review_date: { lte: now }, ...studiedProgressWhere };
}

export function calculateSRS(
  rating: ReviewRating,
  currentEaseFactor: number,
  currentInterval: number,
  repetitionCount: number
): {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
} {
  let ease_factor = currentEaseFactor;
  let interval_days = currentInterval;
  let repetition_count = repetitionCount;

  switch (rating) {
    case 'forgot':
      repetition_count = 0;
      interval_days = 1;
      break;
    case 'hard':
      if (repetition_count === 0) {
        interval_days = 1;
      } else {
        interval_days = Math.max(1, Math.round(interval_days * 1.2));
      }
      ease_factor = Math.max(1.3, ease_factor - 0.15);
      repetition_count += 1;
      break;
    case 'good':
      if (repetition_count === 0) {
        interval_days = 1;
      } else if (repetition_count === 1) {
        interval_days = 3;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetition_count += 1;
      break;
    case 'easy':
      if (repetition_count === 0) {
        interval_days = 2;
      } else {
        interval_days = Math.round(interval_days * ease_factor * 1.3);
      }
      ease_factor = Math.min(3.0, ease_factor + 0.15);
      repetition_count += 1;
      break;
  }

  return {
    ease_factor,
    interval_days,
    repetition_count,
  };
}

export function getReviewStatus(
  repetition_count: number,
  interval_days: number
): 'new' | 'learning' | 'known' {
  if (repetition_count === 0 && interval_days === 0) return 'new';
  if (interval_days >= MASTERY_INTERVAL_DAYS) return 'known';
  return 'learning';
}
