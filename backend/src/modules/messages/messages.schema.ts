import { z } from 'zod';

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'recipientId is required'),
  encryptedPayload: z.string().min(1, 'encryptedPayload is required'),
  nonce: z.string().min(1, 'nonce is required'),
  mediaUrl: z.string().optional(),
  clientTimestamp: z.string().datetime().or(z.string().min(1)),
});

export const getMessagesSchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const updateStatusSchema = z.object({
  status: z.enum(['delivered', 'read']),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
