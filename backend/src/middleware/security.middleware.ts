import type { Request, Response, NextFunction } from 'express';

export const FORBIDDEN_PATHS = [
  /^\.env/,
  /^\.git/,
  /^\.github/,
  /^\.npmrc/,
  /^\.pnpm/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^tsconfig\.json$/,
  /^ecosystem\.config/,
];

export const ALLOWED_PATHS = [
  '/auth',
  '/users',
  '/messages',
  '/media',
  '/calls',
  '/notifications',
  '/search',
  '/ci',
  '/contacts',
  '/health',
  '/',
];

export function isSensitivePath(path: string): boolean {
  const cleanPath = path.replace(/^\//, '').split('?')[0];
  return FORBIDDEN_PATHS.some((pattern) => pattern.test(cleanPath));
}

export function isKnownPath(path: string): boolean {
  return ALLOWED_PATHS.some((allowed) => path === allowed || path.startsWith(`${allowed}/`));
}

export function forbidSensitiveFilesMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isSensitivePath(req.path)) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Forbidden' },
    });
    return;
  }

  next();
}

export function unknownPathMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isKnownPath(req.path)) {
    next();
    return;
  }

  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Not found' },
  });
}
