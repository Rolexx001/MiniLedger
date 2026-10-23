import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rootRouter from './routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MiniLedger Backend API',
  });
});

// Mount Centralized API Routes
app.use('/api', rootRouter);

// 404 Handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
