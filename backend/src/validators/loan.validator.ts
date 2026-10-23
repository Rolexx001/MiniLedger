import { z } from 'zod';

export const createLoanSchema = z.object({
  body: z.object({
    friendName: z
      .string()
      .trim()
      .min(1, 'Friend name is required')
      .max(100, 'Friend name must be under 100 characters'),
    amount: z
      .union([z.number(), z.string()])
      .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
      }, 'Amount must be a positive number greater than 0')
      .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return num <= 10000000;
      }, 'Amount cannot exceed ₹10,000,000')
      .transform((val) => (typeof val === 'string' ? parseFloat(val) : val)),
    dueDate: z
      .string()
      .min(1, 'Due date is required')
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid due date format'),
  }),
});

export const getLoansQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'REPAID', 'ALL']).optional(),
  }),
});

export const loanIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid loan ID format'),
  }),
});
