import { Loan, LoanStatus, Prisma } from '@prisma/client';
import { LoanRepository, loanRepository } from '../repositories/loan.repository';
import { AppError } from '../utils/errors';

export interface CreateLoanServiceInput {
  friendName: string;
  amount: number;
  dueDate: string;
}

export interface FormattedLoan {
  id: string;
  userId: string;
  friendName: string;
  amount: string;
  dueDate: Date;
  status: LoanStatus;
  repaidAt: Date | null;
  receiptUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
}

export class LoanService {
  private loanRepo: LoanRepository;

  constructor(loanRepo: LoanRepository = loanRepository) {
    this.loanRepo = loanRepo;
  }

  // Pure business rule for overdue calculation
  isOverdue(dueDate: Date, status: LoanStatus): boolean {
    if (status !== LoanStatus.PENDING) return false;
    return new Date(dueDate).getTime() < Date.now();
  }

  // Format Prisma Loan record to uniform API output
  formatLoan(loan: Loan): FormattedLoan {
    const overdue = this.isOverdue(loan.dueDate, loan.status);
    return {
      id: loan.id,
      userId: loan.userId,
      friendName: loan.friendName,
      amount: loan.amount.toFixed(2),
      dueDate: loan.dueDate,
      status: loan.status,
      repaidAt: loan.repaidAt,
      receiptUrl: loan.receiptUrl,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      isOverdue: overdue,
    };
  }

  async createLoan(userId: string, input: CreateLoanServiceInput): Promise<FormattedLoan> {
    const amountDecimal = new Prisma.Decimal(input.amount.toFixed(2));
    const dueDateParsed = new Date(input.dueDate);

    const loan = await this.loanRepo.create({
      userId,
      friendName: input.friendName,
      amount: amountDecimal,
      dueDate: dueDateParsed,
    });

    return this.formatLoan(loan);
  }

  async getLoans(userId: string, statusFilter?: 'PENDING' | 'REPAID' | 'ALL'): Promise<FormattedLoan[]> {
    let repoStatus: LoanStatus | undefined = undefined;
    if (statusFilter === 'PENDING') repoStatus = LoanStatus.PENDING;
    if (statusFilter === 'REPAID') repoStatus = LoanStatus.REPAID;

    const rawLoans = await this.loanRepo.findByUser(userId, repoStatus);
    const formatted = rawLoans.map((l) => this.formatLoan(l));

    // Sort order:
    // 1. Pending & Overdue loans first (earliest due date first)
    // 2. Pending non-overdue loans second (earliest due date first)
    // 3. Repaid loans last (most recently settled first)
    formatted.sort((a, b) => {
      if (a.status === LoanStatus.PENDING && b.status === LoanStatus.REPAID) return -1;
      if (a.status === LoanStatus.REPAID && b.status === LoanStatus.PENDING) return 1;

      if (a.status === LoanStatus.PENDING && b.status === LoanStatus.PENDING) {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      const aTime = a.repaidAt ? new Date(a.repaidAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.repaidAt ? new Date(b.repaidAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return formatted;
  }

  async getLoanById(id: string, userId: string): Promise<FormattedLoan> {
    const loan = await this.loanRepo.findById(id, userId);
    if (!loan) {
      throw new AppError(404, 'Loan record not found or inaccessible');
    }
    return this.formatLoan(loan);
  }

  async repayLoan(id: string, userId: string): Promise<FormattedLoan> {
    const existing = await this.loanRepo.findById(id, userId);

    if (!existing) {
      throw new AppError(404, 'Loan record not found or inaccessible');
    }

    if (existing.status === LoanStatus.REPAID) {
      throw new AppError(409, 'This loan has already been marked as repaid');
    }

    const now = new Date();
    const count = await this.loanRepo.updateStatusToRepaid(id, userId, now);

    if (count === 0) {
      throw new AppError(409, 'Loan repayment already processed or concurrent update detected');
    }

    const updated = await this.loanRepo.findById(id, userId);
    return this.formatLoan(updated!);
  }

  async getSummary(userId: string) {
    const now = new Date();
    const [statusGroups, overdueAggregate] = await Promise.all([
      this.loanRepo.getStatusSummary(userId),
      this.loanRepo.getOverdueSummary(userId, now),
    ]);

    let pendingSum = new Prisma.Decimal(0);
    let repaidSum = new Prisma.Decimal(0);
    let pendingCount = 0;
    let repaidCount = 0;

    for (const group of statusGroups) {
      if (group.status === LoanStatus.PENDING) {
        pendingSum = group._sum.amount || new Prisma.Decimal(0);
        pendingCount = group._count.id;
      } else if (group.status === LoanStatus.REPAID) {
        repaidSum = group._sum.amount || new Prisma.Decimal(0);
        repaidCount = group._count.id;
      }
    }

    const totalLent = pendingSum.add(repaidSum);
    const overdueAmount = overdueAggregate._sum.amount || new Prisma.Decimal(0);

    return {
      totalLent: totalLent.toFixed(2),
      totalRepaid: repaidSum.toFixed(2),
      outstandingAmount: pendingSum.toFixed(2),
      overdueAmount: overdueAmount.toFixed(2),
      pendingCount,
      repaidCount,
      overdueCount: overdueAggregate._count.id,
    };
  }
}

export const loanService = new LoanService();
export default loanService;
