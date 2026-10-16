import { z } from 'zod';

// ==================== CREATE COURSE SCHEMA ====================

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(2000).optional(),
    price: z.number().int().min(0, 'Price must be at least 0'),
  }),
});

// ==================== UPDATE COURSE SCHEMA ====================

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).optional(),
    price: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

// ==================== ADD COMMENT SCHEMA ====================

export const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000),
    parentId: z.string().uuid('Parent ID must be a valid UUID').optional(),
  }),
});

// ==================== TOGGLE LIKE SCHEMA ====================

export const toggleLikeSchema = z.object({
  body: z.object({
    type: z.enum(['LIKE', 'DISLIKE']),
  }),
});

// ==================== ADD RATING SCHEMA ====================

export const addRatingSchema = z.object({
  body: z.object({
    value: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  }),
});

// ==================== APPROVE PURCHASE SCHEMA ====================

export const approvePurchaseSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
  }),
});
