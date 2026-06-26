import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendOtpController, verifyOtpController, refreshController, logoutController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth requests, try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.use(authRateLimiter);

router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOtpController);
router.post('/refresh', refreshController);
router.post('/logout', authMiddleware, logoutController);

export default router;
