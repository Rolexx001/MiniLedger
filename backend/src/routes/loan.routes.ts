import { Router } from 'express';
import { loanController } from '../controllers/loan.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createLoanSchema,
  getLoansQuerySchema,
  loanIdParamSchema,
} from '../validators/loan.validator';

export const loanRouter = Router();

// Require JWT for all loan routes
loanRouter.use(requireAuth);

// Summary aggregate route MUST come before :id route
loanRouter.get('/summary', loanController.getSummary);

// CRUD routes
loanRouter.post('/', validateRequest(createLoanSchema), loanController.createLoan);
loanRouter.get('/', validateRequest(getLoansQuerySchema), loanController.getLoans);
loanRouter.get('/:id', validateRequest(loanIdParamSchema), loanController.getLoanById);
loanRouter.patch('/:id/repay', validateRequest(loanIdParamSchema), loanController.repayLoan);

export default loanRouter;
