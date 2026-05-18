import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Section } from '@kanban/shared';
import { apiClient } from '@/services/api';

/**
 * Sections state interface with normalized structure
 */
export interface SectionsState {
  byId: Record<string, Section>;
  byBoardId: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial sections state
 */
const initialState: SectionsState = {
  byId: {},
  byBoardId: {},
  isLoading: false,
  error: null,
};

/**
 * Async thunk for fetching sections for a board
 */
export const fetchSections = createAsyncThunk<
  { boardId: string; sections: Section[] },
  string,
  { rejectValue: string }
>('sections/fetchByBoard', async (boardId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Section[] }>(`/boards/${boardId}/sections`);
    return { boardId, sections: response.data.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sections';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching all sections for the user (across all boards)
 */
export const fetchAllSections = createAsyncThunk<
  Section[],
  void,
  { rejectValue: string }
>('sections/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Section[] }>('/sections');
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sections';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for creating a section
 */
export const createSection = createAsyncThunk<
  Section,
  { boardId: string; name: string },
  { rejectValue: string }
>('sections/create', async ({ boardId, name }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Section }>(`/boards/${boardId}/sections`, {
      name,
    });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create section';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for updating a section
 */
export const updateSection = createAsyncThunk<
  Section,
  { id: string; name: string },
  { rejectValue: string }
>('sections/update', async ({ id, name }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Section }>(`/sections/${id}`, { name });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update section';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for deleting a section
 */
export const deleteSection = createAsyncThunk<
  { sectionId: string; boardId: string },
  { sectionId: string; boardId: string },
  { rejectValue: string }
>('sections/delete', async ({ sectionId, boardId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/sections/${sectionId}`);
    return { sectionId, boardId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete section';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for reordering sections
 */
export const reorderSections = createAsyncThunk<
  { boardId: string; sectionOrder: string[] },
  { boardId: string; sectionOrder: string[] },
  { rejectValue: string }
>('sections/reorder', async ({ boardId, sectionOrder }, { rejectWithValue }) => {
  try {
    await apiClient.put(`/boards/${boardId}/sections/reorder`, { sectionOrder });
    return { boardId, sectionOrder };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder sections';
    return rejectWithValue(message);
  }
});

/**
 * Sections slice
 */
const sectionsSlice = createSlice({
  name: 'sections',
  initialState,
  reducers: {
    /**
     * Clear any section errors
     */
    clearError: (state) => {
      state.error = null;
    },
    /**
     * Add or update a section (for real-time updates)
     */
    upsertSection: (state, action: PayloadAction<Section>) => {
      const section = action.payload;
      state.byId[section.id] = section;

      // Update byBoardId index
      if (!state.byBoardId[section.boardId]) {
        state.byBoardId[section.boardId] = [];
      }
      if (!state.byBoardId[section.boardId].includes(section.id)) {
        state.byBoardId[section.boardId].push(section.id);
      }
    },
    /**
     * Remove a section (for real-time updates)
     */
    removeSection: (state, action: PayloadAction<{ sectionId: string; boardId: string }>) => {
      const { sectionId, boardId } = action.payload;
      delete state.byId[sectionId];

      if (state.byBoardId[boardId]) {
        state.byBoardId[boardId] = state.byBoardId[boardId].filter((id) => id !== sectionId);
      }
    },
    /**
     * Update section order for a board (for real-time updates)
     */
    setSectionOrder: (
      state,
      action: PayloadAction<{ boardId: string; sectionOrder: string[] }>
    ) => {
      const { boardId, sectionOrder } = action.payload;
      state.byBoardId[boardId] = sectionOrder;

      // Update positions in byId
      sectionOrder.forEach((sectionId, index) => {
        if (state.byId[sectionId]) {
          state.byId[sectionId].position = index;
        }
      });
    },
    /**
     * Clear sections for a board (when board is deleted)
     */
    clearBoardSections: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      const sectionIds = state.byBoardId[boardId] || [];

      sectionIds.forEach((id) => {
        delete state.byId[id];
      });

      delete state.byBoardId[boardId];
    },
    /**
     * Reset sections state
     */
    resetSections: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch sections
    builder
      .addCase(fetchSections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.isLoading = false;
        const { boardId, sections } = action.payload;

        // Clear existing sections for this board
        const existingIds = state.byBoardId[boardId] || [];
        existingIds.forEach((id) => {
          delete state.byId[id];
        });

        // Add new sections
        state.byBoardId[boardId] = [];
        sections.forEach((section) => {
          state.byId[section.id] = section;
          state.byBoardId[boardId].push(section.id);
        });
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch sections';
      });

    // Fetch all sections (across all boards)
    builder
      .addCase(fetchAllSections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSections.fulfilled, (state, action) => {
        state.isLoading = false;
        const sections = action.payload;

        // Add all sections to the store
        sections.forEach((section) => {
          state.byId[section.id] = section;
          
          if (!state.byBoardId[section.boardId]) {
            state.byBoardId[section.boardId] = [];
          }
          if (!state.byBoardId[section.boardId].includes(section.id)) {
            state.byBoardId[section.boardId].push(section.id);
          }
        });
      })
      .addCase(fetchAllSections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch sections';
      });

    // Create section
    builder
      .addCase(createSection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.isLoading = false;
        const section = action.payload;
        state.byId[section.id] = section;

        if (!state.byBoardId[section.boardId]) {
          state.byBoardId[section.boardId] = [];
        }
        state.byBoardId[section.boardId].push(section.id);
      })
      .addCase(createSection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create section';
      });

    // Update section
    builder
      .addCase(updateSection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        state.isLoading = false;
        const section = action.payload;
        state.byId[section.id] = section;
      })
      .addCase(updateSection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update section';
      });

    // Delete section
    builder
      .addCase(deleteSection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSection.fulfilled, (state, action) => {
        state.isLoading = false;
        const { sectionId, boardId } = action.payload;
        delete state.byId[sectionId];

        if (state.byBoardId[boardId]) {
          state.byBoardId[boardId] = state.byBoardId[boardId].filter((id) => id !== sectionId);
        }
      })
      .addCase(deleteSection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete section';
      });

    // Reorder sections
    builder
      .addCase(reorderSections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderSections.fulfilled, (state, action) => {
        state.isLoading = false;
        const { boardId, sectionOrder } = action.payload;
        state.byBoardId[boardId] = sectionOrder;

        // Update positions
        sectionOrder.forEach((sectionId, index) => {
          if (state.byId[sectionId]) {
            state.byId[sectionId].position = index;
          }
        });
      })
      .addCase(reorderSections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to reorder sections';
      });
  },
});

export const {
  clearError,
  upsertSection,
  removeSection,
  setSectionOrder,
  clearBoardSections,
  resetSections,
} = sectionsSlice.actions;
export default sectionsSlice.reducer;
