import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Note } from '@kanban/shared';
import { apiClient } from '@/services/api';

/**
 * Notes state interface
 */
export interface NotesState {
  byId: Record<string, Note>;
  allIds: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial notes state
 */
const initialState: NotesState = {
  byId: {},
  allIds: [],
  isLoading: false,
  error: null,
};

/**
 * Async thunk for fetching all notes
 */
export const fetchNotes = createAsyncThunk<
  Note[],
  void,
  { rejectValue: string }
>('notes/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Note[] }>('/notes');
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notes';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for creating a note
 */
export const createNote = createAsyncThunk<
  Note,
  { content: string; color?: string },
  { rejectValue: string }
>('notes/create', async (data, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Note }>('/notes', data);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create note';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for updating a note
 */
export const updateNote = createAsyncThunk<
  Note,
  { id: string; content?: string; color?: string },
  { rejectValue: string }
>('notes/update', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Note }>(`/notes/${id}`, data);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update note';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for deleting a note
 */
export const deleteNote = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('notes/delete', async (noteId, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/notes/${noteId}`);
    return noteId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete note';
    return rejectWithValue(message);
  }
});

/**
 * Notes slice
 */
const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    /**
     * Clear any note errors
     */
    clearNotesError: (state) => {
      state.error = null;
    },
    /**
     * Reset notes state
     */
    resetNotes: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch notes
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.byId = {};
        state.allIds = [];
        action.payload.forEach((note) => {
          state.byId[note.id] = note;
          state.allIds.push(note.id);
        });
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch notes';
      });

    // Create note
    builder
      .addCase(createNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.isLoading = false;
        const note = action.payload;
        state.byId[note.id] = note;
        state.allIds.unshift(note.id); // Add to beginning
      })
      .addCase(createNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create note';
      });

    // Update note
    builder
      .addCase(updateNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.isLoading = false;
        const note = action.payload;
        state.byId[note.id] = note;
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update note';
      });

    // Delete note
    builder
      .addCase(deleteNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.isLoading = false;
        const noteId = action.payload;
        delete state.byId[noteId];
        state.allIds = state.allIds.filter((id) => id !== noteId);
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete note';
      });
  },
});

export const { clearNotesError, resetNotes } = notesSlice.actions;
export default notesSlice.reducer;
