import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SyncStatus, ConflictInfo } from '@kanban/shared';

/**
 * Sync state interface for real-time synchronization
 */
export interface SyncState {
  status: SyncStatus;
  pendingChanges: number;
  lastSyncedAt: string | null;
  conflicts: ConflictInfo[];
  subscribedBoards: string[];
}

/**
 * Initial sync state
 */
const initialState: SyncState = {
  status: 'offline',
  pendingChanges: 0,
  lastSyncedAt: null,
  conflicts: [],
  subscribedBoards: [],
};

/**
 * Sync slice
 */
const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    /**
     * Set the sync status
     */
    setStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.status = action.payload;
    },
    /**
     * Set connected status
     */
    setConnected: (state) => {
      state.status = 'synced';
    },
    /**
     * Set disconnected status
     */
    setDisconnected: (state) => {
      state.status = 'offline';
    },
    /**
     * Set syncing status
     */
    setSyncing: (state) => {
      state.status = 'syncing';
    },
    /**
     * Set error status
     */
    setError: (state) => {
      state.status = 'error';
    },
    /**
     * Increment pending changes count
     */
    incrementPendingChanges: (state) => {
      state.pendingChanges += 1;
    },
    /**
     * Decrement pending changes count
     */
    decrementPendingChanges: (state) => {
      state.pendingChanges = Math.max(0, state.pendingChanges - 1);
    },
    /**
     * Set pending changes count
     */
    setPendingChanges: (state, action: PayloadAction<number>) => {
      state.pendingChanges = action.payload;
    },
    /**
     * Clear pending changes
     */
    clearPendingChanges: (state) => {
      state.pendingChanges = 0;
    },
    /**
     * Update last synced timestamp
     */
    setLastSyncedAt: (state, action: PayloadAction<string>) => {
      state.lastSyncedAt = action.payload;
    },
    /**
     * Add a conflict
     */
    addConflict: (state, action: PayloadAction<ConflictInfo>) => {
      state.conflicts.push(action.payload);
    },
    /**
     * Remove a conflict by entity ID
     */
    removeConflict: (state, action: PayloadAction<string>) => {
      state.conflicts = state.conflicts.filter((c) => c.entityId !== action.payload);
    },
    /**
     * Clear all conflicts
     */
    clearConflicts: (state) => {
      state.conflicts = [];
    },
    /**
     * Add a board to subscribed list
     */
    subscribeToBoard: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      if (!state.subscribedBoards.includes(boardId)) {
        state.subscribedBoards.push(boardId);
      }
    },
    /**
     * Remove a board from subscribed list
     */
    unsubscribeFromBoard: (state, action: PayloadAction<string>) => {
      state.subscribedBoards = state.subscribedBoards.filter((id) => id !== action.payload);
    },
    /**
     * Clear all board subscriptions
     */
    clearSubscriptions: (state) => {
      state.subscribedBoards = [];
    },
    /**
     * Reset sync state
     */
    resetSync: () => initialState,
  },
});

export const {
  setStatus,
  setConnected,
  setDisconnected,
  setSyncing,
  setError,
  incrementPendingChanges,
  decrementPendingChanges,
  setPendingChanges,
  clearPendingChanges,
  setLastSyncedAt,
  addConflict,
  removeConflict,
  clearConflicts,
  subscribeToBoard,
  unsubscribeFromBoard,
  clearSubscriptions,
  resetSync,
} = syncSlice.actions;
export default syncSlice.reducer;
