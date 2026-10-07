import express, { Application, Request, Response } from 'express';

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

// ==================== ROOT ====================

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Express Shop API',
    version: '1.0.0',
  });
});

export default app;
