import { z } from 'zod';

export const startCallSchema = z.object({
  recipientId: z.string().min(1),
  type: z.enum(['audio', 'video']),
});

export const endCallSchema = z.object({
  callId: z.string().min(1),
  status: z.enum(['accepted', 'rejected', 'ended', 'missed']),
  duration: z.number().optional(),
});

export type StartCallInput = z.infer<typeof startCallSchema>;
export type EndCallInput = z.infer<typeof endCallSchema>;
