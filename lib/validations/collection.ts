import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Tên bộ sưu tập không được để trống').max(50, 'Tên bộ sưu tập tối đa 50 ký tự'),
  description: z.string().trim().max(150, 'Mô tả tối đa 150 ký tự').optional().nullable(),
  isPublic: z.boolean().default(false),
});

export const updateCollectionSchema = createCollectionSchema.partial();
