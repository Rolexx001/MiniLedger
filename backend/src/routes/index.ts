import { Router } from 'express';
import { authRouter } from './auth.routes';
import { loanRouter } from './loan.routes';

export const rootRouter = Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/loans', loanRouter);

export default rootRouter;
