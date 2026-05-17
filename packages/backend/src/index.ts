import { createServer } from 'http';
import createApp from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { socketService } from './services';

const app = createApp();
const httpServer = createServer(app);
let server: ReturnType<typeof httpServer.listen> | null = null;

/**
 * Start the server after connecting to the database
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Socket.io with the HTTP server
    socketService.initialize(httpServer);

    // Start the HTTP server (with Socket.io attached)
    server = httpServer.listen(config.port, () => {
      console.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Personal Kanban Board - Backend Server                   ║
║                                                            ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║   Port: ${config.port.toString().padEnd(47)}║
║   Health: http://localhost:${config.port}/api/health${' '.repeat(21)}║
║   Database: Connected                                      ║
║   WebSocket: Enabled                                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', (error as Error).message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.info(`\n${signal} received. Shutting down gracefully...`);

  // Close HTTP server first
  if (server) {
    server.close(() => {
      console.info('[Server] HTTP server closed.');
    });
  }

  try {
    // Close WebSocket connections
    await socketService.close();

    // Disconnect from MongoDB
    await disconnectDatabase();
    console.info('[Server] All connections closed. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during shutdown:', (error as Error).message);
    process.exit(1);
  }

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the server
startServer();

export { app, server, httpServer };
