import { z } from 'zod';

const e164Regex = /^\+[1-9]\d{1,14}$/;

export const updateMeSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
  deviceToken: z.string().min(1).optional(),
});

export const searchUserSchema = z.object({
  phone: z.string().regex(e164Regex, 'Phone must be in E.164 format'),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type SearchUserInput = z.infer<typeof searchUserSchema>;
