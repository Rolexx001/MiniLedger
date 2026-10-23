import { UserRepository, userRepository } from '../repositories/user.repository';
import { normalizeIndianPhone } from '../validators/auth.validator';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/errors';

interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

export class AuthService {
  private userRepo: UserRepository;
  private otpStore: Map<string, OtpRecord>;

  constructor(userRepo: UserRepository = userRepository) {
    this.userRepo = userRepo;
    this.otpStore = new Map<string, OtpRecord>();
  }

  async sendOtp(rawPhone: string): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const phone = normalizeIndianPhone(rawPhone);
    const now = Date.now();
    const existing = this.otpStore.get(phone);

    if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      throw new AppError(
        429,
        `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        { retryAfter: waitSeconds }
      );
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    this.otpStore.set(phone, {
      otp: generatedOtp,
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0,
      lastSentAt: now,
    });

    console.log('\n======================================================');
    console.log(' [MiniLedger Mock OTP Service]');
    console.log(` Target Phone: +91 ${phone}`);
    console.log(` Mock OTP:     >>> ${generatedOtp} <<<`);
    console.log(' Valid for:   5 minutes');
    console.log('======================================================\n');

    return {
      success: true,
      message: 'OTP sent successfully. Please check the backend terminal for the 6-digit code.',
      cooldownSeconds: RESEND_COOLDOWN_MS / 1000,
    };
  }

  async verifyOtp(
    rawPhone: string,
    otp: string
  ): Promise<{ token: string; user: { id: string; phone: string; createdAt: Date } }> {
    const phone = normalizeIndianPhone(rawPhone);
    const now = Date.now();
    const record = this.otpStore.get(phone);

    if (!record) {
      throw new AppError(400, 'No OTP requested for this phone number. Please request a new OTP.');
    }

    if (now > record.expiresAt) {
      this.otpStore.delete(phone);
      throw new AppError(400, 'OTP has expired. Please request a new one.');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      this.otpStore.delete(phone);
      throw new AppError(400, 'Maximum attempts exceeded. Please request a new OTP.');
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      const remaining = MAX_ATTEMPTS - record.attempts;
      throw new AppError(400, `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    // OTP verified successfully: consume it
    this.otpStore.delete(phone);

    const user = await this.userRepo.findOrCreate(phone);
    const token = signToken({
      userId: user.id,
      phone: user.phone,
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User profile not found');
    }
    return {
      id: user.id,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  // Testing helpers
  _getOtp(phone: string) {
    return this.otpStore.get(normalizeIndianPhone(phone));
  }

  _setOtp(phone: string, record: OtpRecord) {
    this.otpStore.set(normalizeIndianPhone(phone), record);
  }

  _clearStore() {
    this.otpStore.clear();
  }
}

export const authService = new AuthService();
export default authService;
