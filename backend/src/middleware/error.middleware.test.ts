import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorMiddleware } from './error.middleware.js';

function createMocks() {
  const req = {
    method: 'POST',
    path: '/messages/send',
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    rawBody: 'test_data',
  } as unknown as Request;
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
    const err = Object.assign(new SyntaxError('Unexpected token'), {
      statusCode: 400,
      status: 400,
      body: 'test_data',
      type: 'entity.parse.failed',
    });

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INVALID_JSON_BODY', message: 'Invalid JSON body' },
    });
  });

  it('should return 400 VALIDATION_ERROR for ZodError', () => {
    const { req, res, next } = createMocks();
    const err = new ZodError([{ path: ['phone'], message: 'Required', code: 'invalid_type' }]);

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
