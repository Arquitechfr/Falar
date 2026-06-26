import { describe, it, expect } from 'vitest';
import { computeConversationId, isParticipant } from '../utils/conversationId.js';

describe('conversationId', () => {
  const idA = '507f1f77bcf86cd799439011';
  const idB = '507f1f77bcf86cd799439022';

  describe('computeConversationId', () => {
    it('should produce a deterministic hex string', () => {
      const convId = computeConversationId(idA, idB);
      expect(convId).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should be the same regardless of argument order (symmetry)', () => {
      const ab = computeConversationId(idA, idB);
      const ba = computeConversationId(idB, idA);
      expect(ab).toBe(ba);
    });

    it('should produce different IDs for different pairs', () => {
      const idC = '507f1f77bcf86cd799439033';
      const ab = computeConversationId(idA, idB);
      const ac = computeConversationId(idA, idC);
      expect(ab).not.toBe(ac);
    });

    it('should produce a consistent ID for the same pair', () => {
      const ab1 = computeConversationId(idA, idB);
      const ab2 = computeConversationId(idA, idB);
      expect(ab1).toBe(ab2);
    });
  });

  describe('isParticipant', () => {
    it('should return true for matching conversation ID', () => {
      const convId = computeConversationId(idA, idB);
      expect(isParticipant(convId, idA, idB)).toBe(true);
    });

    it('should return true regardless of argument order', () => {
      const convId = computeConversationId(idA, idB);
      expect(isParticipant(convId, idB, idA)).toBe(true);
    });

    it('should return false for non-matching conversation ID', () => {
      const idC = '507f1f77bcf86cd799439033';
      const convId = computeConversationId(idA, idB);
      expect(isParticipant(convId, idA, idC)).toBe(false);
    });
  });
});
