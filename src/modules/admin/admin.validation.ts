import { z } from 'zod';

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(['USER', 'TEACHER'], {
      message: 'Role must be either USER or TEACHER',
    }),
  }),
});
