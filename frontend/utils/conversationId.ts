import { createHash } from './sha256';

export async function computeConversationId(userIdA: string, userIdB: string): Promise<string> {
  const sorted = [userIdA, userIdB].sort();
  const input = sorted.join(':');
  return createHash(input);
}
