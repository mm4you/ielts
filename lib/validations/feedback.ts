import { z } from 'zod';

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'vocab', 'other']).default('other'),
  message: z.string().trim().min(1, 'Nội dung góp ý không được để trống').max(2000, 'Nội dung góp ý tối đa 2000 ký tự'),
  contact: z.string().trim().max(300, 'Thông tin liên hệ tối đa 300 ký tự').optional().nullable(),
});
