import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import {
  setConnected,
  setDisconnected,
  setSyncing,
  setError,
  subscribeToBoard,
  unsubscribeFromBoard,
  upsertTask,
  removeTask,
  upsertSection,
  removeSection,
  upsertEpic,
  removeEpic,
} from '@/store/slices';
import type { Task, Section, Epic } from '@kanban/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Socket.io client service for real-time sync
 *
 * Requirements:
 * - 15.3: Implement WebSocket connection with Socket.io client
 * - 15.4: Handle authentication with JWT
 * - 15.6: Handle incoming events and update Redux store
 */
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscribedBoards: Set<string> = new Set();

  /**
   * Connect to the WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.subscribedBoards.clear();
      store.dispatch(setDisconnected());
    }
  }

  /**
   * Subscribe to a board for real-time updates
   */
  subscribeToBoardUpdates(boardId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot subscribe to board');
      return;
    }

    if (this.subscribedBoards.has(boardId)) {
      return;
    }

    this.socket.emit('board:subscribe', { boardId }, (response: { success: boolean }) => {
      if (response.success) {
        this.subscribedBoards.add(boardId);
        store.dispatch(subscribeToBoard(boardId));
      }
    });
  }

  /**
   * Unsubscribe from a board
   */
  unsubscribeFromBoardUpdates(boardId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    if (!this.subscribedBoards.has(boardId)) {
      return;
    }

    this.socket.emit('board:unsubscribe', { boardId });
    this.subscribedBoards.delete(boardId);
    store.dispatch(unsubscribeFromBoard(boardId));
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Set up event listeners for socket events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      store.dispatch(setConnected());

      // Re-subscribe to boards after reconnection
      this.subscribedBoards.forEach((boardId) => {
        this.socket?.emit('board:subscribe', { boardId });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(setDisconnected());
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(setError());
      }
    });

    // Task events
    this.socket.on('task:created', (data: { task: Task }) => {
      store.dispatch(upsertTask(data.task));
    });

    this.socket.on('task:updated', (data: { task: Task }) => {
      store.dispatch(upsertTask(data.task));
    });

    this.socket.on('task:deleted', (data: { taskId: string; sectionId: string; boardId: string }) => {
      store.dispatch(removeTask(data));
    });

    this.socket.on('task:moved', (data: { task: Task; oldSectionId: string }) => {
      store.dispatch(upsertTask(data.task));
    });

    // Section events
    this.socket.on('section:created', (data: { section: Section }) => {
      store.dispatch(upsertSection(data.section));
    });

    this.socket.on('section:updated', (data: { section: Section }) => {
      store.dispatch(upsertSection(data.section));
    });

    this.socket.on('section:deleted', (data: { sectionId: string; boardId: string }) => {
      store.dispatch(removeSection(data));
    });

    // Epic events
    this.socket.on('epic:created', (data: { epic: Epic }) => {
      store.dispatch(upsertEpic(data.epic));
    });

    this.socket.on('epic:updated', (data: { epic: Epic }) => {
      store.dispatch(upsertEpic(data.epic));
    });

    this.socket.on('epic:deleted', (data: { epicId: string; boardId: string }) => {
      store.dispatch(removeEpic(data));
    });

    // Sync acknowledgment
    this.socket.on('sync:ack', (data: { timestamp: number }) => {
      console.log('Sync acknowledged at:', new Date(data.timestamp).toISOString());
    });

    // Error events
    this.socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
      store.dispatch(setError());
    });
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
