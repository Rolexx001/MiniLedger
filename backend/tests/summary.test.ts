import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import authService from '../src/services/auth.service';

describe('Financial Summary & Overdue Calculations Suite', () => {
  const user1Phone = '9876543210';
  const user2Phone = '9876543211';
  let user1Token: string;
  let user2Token: string;

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

    // Seed Loans for User 1:
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Pending & Overdue -> ₹2000
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ friendName: 'Suresh (Overdue)', amount: 2000, dueDate: pastDate });

    // 2. Pending & Upcoming -> ₹6000
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ friendName: 'Priya (Upcoming)', amount: 6000, dueDate: futureDate });

    // 3. Repaid (originally due in past, but settled -> must NOT be in overdue amount!) -> ₹4500
    const loan3Res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ friendName: 'Vikram (Repaid Past)', amount: 4500, dueDate: pastDate });

    await request(app)
      .patch(`/api/loans/${loan3Res.body.loan.id}/repay`)
      .set('Authorization', `Bearer ${user1Token}`);
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('should calculate summary totals accurately', async () => {
    const res = await request(app)
      .get('/api/loans/summary')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    // Total Lent = 2000 + 6000 + 4500 = 12500.00
    expect(res.body.totalLent).toBe('12500.00');
    // Total Repaid = 4500.00
    expect(res.body.totalRepaid).toBe('4500.00');
    // Outstanding = 2000 + 6000 = 8000.00
    expect(res.body.outstandingAmount).toBe('8000.00');
    // Overdue = 2000.00 (repaid loan 4500 is excluded)
    expect(res.body.overdueAmount).toBe('2000.00');
    // Counts
    expect(res.body.pendingCount).toBe(2);
    expect(res.body.repaidCount).toBe(1);
  });

  it('should sort loans prioritizing pending/overdue before repaid', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.loans).toHaveLength(3);

    // Suresh is pending & overdue
    expect(res.body.loans[0].friendName).toBe('Suresh (Overdue)');
    expect(res.body.loans[0].isOverdue).toBe(true);
    expect(res.body.loans[0].status).toBe('PENDING');

    // Priya is pending upcoming
    expect(res.body.loans[1].friendName).toBe('Priya (Upcoming)');
    expect(res.body.loans[1].isOverdue).toBe(false);
    expect(res.body.loans[1].status).toBe('PENDING');

    // Vikram is repaid
    expect(res.body.loans[2].friendName).toBe('Vikram (Repaid Past)');
    expect(res.body.loans[2].status).toBe('REPAID');
  });

  it('should ensure summary for User 2 is independent and starts at 0', async () => {
    const res = await request(app)
      .get('/api/loans/summary')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalLent).toBe('0.00');
    expect(res.body.totalRepaid).toBe('0.00');
    expect(res.body.outstandingAmount).toBe('0.00');
    expect(res.body.overdueAmount).toBe('0.00');
    expect(res.body.pendingCount).toBe(0);
    expect(res.body.repaidCount).toBe(0);
  });
});
