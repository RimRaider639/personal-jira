import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env['PORT'] || '3001', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  isDevelopment: process.env['NODE_ENV'] !== 'production',
  isProduction: process.env['NODE_ENV'] === 'production',

  // Database
  mongodbUri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kanban',

  // JWT
  jwtSecret: process.env['JWT_SECRET'] || 'dev-secret-key',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',

  // Cloudinary
  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'] || '',
    apiKey: process.env['CLOUDINARY_API_KEY'] || '',
    apiSecret: process.env['CLOUDINARY_API_SECRET'] || '',
  },

  // CORS
  corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:8081',
};

export default config;
