import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorMiddleware } from './error.middleware.js';

function createBodyParserError(body: unknown): SyntaxError & { statusCode: number; body: unknown; type: string } {
  return Object.assign(new SyntaxError('Unexpected token'), {
    statusCode: 400,
    status: 400,
    body,
    type: 'entity.parse.failed',
  });
}

type MockRequest = Request & { rawBody?: string };

function createMocks(path = '/messages/send'): { req: MockRequest; res: Response; next: NextFunction } {
  const req = {
    method: 'POST',
    path,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    rawBody: 'test_data',
  } as unknown as MockRequest;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('errorMiddleware', () => {
  it('should return 400 INVALID_JSON_BODY for body-parser SyntaxError', () => {
    const { req, res, next } = createMocks();
    const err = createBodyParserError('test_data');

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INVALID_JSON_BODY', message: 'Invalid JSON body' },
    });
  });

  it('should log body for body-parser errors on known paths', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { req, res, next } = createMocks('/messages/send');
    req.rawBody = 'malicious payload';
    const err = createBodyParserError('malicious payload');

    errorMiddleware(err, req, res, next);

    expect(warnSpy).toHaveBeenCalledOnce();
    const log = warnSpy.mock.calls[0][0];
    expect(log).toBe('[BodyParser] Invalid JSON body:');
    const meta = warnSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(meta.body).toBe('malicious payload');
    warnSpy.mockRestore();
  });

  it('should not log body for body-parser errors on unknown paths', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { req, res, next } = createMocks('/jeecg-boot/jmreport/show');
    const err = createBodyParserError('sql injection attempt');

    errorMiddleware(err, req, res, next);

    expect(warnSpy).toHaveBeenCalledOnce();
    const meta = warnSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(meta.body).toBeUndefined();
    expect(meta.path).toBe('/jeecg-boot/jmreport/show');
    warnSpy.mockRestore();
  });

  it('should return 400 VALIDATION_ERROR for ZodError', () => {
    const { req, res, next } = createMocks();
    const err = new ZodError([{ path: ['phone'], message: 'Required', code: 'invalid_type', expected: 'string', received: 'undefined' }]);

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    }));
  });

  it('should return 500 INTERNAL_ERROR for unknown errors', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Something went wrong');

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    }));
  });
});
