import { z } from 'zod';

// ==================== CREATE CATEGORY SCHEMA ====================
export const createCategorySchema = z.object({
  body: z.object({
    nameFa: z.string().min(2, 'Persian name must be at least 2 characters'),
    nameEn: z.string().min(2, 'English name must be at least 2 characters'),
    isActive: z.boolean().optional(),
  }),
});

// ==================== UPDATE CATEGORY SCHEMA ====================
export const updateCategorySchema = z.object({
  body: z.object({
    nameFa: z.string().min(2).optional(),
    nameEn: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  }),
});
