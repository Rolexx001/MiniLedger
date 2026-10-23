export type LoanStatus = 'PENDING' | 'REPAID';

export interface User {
  id: string;
  phone: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: string;
  dueDate: string;
  status: LoanStatus;
  repaidAt: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export interface LoanSummary {
  totalLent: string;
  totalRepaid: string;
  outstandingAmount: string;
  overdueAmount: string;
  pendingCount: number;
  repaidCount: number;
  overdueCount?: number;
}

export interface CreateLoanPayload {
  friendName: string;
  amount: number | string;
  dueDate: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
