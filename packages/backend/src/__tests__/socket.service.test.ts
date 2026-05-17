import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Create a fresh socket service instance for testing
class TestSocketService {
  private io: Server | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map();

  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

        if (!decoded.userId) {
          return next(new Error('Invalid token'));
        }

        (socket as unknown as { data: { userId: string; subscribedBoards: Set<string> } }).data = {
          userId: decoded.userId,
          subscribedBoards: new Set(),
        };

        next();
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          return next(new Error('Token expired'));
        }
        if (error instanceof jwt.JsonWebTokenError) {
          return next(new Error('Invalid token'));
        }
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      const socketData = (socket as unknown as { data: { userId: string; subscribedBoards: Set<string> } }).data;
      const userId = socketData.userId;

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      socket.join(`user:${userId}`);

      socket.on('board:subscribe', (data: { boardId: string }) => {
        if (!data.boardId) {
          socket.emit('error', { message: 'Board ID is required', code: 'INVALID_BOARD_ID' });
          return;
        }
        socket.join(`board:${data.boardId}`);
        socketData.subscribedBoards.add(data.boardId);
        socket.emit('sync:ack', {
          eventId: `subscribe:${data.boardId}`,
          serverTimestamp: Date.now(),
        });
      });

      socket.on('board:unsubscribe', (data: { boardId: string }) => {
        if (data.boardId) {
          socket.leave(`board:${data.boardId}`);
          socketData.subscribedBoards.delete(data.boardId);
        }
      });

      socket.on('disconnect', () => {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
      });
    });
  }

  getIO(): Server | null {
    return this.io;
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  broadcastToBoard(boardId: string, event: string, data: unknown): void {
    if (this.io) {
      this.io.to(`board:${boardId}`).emit(event, data);
    }
  }

  async close(): Promise<void> {
    if (this.io) {
      return new Promise((resolve) => {
        this.io!.close(() => resolve());
      });
    }
  }
}

