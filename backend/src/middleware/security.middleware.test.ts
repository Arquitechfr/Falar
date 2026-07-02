import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { isKnownPath, unknownPathMiddleware, isSensitivePath, forbidSensitiveFilesMiddleware } from './security.middleware.js';

function createMocks(path: string) {
  const req = {
    method: 'POST',
    path,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('isKnownPath', () => {
  it.each([
    '/auth/send-otp',
    '/auth/verify-otp',
    '/users/me',
    '/users/search',
    '/messages/send',
    '/messages/conversations',
    '/media/upload',
    '/calls',
    '/notifications',
    '/search',
    '/ci/upload-apk',
    '/contacts',
    '/health',
    '/',
  ])('returns true for known path %s', (path) => {
    expect(isKnownPath(path)).toBe(true);
  });

  it.each([
    '/cdb/cmd/export',
    '/jeecg-boot/jmreport/show',
    '/wp-admin',
    '/admin',
    '/actuator/health',
    '/api/v1/users',
    '/unknown',
  ])('returns false for unknown path %s', (path) => {
    expect(isKnownPath(path)).toBe(false);
  });
});

describe('unknownPathMiddleware', () => {
  it('calls next() for known paths', () => {
    const { req, res, next } = createMocks('/messages/send');
    unknownPathMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown paths', () => {
    const { req, res, next } = createMocks('/cdb/cmd/export');
    unknownPathMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Not found' },
    });
  });
});

describe('isSensitivePath', () => {
  it.each([
    '/.env',
    '/.env.production',
    '/.env.local',
    '/.git/config',
    '/.github/workflows/ci.yml',
    '/package.json',
    '/pnpm-lock.yaml',
    '/ecosystem.config.cjs',
  ])('returns true for sensitive path %s', (path) => {
    expect(isSensitivePath(path)).toBe(true);
  });

  it.each([
    '/auth/send-otp',
    '/health',
    '/',
    '/messages/send',
    '/users/me',
  ])('returns false for safe path %s', (path) => {
    expect(isSensitivePath(path)).toBe(false);
  });
});

describe('forbidSensitiveFilesMiddleware', () => {
  it('returns 403 for sensitive paths', () => {
    const { req, res, next } = createMocks('/.env');
    forbidSensitiveFilesMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: 'Forbidden' },
    });
  });

  it('calls next() for safe paths', () => {
    const { req, res, next } = createMocks('/health');
    forbidSensitiveFilesMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
