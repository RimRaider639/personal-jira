import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Socket.io event types for client -> server communication
 */
export interface ClientToServerEvents {
  'board:subscribe': (data: { boardId: string }) => void;
  'board:unsubscribe': (data: { boardId: string }) => void;
}

/**
 * Socket.io event types for server -> client communication
 */
export interface ServerToClientEvents {
  // Sync acknowledgment
  'sync:ack': (data: { eventId: string; serverTimestamp: number }) => void;

  // Task events
  'task:created': (data: { task: unknown; boardId: string }) => void;
  'task:updated': (data: { task: unknown; boardId: string; updatedBy: string }) => void;
  'task:deleted': (data: { taskId: string; boardId: string }) => void;
  'task:moved': (data: {
    taskId: string;
    boardId: string;
    sectionId: string;
    position: number;
  }) => void;

  // Section events
  'section:created': (data: { section: unknown; boardId: string }) => void;
  'section:updated': (data: { section: unknown; boardId: string }) => void;
  'section:deleted': (data: { sectionId: string; boardId: string }) => void;
  'section:reordered': (data: { boardId: string; sectionOrder: string[] }) => void;

  // Epic events
  'epic:created': (data: { epic: unknown; boardId: string }) => void;
  'epic:updated': (data: { epic: unknown; boardId: string }) => void;
  'epic:deleted': (data: { epicId: string; boardId: string }) => void;

  // Comment events
  'comment:created': (data: { comment: unknown; taskId: string; boardId: string }) => void;
  'comment:updated': (data: { comment: unknown; taskId: string; boardId: string }) => void;
  'comment:deleted': (data: { commentId: string; taskId: string; boardId: string }) => void;

  // Attachment events
  'attachment:created': (data: { attachment: unknown; taskId: string; boardId: string }) => void;
  'attachment:deleted': (data: { attachmentId: string; taskId: string; boardId: string }) => void;

  // Error events
  error: (data: { message: string; code?: string }) => void;
}

/**
 * Socket data attached to each connection
 */
interface SocketData {
  userId: string;
  subscribedBoards: Set<string>;
}

/**
 * Extended Socket type with our custom events and data
 */
type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

/**
 * SocketService - Manages WebSocket connections for real-time sync
 *
 * Features:
 * - JWT authentication for connections
 * - Board-level room subscriptions
 * - Real-time event broadcasting
 * - In-memory adapter (Redis-ready for horizontal scaling)
 */