describe('Socket Service', () => {
  let httpServer: HttpServer;
  let socketService: TestSocketService;
  let clientSocket: ClientSocket;
  const testUserId = 'test-user-123';
  let validToken: string;
  let serverPort: number;

  beforeAll((done) => {
    // Create valid JWT token for testing
    validToken = jwt.sign({ userId: testUserId }, config.jwtSecret, { expiresIn: '1h' });

    // Create HTTP server
    httpServer = createServer();
    socketService = new TestSocketService();
    socketService.initialize(httpServer);

    // Start server on random port
    httpServer.listen(0, () => {
      const address = httpServer.address();
      serverPort = typeof address === 'object' && address ? address.port : 3001;
      done();
    });
  });

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    await socketService.close();
    httpServer.close();
  });

  afterEach(() => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Authentication', () => {
    it('should reject connection without token', (done) => {
      const socket = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication required');
        socket.disconnect();
        done();
      });

      socket.connect();
    });

    it('should reject connection with invalid token', (done) => {
      const socket = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: 'invalid-token' },
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toBe('Invalid token');
        socket.disconnect();
        done();
      });

      socket.connect();
    });

    it('should reject connection with expired token', (done) => {
      const expiredToken = jwt.sign({ userId: testUserId }, config.jwtSecret, {
        expiresIn: '-1h',
      });

      const socket = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: expiredToken },
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toBe('Token expired');
        socket.disconnect();
        done();
      });

      socket.connect();
    });

    it('should accept connection with valid token', (done) => {
      clientSocket = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.connect();
    });

    it('should track connected users', (done) => {
      clientSocket = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        // Give a small delay for the server to process
        setTimeout(() => {
          expect(socketService.isUserConnected(testUserId)).toBe(true);
          expect(socketService.getConnectedUsersCount()).toBeGreaterThanOrEqual(1);
          done();
        }, 50);
      });

      clientSocket.connect();
    });
  });

  describe('Board Subscription', () => {
    beforeEach((done) => {
      clientSocket = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: validToken },
      });

      clientSocket.on('connect', () => {
        done();
      });

      clientSocket.connect();
    });

    it('should subscribe to a board and receive acknowledgment', (done) => {
      const boardId = 'board-123';

      clientSocket.on('sync:ack', (data) => {
        expect(data.eventId).toBe(`subscribe:${boardId}`);
        expect(data.serverTimestamp).toBeDefined();
        expect(typeof data.serverTimestamp).toBe('number');
        done();
      });

      clientSocket.emit('board:subscribe', { boardId });
    });

    it('should emit error when subscribing without boardId', (done) => {
      clientSocket.on('error', (data) => {
        expect(data.message).toBe('Board ID is required');
        expect(data.code).toBe('INVALID_BOARD_ID');
        done();
      });

      clientSocket.emit('board:subscribe', { boardId: '' });
    });

    it('should unsubscribe from a board', (done) => {
      const boardId = 'board-456';

      clientSocket.on('sync:ack', () => {
        // After subscribing, unsubscribe
        clientSocket.emit('board:unsubscribe', { boardId });
        // Give time for unsubscribe to process
        setTimeout(() => {
          done();
        }, 50);
      });

      clientSocket.emit('board:subscribe', { boardId });
    });
  });

  describe('Event Broadcasting', () => {
    let client1: ClientSocket;
    let client2: ClientSocket;
    const boardId = 'broadcast-board-123';

    beforeEach((done) => {
      const token1 = jwt.sign({ userId: 'user-1' }, config.jwtSecret, { expiresIn: '1h' });
      const token2 = jwt.sign({ userId: 'user-2' }, config.jwtSecret, { expiresIn: '1h' });

      let connected = 0;
      const checkDone = () => {
        connected++;
        if (connected === 2) {
          // Subscribe both clients to the same board
          let subscribed = 0;
          const checkSubscribed = () => {
            subscribed++;
            if (subscribed === 2) {
              done();
            }
          };

          client1.on('sync:ack', checkSubscribed);
          client2.on('sync:ack', checkSubscribed);

          client1.emit('board:subscribe', { boardId });
          client2.emit('board:subscribe', { boardId });
        }
      };

      client1 = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: token1 },
      });

      client2 = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: token2 },
      });

      client1.on('connect', checkDone);
      client2.on('connect', checkDone);

      client1.connect();
      client2.connect();
    });

    afterEach(() => {
      if (client1?.connected) client1.disconnect();
      if (client2?.connected) client2.disconnect();
    });

    it('should broadcast task:created event to board subscribers', (done) => {
      const taskData = { task: { id: 'task-1', title: 'Test Task' }, boardId };

      // Remove the sync:ack listeners from beforeEach
      client1.removeAllListeners('sync:ack');
      client2.removeAllListeners('sync:ack');

      client2.on('task:created', (data) => {
        expect(data).toEqual(taskData);
        done();
      });

      // Broadcast from server
      socketService.broadcastToBoard(boardId, 'task:created', taskData);
    });

    it('should broadcast task:updated event to board subscribers', (done) => {
      const taskData = {
        task: { id: 'task-1', title: 'Updated Task' },
        boardId,
        updatedBy: 'user-1',
      };

      client1.removeAllListeners('sync:ack');
      client2.removeAllListeners('sync:ack');

      client2.on('task:updated', (data) => {
        expect(data).toEqual(taskData);
        done();
      });

      socketService.broadcastToBoard(boardId, 'task:updated', taskData);
    });

    it('should broadcast task:deleted event to board subscribers', (done) => {
      const deleteData = { taskId: 'task-1', boardId };

      client1.removeAllListeners('sync:ack');
      client2.removeAllListeners('sync:ack');

      client2.on('task:deleted', (data) => {
        expect(data).toEqual(deleteData);
        done();
      });

      socketService.broadcastToBoard(boardId, 'task:deleted', deleteData);
    });

    it('should broadcast section:created event to board subscribers', (done) => {
      const sectionData = { section: { id: 'section-1', name: 'New Section' }, boardId };

      client1.removeAllListeners('sync:ack');
      client2.removeAllListeners('sync:ack');

      client2.on('section:created', (data) => {
        expect(data).toEqual(sectionData);
        done();
      });

      socketService.broadcastToBoard(boardId, 'section:created', sectionData);
    });

    it('should broadcast epic:created event to board subscribers', (done) => {
      const epicData = { epic: { id: 'epic-1', name: 'New Epic' }, boardId };

      client1.removeAllListeners('sync:ack');
      client2.removeAllListeners('sync:ack');

      client2.on('epic:created', (data) => {
        expect(data).toEqual(epicData);
        done();
      });

      socketService.broadcastToBoard(boardId, 'epic:created', epicData);
    });
  });

  describe('Disconnection', () => {
    it('should clean up user tracking on disconnect', (done) => {
      const disconnectUserId = 'disconnect-user';
      const disconnectToken = jwt.sign({ userId: disconnectUserId }, config.jwtSecret, {
        expiresIn: '1h',
      });

      const socket = ioc(`http://localhost:${serverPort}`, {
        autoConnect: false,
        auth: { token: disconnectToken },
      });

      socket.on('connect', () => {
        // Verify user is connected
        setTimeout(() => {
          expect(socketService.isUserConnected(disconnectUserId)).toBe(true);

          // Disconnect
          socket.disconnect();

          // Verify user is no longer connected
          setTimeout(() => {
            expect(socketService.isUserConnected(disconnectUserId)).toBe(false);
            done();
          }, 50);
        }, 50);
      });

      socket.connect();
    });
  });
});
