// Export all slice reducers
export { default as authReducer } from './authSlice';
export { default as boardsReducer } from './boardsSlice';
export { default as sectionsReducer } from './sectionsSlice';
export { default as tasksReducer } from './tasksSlice';
export { default as epicsReducer } from './epicsSlice';
export { default as filtersReducer } from './filtersSlice';
export { default as syncReducer } from './syncSlice';
export { default as uiReducer } from './uiSlice';

// Export auth actions
export {
  clearError as clearAuthError,
  setToken,
  setUser,
  resetAuth,
  login,
  register,
  logout,
} from './authSlice';
export type { AuthState } from './authSlice';

// Export boards actions
export {
  setCurrentBoard,
  clearError as clearBoardsError,
  upsertBoard,
  removeBoard,
  resetBoards,
  fetchBoards,
  fetchBoard,
  createBoard,
  updateBoard,
  deleteBoard,
} from './boardsSlice';
export type { BoardsState } from './boardsSlice';

// Export sections actions
export {
  clearError as clearSectionsError,
  upsertSection,
  removeSection,
  setSectionOrder,
  clearBoardSections,
  resetSections,
  fetchSections,
  fetchAllSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from './sectionsSlice';
export type { SectionsState } from './sectionsSlice';

// Export tasks actions
export {
  clearError as clearTasksError,
  upsertTask,
  removeTask,
  reorderTasksInSection,
  clearSectionTasks,
  clearBoardTasks,
  resetTasks,
  fetchTasks,
  fetchAllTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  assignEpicToTask,
  removeEpicFromTask,
  uploadAttachment,
  deleteAttachment,
  addComment,
  deleteComment,
} from './tasksSlice';
export type { TasksState } from './tasksSlice';

// Export epics actions
export {
  clearError as clearEpicsError,
  upsertEpic,
  removeEpic,
  clearBoardEpics,
  resetEpics,
  fetchEpics,
  fetchAllEpics,
  createEpic,
  updateEpic,
  deleteEpic,
} from './epicsSlice';
export type { EpicsState } from './epicsSlice';

// Export filters actions
export {
  setEpicFilter,
  toggleEpicFilter,
  setPriorityFilter,
  togglePriorityFilter,
  setDueDateFilter,
  setSearchQuery,
  clearFilters,
  clearBoardFilters,
  resetFilters,
} from './filtersSlice';
export type { FiltersState } from './filtersSlice';

// Export sync actions
export {
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
} from './syncSlice';
export type { SyncState } from './syncSlice';

// Export UI actions
export {
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
} from './uiSlice';
export type { UIState, DragState } from './uiSlice';
