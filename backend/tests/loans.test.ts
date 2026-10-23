import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import authService from '../src/services/auth.service';

describe('Loan Operations & Isolation Test Suite', () => {
  const user1Phone = '9876543210';
  const user2Phone = '9876543211';
  let user1Token: string;
  let user2Token: string;
  let createdLoanId: string;

  beforeAll(async () => {
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});
    authService._clearStore();

    // Authenticate User 1
    authService._setOtp(user1Phone, {
      otp: '111111',
      expiresAt: Date.now() + 300000,
      attempts: 0,
      lastSentAt: Date.now() - 40000,
    });
    const res1 = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: user1Phone, otp: '111111' });
    user1Token = res1.body.token;

    // Authenticate User 2
    authService._setOtp(user2Phone, {
      otp: '222222',
      expiresAt: Date.now() + 300000,
      attempts: 0,
      lastSentAt: Date.now() - 40000,
    });
    const res2 = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: user2Phone, otp: '222222' });
    user2Token = res2.body.token;
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('should validate loan creation inputs', async () => {
    // Empty friend name
    const res1 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ friendName: '', amount: 500, dueDate: '2026-11-01' });
    expect(res1.status).toBe(400);

    // Negative amount
    const res2 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ friendName: 'Amit', amount: -50, dueDate: '2026-11-01' });
    expect(res2.status).toBe(400);

    // Zero amount
    const res3 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ friendName: 'Amit', amount: 0, dueDate: '2026-11-01' });
    expect(res3.status).toBe(400);

    // Invalid date
    const res4 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ friendName: 'Amit', amount: 1000, dueDate: 'not-a-date' });
    expect(res4.status).toBe(400);
  });

  it('should create a loan for authenticated user', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        friendName: 'Rahul Sharma',
        amount: 2500,
        dueDate: futureDate,
      });

    expect(res.status).toBe(201);
    expect(res.body.loan.friendName).toBe('Rahul Sharma');
    expect(res.body.loan.amount).toBe('2500.00');
    expect(res.body.loan.status).toBe('PENDING');
    expect(res.body.loan.isOverdue).toBe(false);
    createdLoanId = res.body.loan.id;
  });

  it('should retrieve loan by ID for owner', async () => {
    const res = await request(app)
      .get(`/api/loans/${createdLoanId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.loan.id).toBe(createdLoanId);
    expect(res.body.loan.friendName).toBe('Rahul Sharma');
  });

  it('should prevent User 2 from accessing User 1 loan (User Isolation)', async () => {
    const res = await request(app)
      .get(`/api/loans/${createdLoanId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found or inaccessible');
  });

  it('should prevent User 2 from repaying User 1 loan', async () => {
    const res = await request(app)
      .patch(`/api/loans/${createdLoanId}/repay`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
  });

  it('should allow owner to mark loan as repaid', async () => {
    const res = await request(app)
      .patch(`/api/loans/${createdLoanId}/repay`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.loan.status).toBe('REPAID');
    expect(res.body.loan.repaidAt).toBeDefined();
  });

  it('should reject duplicate repayment attempt with conflict', async () => {
    const res = await request(app)
      .patch(`/api/loans/${createdLoanId}/repay`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already.*repaid/i);
  });
});
