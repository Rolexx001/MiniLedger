import { Loan, LoanStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateLoanRepoInput {
  userId: string;
  friendName: string;
  amount: Prisma.Decimal;
  dueDate: Date;
}

export class LoanRepository {
  async create(data: CreateLoanRepoInput): Promise<Loan> {
    return prisma.loan.create({
      data: {
        userId: data.userId,
        friendName: data.friendName,
        amount: data.amount,
        dueDate: data.dueDate,
        status: LoanStatus.PENDING,
      },
    });
  }

  async findByUser(userId: string, status?: LoanStatus): Promise<Loan[]> {
    const where: Prisma.LoanWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    return prisma.loan.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  async findById(id: string, userId: string): Promise<Loan | null> {
    return prisma.loan.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async updateStatusToRepaid(id: string, userId: string, repaidAt: Date): Promise<number> {
    const result = await prisma.loan.updateMany({
      where: {
        id,
        userId,
        status: LoanStatus.PENDING,
      },
      data: {
        status: LoanStatus.REPAID,
        repaidAt,
      },
    });
    return result.count;
  }

  async getStatusSummary(userId: string) {
    return prisma.loan.groupBy({
      by: ['status'],
      where: { userId },
      _sum: { amount: true },
      _count: { id: true },
    });
  }

  async getOverdueSummary(userId: string, asOfDate: Date) {
    return prisma.loan.aggregate({
      where: {
        userId,
        status: LoanStatus.PENDING,
        dueDate: { lt: asOfDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });
  }
}

export const loanRepository = new LoanRepository();
export default loanRepository;
