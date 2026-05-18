import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Board, CreateBoardRequest, Task, BoardStats, ActivityHeatmapEntry } from '@kanban/shared';
import { apiClient } from '@/services/api';

/**
 * Boards state interface with normalized structure
 */
export interface BoardsState {
  byId: Record<string, Board>;
  allIds: string[];
  currentBoardId: string | null;
  stats: Record<string, BoardStats>;
  heatmaps: Record<string, { data: ActivityHeatmapEntry[]; days: number }>;
  archivedTasks: Record<string, Task[]>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial boards state
 */
const initialState: BoardsState = {
  byId: {},
  allIds: [],
  currentBoardId: null,
  stats: {},
  heatmaps: {},
  archivedTasks: {},
  isLoading: false,
  error: null,
};

/**
 * Async thunk for fetching all boards
 */
export const fetchBoards = createAsyncThunk<Board[], void, { rejectValue: string }>(
  'boards/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ data: Board[] }>('/boards');
      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch boards';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for fetching a single board
 */
export const fetchBoard = createAsyncThunk<Board, string, { rejectValue: string }>(
  'boards/fetchOne',
  async (boardId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ data: Board }>(`/boards/${boardId}`);
      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch board';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for creating a board
 */
export const createBoard = createAsyncThunk<Board, CreateBoardRequest, { rejectValue: string }>(
  'boards/create',
  async (boardData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ data: Board }>('/boards', boardData);
      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create board';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for updating a board
 */
export const updateBoard = createAsyncThunk<
  Board,
  { id: string; data: Partial<CreateBoardRequest> },
  { rejectValue: string }
>('boards/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Board }>(`/boards/${id}`, data);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update board';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for deleting a board
 */
export const deleteBoard = createAsyncThunk<string, string, { rejectValue: string }>(
  'boards/delete',
  async (boardId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/boards/${boardId}`);
      return boardId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete board';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for starting a sprint (archiving done tasks)
 */
export const startSprint = createAsyncThunk<
  { boardId: string; archivedCount: number },
  string,
  { rejectValue: string }
>('boards/startSprint', async (boardId, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ archivedCount: number }>(`/boards/${boardId}/sprint/start`);
    return { boardId, archivedCount: response.data.archivedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start sprint';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching archived tasks
 */
export const fetchArchivedTasks = createAsyncThunk<
  { boardId: string; tasks: Task[] },
  string,
  { rejectValue: string }
>('boards/fetchArchivedTasks', async (boardId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Task[] }>(`/boards/${boardId}/archived`);
    return { boardId, tasks: response.data.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch archived tasks';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for unarchiving a task
 */
export const unarchiveTask = createAsyncThunk<
  { boardId: string; task: Task },
  { boardId: string; taskId: string },
  { rejectValue: string }
>('boards/unarchiveTask', async ({ boardId, taskId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Task }>(`/boards/${boardId}/tasks/${taskId}/unarchive`);
    return { boardId, task: response.data.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unarchive task';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching board statistics
 */
export const fetchBoardStats = createAsyncThunk<
  { boardId: string; stats: BoardStats },
  string,
  { rejectValue: string }
>('boards/fetchStats', async (boardId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: BoardStats }>(`/boards/${boardId}/stats`);
    return { boardId, stats: response.data.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch board stats';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching activity heatmap
 */
export const fetchActivityHeatmap = createAsyncThunk<
  { boardId: string; heatmap: ActivityHeatmapEntry[]; days: number },
  { boardId: string; days?: number },
  { rejectValue: string }
>('boards/fetchActivityHeatmap', async ({ boardId, days = 30 }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ heatmap: ActivityHeatmapEntry[]; days: number }>(
      `/boards/${boardId}/activity/heatmap?days=${days}`
    );
    return { boardId, heatmap: response.data.heatmap, days: response.data.days };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activity heatmap';
    return rejectWithValue(message);
  }
});

/**
 * Boards slice
 */
const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    /**
     * Set the current active board
     */
    setCurrentBoard: (state, action: PayloadAction<string | null>) => {
      state.currentBoardId = action.payload;
    },
    /**
     * Clear any board errors
     */
    clearError: (state) => {
      state.error = null;
    },
    /**
     * Add or update a board (for real-time updates)
     */
    upsertBoard: (state, action: PayloadAction<Board>) => {
      const board = action.payload;
      state.byId[board.id] = board;
      if (!state.allIds.includes(board.id)) {
        state.allIds.push(board.id);
      }
    },
    /**
     * Remove a board (for real-time updates)
     */
    removeBoard: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      delete state.byId[boardId];
      state.allIds = state.allIds.filter((id) => id !== boardId);
      if (state.currentBoardId === boardId) {
        state.currentBoardId = null;
      }
    },
    /**
     * Reset boards state
     */
    resetBoards: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch all boards
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.byId = {};
        state.allIds = [];
        action.payload.forEach((board) => {
          state.byId[board.id] = board;
          state.allIds.push(board.id);
        });
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch boards';
      });

    // Fetch single board
    builder
      .addCase(fetchBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        const board = action.payload;
        state.byId[board.id] = board;
        if (!state.allIds.includes(board.id)) {
          state.allIds.push(board.id);
        }
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch board';
      });

    // Create board
    builder
      .addCase(createBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        const board = action.payload;
        state.byId[board.id] = board;
        state.allIds.push(board.id);
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create board';
      });

    // Update board
    builder
      .addCase(updateBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        const board = action.payload;
        state.byId[board.id] = board;
      })
      .addCase(updateBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update board';
      });

    // Delete board
    builder
      .addCase(deleteBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        const boardId = action.payload;
        delete state.byId[boardId];
        state.allIds = state.allIds.filter((id) => id !== boardId);
        if (state.currentBoardId === boardId) {
          state.currentBoardId = null;
        }
        // Clean up related state
        delete state.stats[boardId];
        delete state.heatmaps[boardId];
        delete state.archivedTasks[boardId];
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete board';
      });

    // Start sprint
    builder
      .addCase(startSprint.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startSprint.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(startSprint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to start sprint';
      });

    // Fetch archived tasks
    builder
      .addCase(fetchArchivedTasks.fulfilled, (state, action) => {
        const { boardId, tasks } = action.payload;
        state.archivedTasks[boardId] = tasks;
      })
      .addCase(fetchArchivedTasks.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to fetch archived tasks';
      });

    // Unarchive task
    builder
      .addCase(unarchiveTask.fulfilled, (state, action) => {
        const { boardId, task } = action.payload;
        // Remove from archived tasks
        if (state.archivedTasks[boardId]) {
          state.archivedTasks[boardId] = state.archivedTasks[boardId].filter(t => t.id !== task.id);
        }
      })
      .addCase(unarchiveTask.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to unarchive task';
      });

    // Fetch board stats
    builder
      .addCase(fetchBoardStats.fulfilled, (state, action) => {
        const { boardId, stats } = action.payload;
        state.stats[boardId] = stats;
      })
      .addCase(fetchBoardStats.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to fetch board stats';
      });

    // Fetch activity heatmap
    builder
      .addCase(fetchActivityHeatmap.fulfilled, (state, action) => {
        const { boardId, heatmap, days } = action.payload;
        state.heatmaps[boardId] = { data: heatmap, days };
      })
      .addCase(fetchActivityHeatmap.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to fetch activity heatmap';
      });
  },
});

export const { setCurrentBoard, clearError, upsertBoard, removeBoard, resetBoards } =
  boardsSlice.actions;
export default boardsSlice.reducer;
