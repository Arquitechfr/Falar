import { createHash } from './sha256';

export function computeConversationId(userIdA: string, userIdB: string): string {
  const sorted = [userIdA, userIdB].sort();
  const input = sorted.join(':');
  return createHash(input);
}
