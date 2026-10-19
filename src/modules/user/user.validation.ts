import { z } from 'zod';

// ==================== UPDATE PROFILE SCHEMA ====================

export const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  }),
});
