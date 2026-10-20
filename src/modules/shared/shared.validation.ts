import { z } from 'zod';

export const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000),
    parentId: z.string().uuid('Parent ID must be a valid UUID').optional(),
  }),
});

export const toggleLikeSchema = z.object({
  body: z.object({
    type: z.enum(['LIKE', 'DISLIKE']),
  }),
});

export const addRatingSchema = z.object({
  body: z.object({
    value: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  }),
});
