import express, { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import userRoutes from './modules/user/user.routes';  // ← این رو اضافه کن

const app: Application = express();

// ==================== MIDDLEWARES ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ==================== ROUTES ====================

app.use('/api/users', userRoutes);  // ← این خط خیلی مهمه!

// ==================== 404 & ERROR HANDLERS ====================

app.use(notFound);
app.use(errorHandler);

export default app;
