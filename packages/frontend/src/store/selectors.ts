import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { Task, Section, Epic, FilterState, Priority } from '@kanban/shared';

// ==================== Basic Selectors ====================

/**
 * Select all boards as array
 */
export const selectAllBoards = (state: RootState) =>
  state.boards.allIds.map((id) => state.boards.byId[id]).filter(Boolean);

/**
 * Select current board
 */
export const selectCurrentBoard = (state: RootState) =>
  state.boards.currentBoardId ? state.boards.byId[state.boards.currentBoardId] : null;

/**
 * Select board by ID
 */
export const selectBoardById = (state: RootState, boardId: string) => state.boards.byId[boardId];

/**
 * Select sections for a board (sorted by position)
 */
export const selectSectionsByBoardId = createSelector(
  [(state: RootState) => state.sections.byId, (state: RootState) => state.sections.byBoardId, (_state: RootState, boardId: string) => boardId],
  (byId, byBoardId, boardId): Section[] => {
    const sectionIds = byBoardId[boardId] || [];
    return sectionIds
      .map((id) => byId[id])
      .filter(Boolean)
      .sort((a, b) => a.position - b.position);
  }
);

/**
 * Select tasks for a section (sorted by position)
 */
export const selectTasksBySectionId = createSelector(
  [(state: RootState) => state.tasks.byId, (state: RootState) => state.tasks.bySectionId, (_state: RootState, sectionId: string) => sectionId],
  (byId, bySectionId, sectionId): Task[] => {
    const taskIds = bySectionId[sectionId] || [];
    return taskIds
      .map((id) => byId[id])
      .filter(Boolean)
      .sort((a, b) => a.position - b.position);
  }
);

/**
 * Select all tasks for a board
 */
export const selectTasksByBoardId = createSelector(
  [(state: RootState) => state.tasks.byId, (state: RootState) => state.tasks.byBoardId, (_state: RootState, boardId: string) => boardId],
  (byId, byBoardId, boardId): Task[] => {
    const taskIds = byBoardId[boardId] || [];
    return taskIds.map((id) => byId[id]).filter(Boolean);
  }
);

/**
 * Select epics for a board
 */
export const selectEpicsByBoardId = createSelector(
  [(state: RootState) => state.epics.byId, (state: RootState) => state.epics.byBoardId, (_state: RootState, boardId: string) => boardId],
  (byId, byBoardId, boardId): Epic[] => {
    const epicIds = byBoardId[boardId] || [];
    return epicIds.map((id) => byId[id]).filter(Boolean);
  }
);

/**
 * Select epic by ID
 */
export const selectEpicById = (state: RootState, epicId: string) => state.epics.byId[epicId];

/**
 * Select all epics across all boards
 */
export const selectAllEpics = (state: RootState): Epic[] =>
  Object.values(state.epics.byId).filter(Boolean);

/**
 * Select all tasks across all boards
 */
export const selectAllTasks = (state: RootState): Task[] =>
  Object.values(state.tasks.byId).filter(Boolean);

/**
 * Select all sections across all boards
 */
export const selectAllSections = (state: RootState): Section[] =>
  Object.values(state.sections.byId).filter(Boolean);

/**
 * Select task by ID
 */
export const selectTaskById = (state: RootState, taskId: string) => state.tasks.byId[taskId];

/**
 * Select filter state for a board
 */
export const selectFiltersByBoardId = (state: RootState, boardId: string): FilterState =>
  state.filters.byBoardId[boardId] || {
    epicIds: [],
    priorities: [],
    dueDateFilter: null,
    searchQuery: '',
  };

// ==================== Filter Helper Functions ====================

/**
 * Check if a task matches epic filter (AND logic)
 */
const matchesEpicFilter = (task: Task, epicIds: string[]): boolean => {
  if (epicIds.length === 0) return true;
  // AND logic: task must have ALL selected epics
  return epicIds.every((epicId) => task.epicIds.includes(epicId));
};

/**
 * Check if a task matches priority filter (OR logic)
 */
const matchesPriorityFilter = (task: Task, priorities: Priority[]): boolean => {
  if (priorities.length === 0) return true;
  // OR logic: task must have ANY of the selected priorities
  return task.priority !== null && priorities.includes(task.priority);
};

/**
 * Check if a task matches due date filter
 */
