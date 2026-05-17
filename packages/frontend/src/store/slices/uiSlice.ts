import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Drag state for drag-and-drop operations
 */
export interface DragState {
  type: 'task' | 'section';
  itemId: string;
  sourceSectionId?: string;
  sourcePosition?: number;
}

/**
 * UI state interface for UI-related state
 */
export interface UIState {
  scrollPositions: Record<string, number>;
  expandedTasks: string[];
  dragState: DragState | null;
  isFilterPanelOpen: boolean;
  activeModal: string | null;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info' | null;
}

/**
 * Initial UI state
 */
const initialState: UIState = {
  scrollPositions: {},
  expandedTasks: [],
  dragState: null,
  isFilterPanelOpen: false,
  activeModal: null,
  toastMessage: null,
  toastType: null,
};

/**
 * UI slice
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Save scroll position for a board
     */
    setScrollPosition: (state, action: PayloadAction<{ boardId: string; position: number }>) => {
      const { boardId, position } = action.payload;
      state.scrollPositions[boardId] = position;
    },
    /**
     * Clear scroll position for a board
     */
    clearScrollPosition: (state, action: PayloadAction<string>) => {
      delete state.scrollPositions[action.payload];
    },
    /**
     * Toggle task expansion
     */
    toggleTaskExpanded: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const index = state.expandedTasks.indexOf(taskId);

      if (index === -1) {
        state.expandedTasks.push(taskId);
      } else {
        state.expandedTasks.splice(index, 1);
      }
    },
    /**
     * Expand a task
     */
    expandTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      if (!state.expandedTasks.includes(taskId)) {
        state.expandedTasks.push(taskId);
      }
    },
    /**
     * Collapse a task
     */
    collapseTask: (state, action: PayloadAction<string>) => {
      state.expandedTasks = state.expandedTasks.filter((id) => id !== action.payload);
    },
    /**
     * Collapse all tasks
     */
    collapseAllTasks: (state) => {
      state.expandedTasks = [];
    },
    /**
     * Start dragging
     */
    startDrag: (state, action: PayloadAction<DragState>) => {
      state.dragState = action.payload;
    },
    /**
     * End dragging
     */
    endDrag: (state) => {
      state.dragState = null;
    },
    /**
     * Toggle filter panel
     */
    toggleFilterPanel: (state) => {
      state.isFilterPanelOpen = !state.isFilterPanelOpen;
    },
    /**
     * Open filter panel
     */
    openFilterPanel: (state) => {
      state.isFilterPanelOpen = true;
    },
    /**
     * Close filter panel
     */
    closeFilterPanel: (state) => {
      state.isFilterPanelOpen = false;
    },
    /**
     * Set active modal
     */
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload;
    },
    /**
     * Open a modal
     */
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    /**
     * Close the active modal
     */
    closeModal: (state) => {
      state.activeModal = null;
    },
    /**
     * Show a toast message
     */
    showToast: (
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>
    ) => {
      state.toastMessage = action.payload.message;
      state.toastType = action.payload.type;
    },
    /**
     * Hide the toast message
     */
    hideToast: (state) => {
      state.toastMessage = null;
      state.toastType = null;
    },
    /**
     * Reset UI state
     */
    resetUI: () => initialState,
  },
});

export const {
  setScrollPosition,
  clearScrollPosition,
  toggleTaskExpanded,
  expandTask,
  collapseTask,
  collapseAllTasks,
  startDrag,
  endDrag,
  toggleFilterPanel,
  openFilterPanel,
  closeFilterPanel,
  setActiveModal,
  openModal,
  closeModal,
  showToast,
  hideToast,
  resetUI,
} = uiSlice.actions;
export default uiSlice.reducer;
