import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '@/store';
import {
  incrementPendingChanges,
  decrementPendingChanges,
  setPendingChanges,
  setLastSyncedAt,
} from '@/store/slices';

const OFFLINE_QUEUE_KEY = '@kanban/offline_queue';

/**
 * Types of operations that can be queued
 */
export type OperationType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'MOVE_TASK'
  | 'CREATE_SECTION'
  | 'UPDATE_SECTION'
  | 'DELETE_SECTION'
  | 'CREATE_EPIC'
  | 'UPDATE_EPIC'
  | 'DELETE_EPIC'
  | 'ADD_COMMENT'
  | 'UPDATE_COMMENT'
  | 'DELETE_COMMENT';

/**
 * Queued operation interface
 */
export interface QueuedOperation {
  id: string;
  type: OperationType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

/**
 * OfflineQueueService - Manages offline operations queue
 *
 * Requirements:
 * - 15.7: Queue local changes when offline
 * - 15.7: Persist queue to AsyncStorage
 * - 15.7: Restore queue on app restart
 */
class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private maxRetries = 3;

  /**
   * Initialize the queue from storage
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        store.dispatch(setPendingChanges(this.queue.length));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Add an operation to the queue
   */
  async enqueue(type: OperationType, payload: Record<string, unknown>): Promise<string> {
    const operation: QueuedOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(operation);
    await this.persistQueue();
    store.dispatch(incrementPendingChanges());

    return operation.id;
  }

  /**
   * Remove an operation from the queue
   */
  async dequeue(operationId: string): Promise<void> {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    await this.persistQueue();
    store.dispatch(decrementPendingChanges());
  }

  /**
   * Get all queued operations
   */
  getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
    store.dispatch(setPendingChanges(0));
  }

  /**
   * Process the queue when back online
   */
  async processQueue(
    executor: (operation: QueuedOperation) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> {
    if (this.isProcessing || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    let success = 0;
    let failed = 0;

    // Process operations in order (FIFO)
    const operationsToProcess = [...this.queue];

    for (const operation of operationsToProcess) {
      try {
        const result = await executor(operation);
        if (result) {
          await this.dequeue(operation.id);
          success++;
        } else {
          operation.retryCount++;
          if (operation.retryCount >= this.maxRetries) {
            // Remove failed operation after max retries
            await this.dequeue(operation.id);
            failed++;
            console.warn(`Operation ${operation.id} failed after ${this.maxRetries} retries`);
          }
        }
      } catch (error) {
        operation.retryCount++;
        if (operation.retryCount >= this.maxRetries) {
          await this.dequeue(operation.id);
          failed++;
        }
        console.error(`Error processing operation ${operation.id}:`, error);
      }
    }

    this.isProcessing = false;
    await this.persistQueue();

    if (success > 0) {
      store.dispatch(setLastSyncedAt(new Date().toISOString()));
    }

    return { success, failed };
  }

  /**
   * Resolve conflicts using timestamp-based resolution
   * Server wins if server timestamp is newer, otherwise local wins
   */
  resolveConflict(
    localTimestamp: number,
    serverTimestamp: number,
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>
  ): { winner: 'local' | 'server'; data: Record<string, unknown> } {
    // Server wins if its timestamp is newer or equal (server is source of truth)
    if (serverTimestamp >= localTimestamp) {
      return { winner: 'server', data: serverData };
    }
    return { winner: 'local', data: localData };
  }

  /**
   * Persist queue to AsyncStorage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;
