import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging in development
  if (config.isDevelopment) {
    app.use((req, _res, next) => {
      console.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // API routes
  app.use('/api', routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
