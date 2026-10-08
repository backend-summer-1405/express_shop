import express, { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
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

// ==================== 404 & ERROR HANDLERS ====================

app.use(notFound);
app.use(errorHandler);

export default app;
