import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FilterState, Priority, DueDateFilter } from '@kanban/shared';

/**
 * Filters state interface - stores filter state per board
 */
export interface FiltersState {
  byBoardId: Record<string, FilterState>;
}

/**
 * Default filter state for a board
 */
const defaultFilterState: FilterState = {
  epicIds: [],
  priorities: [],
  dueDateFilter: null,
  searchQuery: '',
};

/**
 * Initial filters state
 */
const initialState: FiltersState = {
  byBoardId: {},
};

/**
 * Filters slice
 */
const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    /**
     * Set epic filter for a board (AND logic - all selected epics required)
     */
    setEpicFilter: (state, action: PayloadAction<{ boardId: string; epicIds: string[] }>) => {
      const { boardId, epicIds } = action.payload;
      if (!state.byBoardId[boardId]) {
        state.byBoardId[boardId] = { ...defaultFilterState };
      }
      state.byBoardId[boardId].epicIds = epicIds;
    },
    /**
     * Toggle a single epic in the filter
     */
    toggleEpicFilter: (state, action: PayloadAction<{ boardId: string; epicId: string }>) => {
      const { boardId, epicId } = action.payload;
      if (!state.byBoardId[boardId]) {
        state.byBoardId[boardId] = { ...defaultFilterState };
      }

      const epicIds = state.byBoardId[boardId].epicIds;
      const index = epicIds.indexOf(epicId);

      if (index === -1) {
        epicIds.push(epicId);
      } else {
        epicIds.splice(index, 1);
      }
    },
    /**
     * Set priority filter for a board (OR logic - any selected priority)
     */
    setPriorityFilter: (
      state,
      action: PayloadAction<{ boardId: string; priorities: Priority[] }>
    ) => {
      const { boardId, priorities } = action.payload;
      if (!state.byBoardId[boardId]) {
        state.byBoardId[boardId] = { ...defaultFilterState };
      }
      state.byBoardId[boardId].priorities = priorities;
    },
    /**
     * Toggle a single priority in the filter
     */
    togglePriorityFilter: (
      state,
      action: PayloadAction<{ boardId: string; priority: Priority }>
    ) => {
      const { boardId, priority } = action.payload;
      if (!state.byBoardId[boardId]) {
        state.byBoardId[boardId] = { ...defaultFilterState };
      }

      const priorities = state.byBoardId[boardId].priorities;
      const index = priorities.indexOf(priority);

      if (index === -1) {
        priorities.push(priority);
      } else {
        priorities.splice(index, 1);
      }
    },
    /**
     * Set due date filter for a board
     */
    setDueDateFilter: (
      state,
      action: PayloadAction<{ boardId: string; dueDateFilter: DueDateFilter | null }>
    ) => {
      const { boardId, dueDateFilter } = action.payload;
      if (!state.byBoardId[boardId]) {
        state.byBoardId[boardId] = { ...defaultFilterState };
      }
      state.byBoardId[boardId].dueDateFilter = dueDateFilter;
    },
    /**
     * Set search query for a board
     */
    setSearchQuery: (state, action: PayloadAction<{ boardId: string; searchQuery: string }>) => {
      const { boardId, searchQuery } = action.payload;
      if (!state.byBoardId[boardId]) {
        state.byBoardId[boardId] = { ...defaultFilterState };
      }
      state.byBoardId[boardId].searchQuery = searchQuery;
    },
    /**
     * Clear all filters for a board
     */
    clearFilters: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      state.byBoardId[boardId] = { ...defaultFilterState };
    },
    /**
     * Clear filters for a deleted board
     */
    clearBoardFilters: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      delete state.byBoardId[boardId];
    },
    /**
     * Reset all filters
     */
    resetFilters: () => initialState,
  },
});

export const {
  setEpicFilter,
  toggleEpicFilter,
  setPriorityFilter,
  togglePriorityFilter,
  setDueDateFilter,
  setSearchQuery,
  clearFilters,
  clearBoardFilters,
  resetFilters,
} = filtersSlice.actions;
export default filtersSlice.reducer;
