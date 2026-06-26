import { z } from 'zod';

const e164Regex = /^\+[1-9]\d{1,14}$/;

export const sendOtpSchema = z.object({
  phone: z.string().regex(e164Regex, 'Phone must be in E.164 format (e.g. +33612345678)'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(e164Regex, 'Phone must be in E.164 format'),
  code: z.string().length(6, 'Code must be 6 digits'),
  publicKey: z.string().min(1, 'publicKey is required'),
  deviceToken: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
