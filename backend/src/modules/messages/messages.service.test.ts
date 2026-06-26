import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Redis
const mockRedis = {
  data: new Map<string, string>(),
  set: vi.fn(async (key: string, value: string) => { mockRedis.data.set(key, value); }),
  get: vi.fn(async (key: string) => mockRedis.data.get(key) ?? null),
  del: vi.fn(async (key: string) => { mockRedis.data.delete(key); }),
  sadd: vi.fn(),
  srem: vi.fn(),
  smembers: vi.fn(async () => []),
};

vi.mock('../config/redis.js', () => ({ redis: mockRedis }));

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test_access_secret_min_16_chars',
    JWT_REFRESH_SECRET: 'test_refresh_secret_min_16_chars',
  },
}));

import { computeConversationId, isParticipant } from '../../utils/conversationId.js';

describe('messages.service conversation authorization', () => {
  const userA = '507f1f77bcf86cd799439011';
  const userB = '507f1f77bcf86cd799439022';
  const userC = '507f1f77bcf86cd799439033';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compute the same conversationId for A→B and B→A', () => {
    const ab = computeConversationId(userA, userB);
    const ba = computeConversationId(userB, userA);
    expect(ab).toBe(ba);
  });

  it('should verify that userA and userB are participants of their conversation', () => {
    const convId = computeConversationId(userA, userB);
    expect(isParticipant(convId, userA, userB)).toBe(true);
    expect(isParticipant(convId, userB, userA)).toBe(true);
  });

  it('should reject userC from A-B conversation', () => {
    const convId = computeConversationId(userA, userB);
    expect(isParticipant(convId, userA, userC)).toBe(false);
    expect(isParticipant(convId, userB, userC)).toBe(false);
  });

  it('should reject a random conversationId', () => {
    const fakeConvId = 'a'.repeat(64);
    expect(isParticipant(fakeConvId, userA, userB)).toBe(false);
  });

  it('should produce different conversationIds for different pairs', () => {
    const ab = computeConversationId(userA, userB);
    const ac = computeConversationId(userA, userC);
    const bc = computeConversationId(userB, userC);
    expect(ab).not.toBe(ac);
    expect(ab).not.toBe(bc);
    expect(ac).not.toBe(bc);
  });
});
