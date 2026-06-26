import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof Error && 'code' in err) {
    const code = (err as { code: number }).code;
    if (code === 11000) {
      res.status(409).json({
        error: { code: 'DUPLICATE_KEY', message: 'A resource with this value already exists' },
      });
      return;
    }
    res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: 'Database operation failed' },
    });
    return;
  }

  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid' },
    });
    return;
  }

  if (err instanceof Error && err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
    });
    return;
  }

  console.error('[Error] Unhandled:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
