import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Board, CreateBoardRequest } from '@kanban/shared';
import { apiClient } from '@/services/api';

/**
 * Boards state interface with normalized structure
 */
export interface BoardsState {
  byId: Record<string, Board>;
  allIds: string[];
  currentBoardId: string | null;
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
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete board';
      });
  },
});

export const { setCurrentBoard, clearError, upsertBoard, removeBoard, resetBoards } =
  boardsSlice.actions;
export default boardsSlice.reducer;
