import { Request, Response, NextFunction } from 'express';
import { LoanService, loanService } from '../services/loan.service';

export class LoanController {
  private service: LoanService;

  constructor(service: LoanService = loanService) {
    this.service = service;
  }

  createLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { friendName, amount, dueDate } = req.body;
      const loan = await this.service.createLoan(userId, { friendName, amount, dueDate });
      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        loan,
      });
    } catch (error) {
      next(error);
    }
  };

  getLoans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const statusFilter = req.query.status as 'PENDING' | 'REPAID' | 'ALL' | undefined;
      const loans = await this.service.getLoans(userId, statusFilter);
      res.status(200).json({
        success: true,
        count: loans.length,
        loans,
      });
    } catch (error) {
      next(error);
    }
  };

  getLoanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const loan = await this.service.getLoanById(id, userId);
      res.status(200).json({
        success: true,
        loan,
      });
    } catch (error) {
      next(error);
    }
  };

  repayLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const loan = await this.service.repayLoan(id, userId);
      res.status(200).json({
        success: true,
        message: 'Loan marked as repaid successfully',
        loan,
      });
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const summary = await this.service.getSummary(userId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  };
}

export const loanController = new LoanController();
export default loanController;