const matchesDueDateFilter = (
  task: Task,
  dueDateFilter: FilterState['dueDateFilter']
): boolean => {
  if (!dueDateFilter || dueDateFilter === 'all') return true;
  if (!task.endDate) return false;

  const taskDate = new Date(task.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (dueDateFilter) {
    case 'today': {
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      return taskDate >= today && taskDate <= endOfToday;
    }
    case 'week': {
      // Current calendar week (Sunday to Saturday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    }
    case '7days': {
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);
      return taskDate >= today && taskDate <= sevenDaysLater;
    }
    case 'overdue': {
      return taskDate < today;
    }
    default:
      return true;
  }
};

/**
 * Check if a task matches search query
 */
const matchesSearchQuery = (task: Task, searchQuery: string): boolean => {
  if (!searchQuery.trim()) return true;
  const query = searchQuery.toLowerCase();
  return (
    task.title.toLowerCase().includes(query) ||
    (task.description?.toLowerCase().includes(query) ?? false)
  );
};

// ==================== Filtered Task Selectors ====================

/**
 * Select filtered tasks for a board (applies all filters with AND logic between filter types)
 */
export const selectFilteredTasksByBoardId = createSelector(
  [
    (state: RootState, boardId: string) => selectTasksByBoardId(state, boardId),
    (state: RootState, boardId: string) => selectFiltersByBoardId(state, boardId),
  ],
  (tasks, filters): Task[] => {
    return tasks.filter((task) => {
      // AND logic between different filter types
      return (
        matchesEpicFilter(task, filters.epicIds) &&
        matchesPriorityFilter(task, filters.priorities) &&
        matchesDueDateFilter(task, filters.dueDateFilter) &&
        matchesSearchQuery(task, filters.searchQuery)
      );
    });
  }
);

/**
 * Select filtered tasks for a section
 */
export const selectFilteredTasksBySectionId = createSelector(
  [
    (state: RootState, sectionId: string, boardId: string) =>
      selectTasksBySectionId(state, sectionId),
    (state: RootState, _sectionId: string, boardId: string) =>
      selectFiltersByBoardId(state, boardId),
  ],
  (tasks, filters): Task[] => {
    return tasks.filter((task) => {
      return (
        matchesEpicFilter(task, filters.epicIds) &&
        matchesPriorityFilter(task, filters.priorities) &&
        matchesDueDateFilter(task, filters.dueDateFilter) &&
        matchesSearchQuery(task, filters.searchQuery)
      );
    });
  }
);

/**
 * Select filtered task count for a board
 */
export const selectFilteredTaskCount = createSelector(
  [(state: RootState, boardId: string) => selectFilteredTasksByBoardId(state, boardId)],
  (tasks): number => tasks.length
);

/**
 * Select total task count for a board
 */
export const selectTotalTaskCount = createSelector(
  [(state: RootState, boardId: string) => selectTasksByBoardId(state, boardId)],
  (tasks): number => tasks.length
);

/**
 * Check if any filters are active for a board
 */
export const selectHasActiveFilters = createSelector(
  [(state: RootState, boardId: string) => selectFiltersByBoardId(state, boardId)],
  (filters): boolean => {
    return (
      filters.epicIds.length > 0 ||
      filters.priorities.length > 0 ||
      (filters.dueDateFilter !== null && filters.dueDateFilter !== 'all') ||
      filters.searchQuery.trim().length > 0
    );
  }
);

// ==================== Progress Selectors ====================

/**
 * Select board completion percentage
 * (tasks in "done" sections / total tasks) * 100
 */
export const selectBoardCompletionPercentage = createSelector(
  [
    (state: RootState, boardId: string) => selectTasksByBoardId(state, boardId),
    (state: RootState, boardId: string) => selectSectionsByBoardId(state, boardId),
  ],
  (tasks, sections): number => {
    if (tasks.length === 0) return 0;

    // Find "done" sections (case-insensitive match)
    const doneSectionIds = sections
      .filter((section) => section.name.toLowerCase() === 'done')
      .map((section) => section.id);

    const completedTasks = tasks.filter((task) => doneSectionIds.includes(task.sectionId));

    return Math.round((completedTasks.length / tasks.length) * 100);
  }
);

/**
 * Select epic completion status
 * An epic is complete if all its tasks are in "done" sections
 */
export const selectEpicCompletionStatus = createSelector(
  [
    (state: RootState, boardId: string, epicId: string) => selectTasksByBoardId(state, boardId),
    (state: RootState, boardId: string, _epicId: string) => selectSectionsByBoardId(state, boardId),
    (_state: RootState, _boardId: string, epicId: string) => epicId,
  ],
  (tasks, sections, epicId): { isComplete: boolean; completedCount: number; totalCount: number } => {
    // Find tasks with this epic
    const epicTasks = tasks.filter((task) => task.epicIds.includes(epicId));

    if (epicTasks.length === 0) {
      return { isComplete: false, completedCount: 0, totalCount: 0 };
    }

    // Find "done" sections
    const doneSectionIds = sections
      .filter((section) => section.name.toLowerCase() === 'done')
      .map((section) => section.id);

    const completedTasks = epicTasks.filter((task) => doneSectionIds.includes(task.sectionId));

    return {
      isComplete: completedTasks.length === epicTasks.length,
      completedCount: completedTasks.length,
      totalCount: epicTasks.length,
    };
  }
);

// ==================== Sync Selectors ====================

/**
 * Select sync status
 */
export const selectSyncStatus = (state: RootState) => state.sync.status;

/**
 * Select pending changes count
 */
export const selectPendingChangesCount = (state: RootState) => state.sync.pendingChanges;

/**
 * Select if currently syncing
 */
export const selectIsSyncing = (state: RootState) => state.sync.status === 'syncing';

/**
 * Select if offline
 */
export const selectIsOffline = (state: RootState) => state.sync.status === 'offline';

// ==================== UI Selectors ====================

/**
 * Select scroll position for a board
 */
export const selectScrollPosition = (state: RootState, boardId: string) =>
  state.ui.scrollPositions[boardId] || 0;

/**
 * Select if a task is expanded
 */
export const selectIsTaskExpanded = (state: RootState, taskId: string) =>
  state.ui.expandedTasks.includes(taskId);

/**
 * Select current drag state
 */
export const selectDragState = (state: RootState) => state.ui.dragState;

/**
 * Select if filter panel is open
 */
export const selectIsFilterPanelOpen = (state: RootState) => state.ui.isFilterPanelOpen;

// ==================== Auth Selectors ====================

/**
 * Select if user is authenticated
 */
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

/**
 * Select current user
 */
export const selectCurrentUser = (state: RootState) => state.auth.user;

/**
 * Select auth loading state
 */
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;

/**
 * Select auth error
 */
export const selectAuthError = (state: RootState) => state.auth.error;
