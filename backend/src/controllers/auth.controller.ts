import { Request, Response, NextFunction } from 'express';
import { AuthService, authService } from '../services/auth.service';

export class AuthController {
  private service: AuthService;

  constructor(service: AuthService = authService) {
    this.service = service;
  }

  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body;
      const result = await this.service.sendOtp(phone);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, otp } = req.body;
      const result = await this.service.verifyOtp(phone, otp);
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getUserProfile(req.user!.userId);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
export default authController;
