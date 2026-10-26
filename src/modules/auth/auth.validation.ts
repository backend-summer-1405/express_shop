import { z } from 'zod';

// ==================== LOGIN SCHEMA ====================

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// ==================== REGISTER INITIATE SCHEMA (STEP 1) ====================

export const registerInitiateSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
  }),
});

// ==================== REGISTER VERIFY SCHEMA (STEP 2) ====================

export const registerVerifySchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'Code must be exactly 6 digits'),
  }),
});


// ==================== FORGOT PASSWORD SCHEMA (STEP 1) ====================

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

// ==================== RESET PASSWORD SCHEMA (STEP 2) ====================

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'Code must be exactly 6 digits'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});
