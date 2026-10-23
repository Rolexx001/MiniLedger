import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { sendOtpSchema, verifyOtpSchema } from '../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/send-otp', validateRequest(sendOtpSchema), authController.sendOtp);
authRouter.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOtp);
authRouter.get('/me', requireAuth, authController.getMe);

export default authRouter;
