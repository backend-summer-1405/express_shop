import { z } from 'zod';

// ==================== CHARGE WALLET SCHEMA ====================

export const chargeWalletSchema = z.object({
  body: z.object({
    amount: z
      .number({ message: 'Amount is required' })
      .int('Amount must be an integer')
      .positive('Amount must be positive')
      .min(1000, 'Minimum charge is 1000'),
    description: z.string().max(500).optional(),
  }),
});
