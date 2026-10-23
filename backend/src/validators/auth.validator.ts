import { z } from 'zod';

export const normalizeIndianPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
};

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .refine((val) => {
        const normalized = normalizeIndianPhone(val);
        return /^[6-9]\d{9}$/.test(normalized);
      }, 'Invalid Indian mobile number. Must be a 10-digit number starting with 6, 7, 8, or 9.'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .refine((val) => {
        const normalized = normalizeIndianPhone(val);
        return /^[6-9]\d{9}$/.test(normalized);
      }, 'Invalid Indian mobile number'),
    otp: z
      .string()
      .trim()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});
