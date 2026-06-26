import { createHash } from 'node:crypto';

export function computeConversationId(userIdA: string, userIdB: string): string {
  const sorted = [userIdA, userIdB].sort();
  return createHash('sha256').update(sorted.join(':')).digest('hex');
}

export function isParticipant(conversationId: string, userIdA: string, userIdB: string): boolean {
  return computeConversationId(userIdA, userIdB) === conversationId;
}
