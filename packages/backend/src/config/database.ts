import mongoose from 'mongoose';
import { config } from './index';

/**
 * MongoDB connection options
 */
const connectionOptions: mongoose.ConnectOptions = {
  // MongoDB Atlas free tier connection options
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Maximum number of connection retry attempts
 */
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Delay between retry attempts in milliseconds
 */
const RETRY_DELAY_MS = 5000;

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connect to MongoDB with retry logic
 * Supports both local MongoDB (Docker) and MongoDB Atlas connection strings
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.info(
        `[Database] Attempting to connect to MongoDB (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})...`
      );

      await mongoose.connect(config.mongodbUri, connectionOptions);

      console.info('[Database] MongoDB connected successfully');
      console.info(`[Database] Database: ${mongoose.connection.db?.databaseName}`);

      // Set up connection event handlers
      setupConnectionHandlers();

      return mongoose;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[Database] Connection attempt ${attempt} failed:`,
        (error as Error).message
      );

      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.info(`[Database] Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(
    `[Database] Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`
  );
};

/**
 * Set up MongoDB connection event handlers
 */
const setupConnectionHandlers = (): void => {
  mongoose.connection.on('connected', () => {
    console.info('[Database] Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.info('[Database] Mongoose reconnected to MongoDB');
  });
};

/**
 * Disconnect from MongoDB gracefully
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.info('[Database] MongoDB connection closed gracefully');
  } catch (error) {
    console.error('[Database] Error closing MongoDB connection:', (error as Error).message);
    throw error;
  }
};

/**
 * Get the current connection state
 */
export const getConnectionState = (): string => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Check if the database is connected
 */
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export default {
  connectDatabase,
  disconnectDatabase,
  getConnectionState,
  isConnected,
};
