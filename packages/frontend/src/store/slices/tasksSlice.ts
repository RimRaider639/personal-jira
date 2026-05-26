import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Task, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from '@kanban/shared';
import { apiClient } from '@/services/api';

/**
 * Tasks state interface with normalized structure
 */
export interface TasksState {
  byId: Record<string, Task>;
  bySectionId: Record<string, string[]>;
  byBoardId: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial tasks state
 */
const initialState: TasksState = {
  byId: {},
  bySectionId: {},
  byBoardId: {},
  isLoading: false,
  error: null,
};

/**
 * Async thunk for fetching tasks for a board
 */
export const fetchTasks = createAsyncThunk<
  { boardId: string; tasks: Task[] },
  string,
  { rejectValue: string }
>('tasks/fetchByBoard', async (boardId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Task[] }>(`/boards/${boardId}/tasks`);
    return { boardId, tasks: response.data.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching all tasks for the user (across all boards)
 */
export const fetchAllTasks = createAsyncThunk<
  Task[],
  void,
  { rejectValue: string }
>('tasks/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Task[] }>('/tasks');
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching pinned tasks
 */
export const fetchPinnedTasks = createAsyncThunk<
  Task[],
  void,
  { rejectValue: string }
>('tasks/fetchPinned', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ data: Task[] }>('/tasks/pinned');
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pinned tasks';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for toggling task pin status
 */
export const toggleTaskPin = createAsyncThunk<
  Task,
  string,
  { rejectValue: string }
>('tasks/togglePin', async (taskId, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Task }>(`/tasks/${taskId}/pin`);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle pin status';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for reordering pinned tasks
 */
export const reorderPinnedTasks = createAsyncThunk<
  Task[],
  string[],
  { rejectValue: string }
>('tasks/reorderPinned', async (taskIds, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Task[] }>('/tasks/pinned/reorder', { taskIds });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder pinned tasks';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for fetching a single task
 */
export const fetchTask = createAsyncThunk<Task, string, { rejectValue: string }>(
  'tasks/fetchOne',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ data: Task }>(`/tasks/${taskId}`);
      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch task';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for creating a task
 */
export const createTask = createAsyncThunk<
  Task,
  { boardId: string; data: CreateTaskRequest },
  { rejectValue: string }
>('tasks/create', async ({ boardId, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Task }>(`/boards/${boardId}/tasks`, data);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for updating a task
 */
export const updateTask = createAsyncThunk<
  Task,
  { id: string; data: UpdateTaskRequest },
  { rejectValue: string }
>('tasks/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Task }>(`/tasks/${id}`, data);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for deleting a task
 */
export const deleteTask = createAsyncThunk<
  { taskId: string; sectionId: string; boardId: string },
  { taskId: string; sectionId: string; boardId: string },
  { rejectValue: string }
>('tasks/delete', async ({ taskId, sectionId, boardId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/tasks/${taskId}`);
    return { taskId, sectionId, boardId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for moving a task
 */
export const moveTask = createAsyncThunk<
  { task: Task; oldSectionId: string },
  { taskId: string; oldSectionId: string; data: MoveTaskRequest },
  { rejectValue: string }
>('tasks/move', async ({ taskId, oldSectionId, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Task }>(`/tasks/${taskId}/move`, data);
    return { task: response.data.data, oldSectionId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move task';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for assigning an epic to a task
 */
export const assignEpicToTask = createAsyncThunk<
  Task,
  { taskId: string; epicId: string },
  { rejectValue: string }
>('tasks/assignEpic', async ({ taskId, epicId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Task }>(`/tasks/${taskId}/epics`, { epicId });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign epic';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for removing an epic from a task
 */
export const removeEpicFromTask = createAsyncThunk<
  Task,
  { taskId: string; epicId: string },
  { rejectValue: string }
>('tasks/removeEpic', async ({ taskId, epicId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.delete<{ data: Task }>(`/tasks/${taskId}/epics/${epicId}`);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove epic';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for uploading an attachment to a task
 */
export const uploadAttachment = createAsyncThunk<
  Task,
  { taskId: string; file: File },
  { rejectValue: string }
>('tasks/uploadAttachment', async ({ taskId, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use the upload method which doesn't set Content-Type (browser sets it with boundary)
    await apiClient.upload<{ data: { id: string } }>(
      `/tasks/${taskId}/attachments`,
      formData
    );
    
    // Fetch the updated task to get the full attachment data
    const taskResponse = await apiClient.get<{ data: Task }>(`/tasks/${taskId}`);
    return taskResponse.data.data;
  } catch (error) {
    console.error('Upload attachment error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload attachment';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for deleting an attachment from a task
 */
export const deleteAttachment = createAsyncThunk<
  { taskId: string; attachmentId: string },
  { taskId: string; attachmentId: string },
  { rejectValue: string }
>('tasks/deleteAttachment', async ({ taskId, attachmentId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/attachments/${attachmentId}`);
    return { taskId, attachmentId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete attachment';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for adding a comment to a task
 */
export const addComment = createAsyncThunk<
  Task,
  { taskId: string; content: string },
  { rejectValue: string }
>('tasks/addComment', async ({ taskId, content }, { rejectWithValue }) => {
  try {
    // Add the comment
    await apiClient.post<{ data: { id: string } }>(`/tasks/${taskId}/comments`, { content });
    
    // Fetch the updated task to get the full task with new comment
    const taskResponse = await apiClient.get<{ data: Task }>(`/tasks/${taskId}`);
    return taskResponse.data.data;
  } catch (error) {
    console.error('Add comment error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for deleting a comment from a task
 */
export const deleteComment = createAsyncThunk<
  Task,
  { taskId: string; commentId: string },
  { rejectValue: string }
>('tasks/deleteComment', async ({ taskId, commentId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.delete<{ data: Task }>(`/tasks/${taskId}/comments/${commentId}`);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete comment';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for adding a dependency to a task
 */
export const addDependency = createAsyncThunk<
  Task,
  { taskId: string; dependentTaskId: string },
  { rejectValue: string }
>('tasks/addDependency', async ({ taskId, dependentTaskId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Task }>(`/tasks/${taskId}/dependencies`, { dependentTaskId });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add dependency';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for removing a dependency from a task
 */
export const removeDependency = createAsyncThunk<
  Task,
  { taskId: string; dependentTaskId: string },
  { rejectValue: string }
>('tasks/removeDependency', async ({ taskId, dependentTaskId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.delete<{ data: Task }>(`/tasks/${taskId}/dependencies/${dependentTaskId}`);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove dependency';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for quick section change (status change)
 */
export const changeTaskSection = createAsyncThunk<
  Task,
  { taskId: string; sectionId: string; oldSectionId: string },
  { rejectValue: string }
>('tasks/changeSection', async ({ taskId, sectionId }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put<{ data: Task }>(`/tasks/${taskId}/section`, { sectionId });
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change task section';
    return rejectWithValue(message);
  }
});

/**
 * Async thunk for cloning a task
 */
export const cloneTask = createAsyncThunk<
  Task,
  string,
  { rejectValue: string }
>('tasks/clone', async (taskId, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: Task }>(`/tasks/${taskId}/clone`);
    return response.data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clone task';
    return rejectWithValue(message);
  }
});

/**
 * Helper to add task to indexes
 * Preserves isPinned and pinnedPosition - always keeps the "pinned" state if either existing or new task is pinned
 */
const addTaskToIndexes = (state: TasksState, task: Task) => {
  const existingTask = state.byId[task.id];
  
  // Merge isPinned status - if either existing or new task is pinned, keep it pinned
  // This handles race conditions between fetchAllTasks and fetchPinnedTasks
  if (existingTask) {
    const shouldBePinned = existingTask.isPinned || task.isPinned;
    const pinnedPosition = task.isPinned ? task.pinnedPosition : (existingTask.isPinned ? existingTask.pinnedPosition : 0);
    state.byId[task.id] = { ...task, isPinned: shouldBePinned, pinnedPosition };
  } else {
    state.byId[task.id] = task;
  }

  // Add to bySectionId
  if (!state.bySectionId[task.sectionId]) {
    state.bySectionId[task.sectionId] = [];
  }
  if (!state.bySectionId[task.sectionId].includes(task.id)) {
    state.bySectionId[task.sectionId].push(task.id);
  }

  // Add to byBoardId
  if (!state.byBoardId[task.boardId]) {
    state.byBoardId[task.boardId] = [];
  }
  if (!state.byBoardId[task.boardId].includes(task.id)) {
    state.byBoardId[task.boardId].push(task.id);
  }
};

/**
 * Helper to remove task from indexes
 */
const removeTaskFromIndexes = (
  state: TasksState,
  taskId: string,
  sectionId: string,
  boardId: string
) => {
  delete state.byId[taskId];

  if (state.bySectionId[sectionId]) {
    state.bySectionId[sectionId] = state.bySectionId[sectionId].filter((id) => id !== taskId);
  }

  if (state.byBoardId[boardId]) {
    state.byBoardId[boardId] = state.byBoardId[boardId].filter((id) => id !== taskId);
  }
};

/**
 * Tasks slice
 */
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    /**
     * Clear any task errors
     */
    clearError: (state) => {
      state.error = null;
    },
    /**
     * Add or update a task (for real-time updates)
     */
    upsertTask: (state, action: PayloadAction<Task>) => {
      const task = action.payload;
      const existingTask = state.byId[task.id];

      // If task exists and section changed, update indexes
      if (existingTask && existingTask.sectionId !== task.sectionId) {
        // Remove from old section
        if (state.bySectionId[existingTask.sectionId]) {
          state.bySectionId[existingTask.sectionId] = state.bySectionId[
            existingTask.sectionId
          ].filter((id) => id !== task.id);
        }
      }

      addTaskToIndexes(state, task);
    },
    /**
     * Remove a task (for real-time updates)
     */
    removeTask: (
      state,
      action: PayloadAction<{ taskId: string; sectionId: string; boardId: string }>
    ) => {
      const { taskId, sectionId, boardId } = action.payload;
      removeTaskFromIndexes(state, taskId, sectionId, boardId);
    },
    /**
     * Update task position within section (optimistic update for drag-drop)
     */
    reorderTasksInSection: (
      state,
      action: PayloadAction<{ sectionId: string; taskIds: string[] }>
    ) => {
      const { sectionId, taskIds } = action.payload;
      state.bySectionId[sectionId] = taskIds;

      // Update positions
      taskIds.forEach((taskId, index) => {
        if (state.byId[taskId]) {
          state.byId[taskId].position = index;
        }
      });
    },
    /**
     * Clear tasks for a section (when section is deleted)
     */
    clearSectionTasks: (state, action: PayloadAction<{ sectionId: string; boardId: string }>) => {
      const { sectionId, boardId } = action.payload;
      const taskIds = state.bySectionId[sectionId] || [];

      taskIds.forEach((taskId) => {
        delete state.byId[taskId];
        if (state.byBoardId[boardId]) {
          state.byBoardId[boardId] = state.byBoardId[boardId].filter((id) => id !== taskId);
        }
      });

      delete state.bySectionId[sectionId];
    },
    /**
     * Clear tasks for a board (when board is deleted)
     */
    clearBoardTasks: (state, action: PayloadAction<string>) => {
      const boardId = action.payload;
      const taskIds = state.byBoardId[boardId] || [];

      taskIds.forEach((taskId) => {
        const task = state.byId[taskId];
        if (task) {
          if (state.bySectionId[task.sectionId]) {
            state.bySectionId[task.sectionId] = state.bySectionId[task.sectionId].filter(
              (id) => id !== taskId
            );
          }
        }
        delete state.byId[taskId];
      });

      delete state.byBoardId[boardId];
    },
    /**
     * Reset tasks state
     */
    resetTasks: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch tasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        const { boardId, tasks } = action.payload;

        // Create a set of new task IDs for quick lookup
        const newTaskIds = new Set(tasks.map(t => t.id));
        
        // Get existing task IDs for this board
        const existingIds = state.byBoardId[boardId] || [];
        
        // Remove tasks that no longer exist in the response
        existingIds.forEach((taskId) => {
          if (!newTaskIds.has(taskId)) {
            const task = state.byId[taskId];
            if (task && state.bySectionId[task.sectionId]) {
              state.bySectionId[task.sectionId] = state.bySectionId[task.sectionId].filter(
                (id) => id !== taskId
              );
            }
            delete state.byId[taskId];
          }
        });

        // Update or add tasks from the response
        state.byBoardId[boardId] = [];
        tasks.forEach((task) => {
          addTaskToIndexes(state, task);
        });
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch tasks';
      });

    // Fetch all tasks (across all boards)
    builder
      .addCase(fetchAllTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        const tasks = action.payload;

        // Add all tasks to the store
        tasks.forEach((task) => {
          addTaskToIndexes(state, task);
        });
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch tasks';
      });

    // Fetch single task
    builder
      .addCase(fetchTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.isLoading = false;
        addTaskToIndexes(state, action.payload);
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch task';
      });

    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        addTaskToIndexes(state, action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create task';
      });

    // Update task
    builder
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update task';
      });

    // Delete task
    builder
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskId, sectionId, boardId } = action.payload;
        removeTaskFromIndexes(state, taskId, sectionId, boardId);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete task';
      });

    // Move task
    builder
      .addCase(moveTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(moveTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const { task, oldSectionId } = action.payload;

        // Remove from old section
        if (state.bySectionId[oldSectionId]) {
          state.bySectionId[oldSectionId] = state.bySectionId[oldSectionId].filter(
            (id) => id !== task.id
          );
        }

        // Add to new section
        if (!state.bySectionId[task.sectionId]) {
          state.bySectionId[task.sectionId] = [];
        }
        if (!state.bySectionId[task.sectionId].includes(task.id)) {
          state.bySectionId[task.sectionId].push(task.id);
        }

        // Update task
        state.byId[task.id] = task;
      })
      .addCase(moveTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to move task';
      });

    // Assign epic
    builder
      .addCase(assignEpicToTask.fulfilled, (state, action) => {
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(assignEpicToTask.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to assign epic';
      });

    // Remove epic
    builder
      .addCase(removeEpicFromTask.fulfilled, (state, action) => {
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(removeEpicFromTask.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to remove epic';
      });

    // Upload attachment
    builder
      .addCase(uploadAttachment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAttachment.fulfilled, (state, action) => {
        state.isLoading = false;
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(uploadAttachment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to upload attachment';
      });

    // Delete attachment
    builder
      .addCase(deleteAttachment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskId, attachmentId } = action.payload;
        const task = state.byId[taskId];
        if (task) {
          task.attachments = task.attachments.filter((a) => a.id !== attachmentId);
        }
      })
      .addCase(deleteAttachment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete attachment';
      });

    // Add comment
    builder
      .addCase(addComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.isLoading = false;
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to add comment';
      });

    // Delete comment
    builder
      .addCase(deleteComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.isLoading = false;
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to delete comment';
      });

    // Add dependency
    builder
      .addCase(addDependency.fulfilled, (state, action) => {
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(addDependency.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to add dependency';
      });

    // Remove dependency
    builder
      .addCase(removeDependency.fulfilled, (state, action) => {
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(removeDependency.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to remove dependency';
      });

    // Change task section (quick status change)
    builder
      .addCase(changeTaskSection.fulfilled, (state, action) => {
        const task = action.payload;
        const existingTask = state.byId[task.id];
        
        // Remove from old section
        if (existingTask && existingTask.sectionId !== task.sectionId) {
          if (state.bySectionId[existingTask.sectionId]) {
            state.bySectionId[existingTask.sectionId] = state.bySectionId[existingTask.sectionId].filter(
              (id) => id !== task.id
            );
          }
        }
        
        // Add to new section
        if (!state.bySectionId[task.sectionId]) {
          state.bySectionId[task.sectionId] = [];
        }
        if (!state.bySectionId[task.sectionId].includes(task.id)) {
          state.bySectionId[task.sectionId].push(task.id);
        }
        
        state.byId[task.id] = task;
      })
      .addCase(changeTaskSection.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to change task section';
      });

    // Fetch pinned tasks
    builder
      .addCase(fetchPinnedTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPinnedTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add pinned tasks to the store
        action.payload.forEach((task) => {
          addTaskToIndexes(state, task);
        });
      })
      .addCase(fetchPinnedTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch pinned tasks';
      });

    // Toggle task pin
    builder
      .addCase(toggleTaskPin.fulfilled, (state, action) => {
        const task = action.payload;
        state.byId[task.id] = task;
      })
      .addCase(toggleTaskPin.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to toggle pin status';
      });

    // Reorder pinned tasks
    builder
      .addCase(reorderPinnedTasks.fulfilled, (state, action) => {
        // Update all pinned tasks with new positions
        action.payload.forEach((task) => {
          state.byId[task.id] = task;
        });
      })
      .addCase(reorderPinnedTasks.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to reorder pinned tasks';
      });

    // Clone task
    builder
      .addCase(cloneTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cloneTask.fulfilled, (state, action) => {
        state.isLoading = false;
        addTaskToIndexes(state, action.payload);
      })
      .addCase(cloneTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to clone task';
      });
  },
});

export const {
  clearError,
  upsertTask,
  removeTask,
  reorderTasksInSection,
  clearSectionTasks,
  clearBoardTasks,
  resetTasks,
} = tasksSlice.actions;
export default tasksSlice.reducer;
