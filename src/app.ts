import express, { Application, Request, Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { generalLimiter } from './middlewares/rateLimiter.middleware';
import userRoutes from './modules/user/user.routes';
import newsRoutes from './modules/news/news.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import courseRoutes from './modules/course/course.routes';

const app: Application = express();

// ==================== SECURITY ====================

app.use(helmet());

// ==================== MIDDLEWARES ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== RATE LIMITING ====================

app.use('/api', generalLimiter);

// ==================== STATIC FILES ====================

app.use('/uploads', express.static(path.resolve('uploads')));

// ==================== SWAGGER ====================

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Express Shop API Docs',
  })
);

// ==================== HEALTH CHECK ====================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Express Shop API',
    version: '1.0.0',
  });
});
// ==================== ROUTES ====================

app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/courses', courseRoutes);

// ==================== 404 & ERROR HANDLERS ====================

app.use(notFound);
app.use(errorHandler);

export default app;
