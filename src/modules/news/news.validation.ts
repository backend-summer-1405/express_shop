import { z } from 'zod';

// ==================== CREATE NEWS SCHEMA ====================

export const createNewsSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    image: z.string().url('Image must be a valid URL').optional(),
  }),
});

// ==================== UPDATE NEWS SCHEMA ====================

export const updateNewsSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(10).optional(),
    image: z.string().url().optional(),
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
