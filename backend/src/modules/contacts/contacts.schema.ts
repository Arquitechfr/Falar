import { z } from 'zod';

const e164Regex = /^\+[1-9]\d{1,14}$/;

export const syncContactsSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        phone: z.string().regex(e164Regex, 'Phone must be in E.164 format'),
      }),
    )
    .min(1)
    .max(5000),
});

export type SyncContactsInput = z.infer<typeof syncContactsSchema>;
