import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import authService from '../src/services/auth.service';

describe('Authentication & Mock OTP Test Suite', () => {
  const testPhone = '9876543210';

  beforeAll(async () => {
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});
    authService._clearStore();
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('should reject invalid Indian phone numbers', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should send mock OTP for valid 10-digit Indian mobile number', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('OTP sent successfully');
    expect(res.body.otp).toBeUndefined(); // Never expose OTP in response

    const stored = authService._getOtp(testPhone);
    expect(stored).toBeDefined();
    expect(stored?.otp).toHaveLength(6);
  });

  it('should enforce 30-second resend cooldown', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too Many Requests');
  });

  it('should reject incorrect OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid OTP');
  });

  it('should reject expired OTP', async () => {
    authService._setOtp(testPhone, {
      otp: '654321',
      expiresAt: Date.now() - 1000, // expired
      attempts: 0,
      lastSentAt: Date.now() - 60000,
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: '654321' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('expired');
  });

  it('should successfully verify valid OTP, consume it, and return a JWT', async () => {
    authService._setOtp(testPhone, {
      otp: '123456',
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      lastSentAt: Date.now() - 35000,
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.phone).toBe(testPhone);

    // Stored OTP must be consumed
    expect(authService._getOtp(testPhone)).toBeUndefined();

    // Verify /api/auth/me works with returned token
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.phone).toBe(testPhone);
  });

  it('should reject unauthenticated access to /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
