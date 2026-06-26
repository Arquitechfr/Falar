import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use vi.hoisted to create the mock before vi.mock calls (hoisting requirement)
const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    data: new Map<string, string>(),
    set: vi.fn(async (key: string, value: string) => { mockRedis.data.set(key, value); }),
    get: vi.fn(async (key: string) => mockRedis.data.get(key) ?? null),
    del: vi.fn(async (key: string) => { mockRedis.data.delete(key); }),
    exists: vi.fn(async (key: string) => (mockRedis.data.has(key) ? 1 : 0)),
  },
}));

vi.mock('../config/redis.js', () => ({ redis: mockRedis }));

vi.mock('../config/env.js', () => ({
  env: {
    SMS_GATEWAY_ENABLED: false,
    SMS_GATEWAY_URL: 'http://localhost:8080',
    SMS_GATEWAY_LOGIN: 'test',
    SMS_GATEWAY_PASSWORD: 'test',
    SMS_GATEWAY_DEVICE_ID: 'test',
    JWT_ACCESS_SECRET: 'test_access_secret_min_16_chars',
    JWT_REFRESH_SECRET: 'test_refresh_secret_min_16_chars',
  },
}));

import { generateOTP, storeOTP, getOTP, verifyOTP, deleteOTP, checkOTPRateLimit } from '../utils/otp.js';

describe('OTP Utils', () => {
  beforeEach(() => {
    mockRedis.data.clear();
    vi.clearAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit code', () => {
      const code = generateOTP();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate different codes on successive calls', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateOTP());
      }
      // Extremely unlikely all 100 are identical
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('storeOTP and getOTP', () => {
    it('should store and retrieve an OTP', async () => {
      await storeOTP('+33612345678', '123456');
      const stored = await getOTP('+33612345678');
      expect(stored).toBe('123456');
    });

    it('should return null for non-existent OTP', async () => {
      const stored = await getOTP('+33699999999');
      expect(stored).toBeNull();
    });
  });

  describe('verifyOTP', () => {
    it('should return true for correct code', async () => {
      await storeOTP('+33612345678', '654321');
      const result = await verifyOTP('+33612345678', '654321');
      expect(result).toBe(true);
    });

    it('should return false for incorrect code', async () => {
      await storeOTP('+33612345678', '654321');
      const result = await verifyOTP('+33612345678', '000000');
      expect(result).toBe(false);
    });

    it('should return false for non-existent phone', async () => {
      const result = await verifyOTP('+33699999999', '123456');
      expect(result).toBe(false);
    });

    it('should delete OTP after successful verification (anti-replay)', async () => {
      await storeOTP('+33612345678', '654321');
      await verifyOTP('+33612345678', '654321');
      const secondAttempt = await verifyOTP('+33612345678', '654321');
      expect(secondAttempt).toBe(false);
    });

    it('should not delete OTP after failed verification', async () => {
      await storeOTP('+33612345678', '654321');
      await verifyOTP('+33612345678', '000000');
      const stored = await getOTP('+33612345678');
      expect(stored).toBe('654321');
    });
  });

  describe('checkOTPRateLimit', () => {
    it('should allow first request', async () => {
      const allowed = await checkOTPRateLimit('+33612345678');
      expect(allowed).toBe(true);
    });

    it('should block second request within TTL', async () => {
      await checkOTPRateLimit('+33612345678');
      const allowed = await checkOTPRateLimit('+33612345678');
      expect(allowed).toBe(false);
    });

    it('should allow different phones independently', async () => {
      await checkOTPRateLimit('+33612345678');
      const allowed = await checkOTPRateLimit('+33687654321');
      expect(allowed).toBe(true);
    });
  });

  describe('deleteOTP', () => {
    it('should delete stored OTP', async () => {
      await storeOTP('+33612345678', '123456');
      await deleteOTP('+33612345678');
      const stored = await getOTP('+33612345678');
      expect(stored).toBeNull();
    });
  });
});
