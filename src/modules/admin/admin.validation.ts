import { z } from 'zod';

// ==================== CHANGE ROLE SCHEMA ====================
export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(['USER', 'TEACHER', 'ADMIN'], {
      message: 'Role must be either USER, TEACHER, or ADMIN',
    }),
  }),
});

// ==================== GET USERS QUERY SCHEMA ====================
export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().max(100).optional(),
    role: z.enum(['USER', 'TEACHER', 'ADMIN']).optional(),
    isVerified: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['createdAt', 'name', 'email']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});
