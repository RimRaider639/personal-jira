import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Epic, CreateEpicRequest } from '@kanban/shared';
import { apiClient } from '@/services/api';

/**
 * Epics state interface with normalized structure
 */
export interface EpicsState {
  byId: Record<string, Epic>;
  byBoardId: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial epics state
 */
const initialState: EpicsState = {
  byId: {},
  byBoardId: {},
  isLoading: false,
  error: null,
};

/**
 * Async thunk for fetching epics for a board
 */
export const fetchEpics = createAsyncThunk<
  { boardId: string; epics: Epic[] },
  string,
  { rejectValue: string }
>('epics/fetchByBoard', async (boardId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Epic[] }>(`/boards/${boardId}/epics`);
    return { boardId, epics: response.data.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch epics';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching all epics across all boards
 */
export const fetchAllEpics = createAsyncThunk<
  Epic[],
  void,
  { rejectValue: string }
>('epics/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Epic[] }>('/epics');
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch epics';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for creating an epic
 */
export const createEpic = createAsyncThunk<
  Epic,
  { boardId: string; data: CreateEpicRequest },
  { rejectValue: string }
>('epics/create', async ({ boardId, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Epic }>(`/boards/${boardId}/epics`, data);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create epic';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for updating an epic
 */
export const updateEpic = createAsyncThunk<
  Epic,
  { id: string; data: Partial<CreateEpicRequest> },
  { rejectValue: string }
>('epics/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Epic }>(`/epics/${id}`, data);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update epic';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for deleting an epic
 */
export const deleteEpic = createAsyncThunk<
  { epicId: string; boardId: string },
  { epicId: string; boardId: string },
  { rejectValue: string }
>('epics/delete', async ({ epicId, boardId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/epics/${epicId}`);
    return { epicId, boardId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete epic';
    return rejectWithValue(message);
  }
});

/**
 * Epics slice
 */
const epicsSlice = createSlice({
  name: 'epics',
  initialState,
  reducers: {
    /**
     * Clear any epic errors
     */
    clearError: (state) => {
      state.error = null;
    },
    /**
     * Add or update an epic (for real-time updates)
     */
    upsertEpic: (state, action: PayloadAction<Epic>) => {
      const epic = action.payload;
      state.byId[epic.id] = epic;

      // Update byBoardId index
      if (!state.byBoardId[epic.boardId]) {
        state.byBoardId[epic.boardId] = [];
      }
      if (!state.byBoardId[epic.boardId].includes(epic.id)) {
        state.byBoardId[epic.boardId].push(epic.id);
      }
    },
    /**
     * Remove an epic (for real-time updates)
     */
    removeEpic: (state, action: PayloadAction<{ epicId: string; boardId: string }>) => {
      const { epicId, boardId } = action.payload;
      delete state.byId[epicId];

      if (state.byBoardId[boardId]) {
        state.byBoardId[boardId] = state.byBoardId[boardId].filter((id) => id !== epicId);
      }
    },
    /**
     * Clear epics for a board (when board is deleted)
     */
    clearBoardEpics: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      const epicIds = state.byBoardId[boardId] || [];

      epicIds.forEach((id) => {
        delete state.byId[id];
      });

      delete state.byBoardId[boardId];
    },
    /**
     * Reset epics state
     */
    resetEpics: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch epics
    builder
      .addCase(fetchEpics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEpics.fulfilled, (state, action) => {
        state.isLoading = false;
        const { boardId, epics } = action.payload;

        // Clear existing epics for this board
        const existingIds = state.byBoardId[boardId] || [];
        existingIds.forEach((id) => {
          delete state.byId[id];
        });

        // Add new epics
        state.byBoardId[boardId] = [];
        epics.forEach((epic) => {
          state.byId[epic.id] = epic;
          state.byBoardId[boardId].push(epic.id);
        });
      })
      .addCase(fetchEpics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch epics';
      });

    // Fetch all epics
    builder
      .addCase(fetchAllEpics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllEpics.fulfilled, (state, action) => {
        state.isLoading = false;
        const epics = action.payload;

        // Add all epics
        epics.forEach((epic) => {
          state.byId[epic.id] = epic;
          
          if (!state.byBoardId[epic.boardId]) {
            state.byBoardId[epic.boardId] = [];
          }
          if (!state.byBoardId[epic.boardId].includes(epic.id)) {
            state.byBoardId[epic.boardId].push(epic.id);
          }
        });
      })
      .addCase(fetchAllEpics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch epics';
      });

    // Create epic
    builder
      .addCase(createEpic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEpic.fulfilled, (state, action) => {
        state.isLoading = false;
        const epic = action.payload;
        state.byId[epic.id] = epic;

        if (!state.byBoardId[epic.boardId]) {
          state.byBoardId[epic.boardId] = [];
        }
        state.byBoardId[epic.boardId].push(epic.id);
      })
      .addCase(createEpic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create epic';
      });

    // Update epic
    builder
      .addCase(updateEpic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEpic.fulfilled, (state, action) => {
        state.isLoading = false;
        const epic = action.payload;
        state.byId[epic.id] = epic;
      })
      .addCase(updateEpic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update epic';
      });

    // Delete epic
    builder
      .addCase(deleteEpic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEpic.fulfilled, (state, action) => {
        state.isLoading = false;
        const { epicId, boardId } = action.payload;
        delete state.byId[epicId];

        if (state.byBoardId[boardId]) {
          state.byBoardId[boardId] = state.byBoardId[boardId].filter((id) => id !== epicId);
        }
      })
      .addCase(deleteEpic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete epic';
      });
  },
});

export const { clearError, upsertEpic, removeEpic, clearBoardEpics, resetEpics } =
  epicsSlice.actions;
export default epicsSlice.reducer;
