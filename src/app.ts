import express, { Application, Request, Response } from 'express';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

const app: Application = express();

// ==================== MIDDLEWARES ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== HEALTH CHECK ====================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Express Shop API',
    version: '1.0.0',
  });
});

// ==================== 404 HANDLER ====================


app.use(notFound);

// ==================== ERROR HANDLER ====================


app.use(errorHandler);

export default app;