class SocketService {
  private io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  > | null = null;

  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize Socket.io server with the HTTP server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Use in-memory adapter by default
      // For horizontal scaling, add @socket.io/redis-adapter:
      // adapter: createAdapter(pubClient, subClient)
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    console.info('[Socket.io] WebSocket server initialized');
  }

  /**
   * Authenticate socket connection using JWT
   */
  private authenticateSocket(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): void {
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

      // Attach user data to socket
      socket.data.userId = decoded.userId;
      socket.data.subscribedBoards = new Set();

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
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.data.userId;
    console.info(`[Socket.io] User ${userId} connected (socket: ${socket.id})`);

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    // Join user-specific room for direct messages
    socket.join(`user:${userId}`);

    // Handle board subscription
    socket.on('board:subscribe', (data) => {
      this.handleBoardSubscribe(socket, data.boardId);
    });

    // Handle board unsubscription
    socket.on('board:unsubscribe', (data) => {
      this.handleBoardUnsubscribe(socket, data.boardId);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });
  }

  /**
   * Handle board subscription request
   */
  private handleBoardSubscribe(socket: AuthenticatedSocket, boardId: string): void {
    if (!boardId) {
      socket.emit('error', { message: 'Board ID is required', code: 'INVALID_BOARD_ID' });
      return;
    }

    const roomName = `board:${boardId}`;
    socket.join(roomName);
    socket.data.subscribedBoards.add(boardId);

    console.info(
      `[Socket.io] User ${socket.data.userId} subscribed to board ${boardId}`
    );

    // Send acknowledgment
    socket.emit('sync:ack', {
      eventId: `subscribe:${boardId}`,
      serverTimestamp: Date.now(),
    });
  }

  /**
   * Handle board unsubscription request
   */
  private handleBoardUnsubscribe(socket: AuthenticatedSocket, boardId: string): void {
    if (!boardId) {
      return;
    }

    const roomName = `board:${boardId}`;
    socket.leave(roomName);
    socket.data.subscribedBoards.delete(boardId);

    console.info(
      `[Socket.io] User ${socket.data.userId} unsubscribed from board ${boardId}`
    );
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket, reason: string): void {
    const userId = socket.data.userId;
    console.info(
      `[Socket.io] User ${userId} disconnected (socket: ${socket.id}, reason: ${reason})`
    );

    // Remove socket from user's connections
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  /**
   * Get the Socket.io server instance
   */
  getIO(): Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  > | null {
    return this.io;
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // ==================== Broadcasting Methods ====================

  /**
   * Broadcast to all subscribers of a board (except sender)
   */
  private broadcastToBoard(
    boardId: string,
    event: keyof ServerToClientEvents,
    data: unknown,
    excludeSocketId?: string
  ): void {
    if (!this.io) return;

    const roomName = `board:${boardId}`;

    if (excludeSocketId) {
      this.io.to(roomName).except(excludeSocketId).emit(event, data as never);
    } else {
      this.io.to(roomName).emit(event, data as never);
    }
  }

  // ==================== Task Events ====================

  /**
   * Broadcast task created event
   */
  broadcastTaskCreated(boardId: string, task: unknown, excludeSocketId?: string): void {
    this.broadcastToBoard(boardId, 'task:created', { task, boardId }, excludeSocketId);
  }

  /**
   * Broadcast task updated event
   */
  broadcastTaskUpdated(
    boardId: string,
    task: unknown,
    updatedBy: string,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'task:updated',
      { task, boardId, updatedBy },
      excludeSocketId
    );
  }

  /**
   * Broadcast task deleted event
   */
  broadcastTaskDeleted(boardId: string, taskId: string, excludeSocketId?: string): void {
    this.broadcastToBoard(boardId, 'task:deleted', { taskId, boardId }, excludeSocketId);
  }

  /**
   * Broadcast task moved event
   */
  broadcastTaskMoved(
    boardId: string,
    taskId: string,
    sectionId: string,
    position: number,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'task:moved',
      { taskId, boardId, sectionId, position },
      excludeSocketId
    );
  }

  // ==================== Section Events ====================

  /**
   * Broadcast section created event
   */
  broadcastSectionCreated(
    boardId: string,
    section: unknown,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'section:created',
      { section, boardId },
      excludeSocketId
    );
  }

  /**
   * Broadcast section updated event
   */
  broadcastSectionUpdated(
    boardId: string,
    section: unknown,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'section:updated',
      { section, boardId },
      excludeSocketId
    );
  }

  /**
   * Broadcast section deleted event
   */
  broadcastSectionDeleted(
    boardId: string,
    sectionId: string,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'section:deleted',
      { sectionId, boardId },
      excludeSocketId
    );
  }

  /**
   * Broadcast section reordered event
   */
  broadcastSectionReordered(
    boardId: string,
    sectionOrder: string[],
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'section:reordered',
      { boardId, sectionOrder },
      excludeSocketId
    );
  }

  // ==================== Epic Events ====================

  /**
   * Broadcast epic created event
   */
  broadcastEpicCreated(boardId: string, epic: unknown, excludeSocketId?: string): void {
    this.broadcastToBoard(boardId, 'epic:created', { epic, boardId }, excludeSocketId);
  }

  /**
   * Broadcast epic updated event
   */
  broadcastEpicUpdated(boardId: string, epic: unknown, excludeSocketId?: string): void {
    this.broadcastToBoard(boardId, 'epic:updated', { epic, boardId }, excludeSocketId);
  }

  /**
   * Broadcast epic deleted event
   */
  broadcastEpicDeleted(boardId: string, epicId: string, excludeSocketId?: string): void {
    this.broadcastToBoard(boardId, 'epic:deleted', { epicId, boardId }, excludeSocketId);
  }

  // ==================== Comment Events ====================

  /**
   * Broadcast comment created event
   */
  broadcastCommentCreated(
    boardId: string,
    taskId: string,
    comment: unknown,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'comment:created',
      { comment, taskId, boardId },
      excludeSocketId
    );
  }

  /**
   * Broadcast comment updated event
   */
  broadcastCommentUpdated(
    boardId: string,
    taskId: string,
    comment: unknown,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'comment:updated',
      { comment, taskId, boardId },
      excludeSocketId
    );
  }

  /**
   * Broadcast comment deleted event
   */
  broadcastCommentDeleted(
    boardId: string,
    taskId: string,
    commentId: string,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'comment:deleted',
      { commentId, taskId, boardId },
      excludeSocketId
    );
  }

  // ==================== Attachment Events ====================

  /**
   * Broadcast attachment created event
   */
  broadcastAttachmentCreated(
    boardId: string,
    taskId: string,
    attachment: unknown,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'attachment:created',
      { attachment, taskId, boardId },
      excludeSocketId
    );
  }

  /**
   * Broadcast attachment deleted event
   */
  broadcastAttachmentDeleted(
    boardId: string,
    taskId: string,
    attachmentId: string,
    excludeSocketId?: string
  ): void {
    this.broadcastToBoard(
      boardId,
      'attachment:deleted',
      { attachmentId, taskId, boardId },
      excludeSocketId
    );
  }

  /**
   * Gracefully close all connections
   */
  async close(): Promise<void> {
    if (this.io) {
      return new Promise((resolve) => {
        this.io!.close(() => {
          console.info('[Socket.io] WebSocket server closed');
          resolve();
        });
      });
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
