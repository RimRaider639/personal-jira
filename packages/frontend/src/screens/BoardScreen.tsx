import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchBoard,
  fetchSections,
  fetchTasks,
  fetchEpics,
  createSection,
  createTask,
  updateBoard,
  setCurrentBoard,
  moveTask,
  reorderTasksInSection,
  setSectionOrder,
  reorderSections,
  assignEpicToTask,
  removeEpicFromTask,
  toggleEpicFilter,
  togglePriorityFilter,
  setDueDateFilter,
  clearFilters,
} from '@/store/slices';
import {
  selectBoardById,
  selectSectionsByBoardId,
  selectFilteredTasksBySectionId,
  selectEpicsByBoardId,
  selectHasActiveFilters,
  selectFilteredTaskCount,
  selectTotalTaskCount,
  selectSyncStatus,
  selectFiltersByBoardId,
  selectTaskById,
} from '@/store/selectors';
import { DraggableSectionList, SyncStatusIndicator, ThemedBackground, BoardThemeSelector, DarkModeToggle, DatePicker, FilterPanel, TaskPreviewModal } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
import type { Task, Priority, DueDateFilter } from '@kanban/shared';

interface BoardScreenProps {
  boardId: string;
  onBack?: () => void;
  onTaskPress?: (taskId: string) => void;
  onEpicPress?: (epicId: string) => void;
}

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical' | null;
  storyPoints?: number;
  endDate?: string;
}

interface CreateTaskModalProps {
  visible: boolean;
  sectionId: string | null;
  sectionName: string;
  onClose: () => void;
  onSubmit: (data: CreateTaskData, sectionId: string) => void;
  isLoading: boolean;
}

interface CreateSectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

/**
 * CreateSectionModal - Modal for creating a new section
 */
function CreateSectionModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: CreateSectionModalProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError('Section name is required');
      return;
    }
    onSubmit(name.trim());
    setName('');
    setError('');
  }, [name, onSubmit]);

  const handleClose = useCallback(() => {
    setName('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Add Section</Text>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Section Name *</Text>
            <TextInput
              style={[modalStyles.input, error && modalStyles.inputError]}
              placeholder="Enter section name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              autoFocus
              editable={!isLoading}
            />
            {error && <Text style={modalStyles.errorText}>{error}</Text>}
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, isLoading && modalStyles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>Add Section</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface EditBoardModalProps {
  visible: boolean;
  boardName: string;
  boardDescription: string;
  boardColor: string;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string) => void;
  isLoading: boolean;
}

const BOARD_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

/**
 * EditBoardModal - Modal for editing board details
 */
function EditBoardModal({
  visible,
  boardName,
  boardDescription,
  boardColor,
  onClose,
  onSubmit,
  isLoading,
}: EditBoardModalProps): React.JSX.Element {
  const [name, setName] = useState(boardName);
  const [description, setDescription] = useState(boardDescription);
  const [color, setColor] = useState(boardColor);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(boardName);
    setDescription(boardDescription);
    setColor(boardColor);
    setError('');
  }, [boardName, boardDescription, boardColor, visible]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }
    onSubmit(name.trim(), description.trim(), color);
  }, [name, description, color, onSubmit]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Edit Board</Text>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Board Name *</Text>
            <TextInput
              style={[modalStyles.input, error && modalStyles.inputError]}
              placeholder="Enter board name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
              editable={!isLoading}
            />
            {error && <Text style={modalStyles.errorText}>{error}</Text>}
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Description</Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Enter description (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Color</Text>
            <View style={modalStyles.colorPicker}>
              {BOARD_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    modalStyles.colorOption,
                    { backgroundColor: c },
                    color === c && modalStyles.colorSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, { backgroundColor: color }, isLoading && modalStyles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * CreateTaskModal - Modal for creating a new task with all fields
 */
function CreateTaskModal({
  visible,
  sectionId,
  sectionName,
  onClose,
  onSubmit,
  isLoading,
}: CreateTaskModalProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical' | null>(null);
  const [storyPoints, setStoryPoints] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const PRIORITIES = [
    { value: 'critical' as const, label: 'Critical', color: '#dc2626' },
    { value: 'high' as const, label: 'High', color: '#f97316' },
    { value: 'medium' as const, label: 'Medium', color: '#eab308' },
    { value: 'low' as const, label: 'Low', color: '#22c55e' },
  ];

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (sectionId) {
      const data: CreateTaskData = {
        title: title.trim(),
      };
      if (description.trim()) {
        data.description = description.trim();
      }
      if (priority) {
        data.priority = priority;
      }
      if (storyPoints && !isNaN(parseInt(storyPoints, 10))) {
        data.storyPoints = parseInt(storyPoints, 10);
      }
      if (endDate) {
        data.endDate = endDate;
      }
      onSubmit(data, sectionId);
    }
  }, [title, description, priority, storyPoints, endDate, sectionId, onSubmit]);

  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setPriority(null);
    setStoryPoints('');
    setEndDate('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { maxHeight: '90%' }]}>
          <Text style={modalStyles.title}>Add Task to {sectionName}</Text>

          {/* Title */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Task Title *</Text>
            <TextInput
              style={[modalStyles.input, error && modalStyles.inputError]}
              placeholder="Enter task title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError('');
              }}
              autoFocus
              editable={!isLoading}
            />
            {error && <Text style={modalStyles.errorText}>{error}</Text>}
          </View>

          {/* Description */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Description</Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Enter description (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          {/* Priority */}
          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Priority</Text>
            <View style={modalStyles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    modalStyles.priorityButton,
                    priority === p.value && { backgroundColor: p.color + '20', borderColor: p.color },
                  ]}
                  onPress={() => setPriority(priority === p.value ? null : p.value)}
                  disabled={isLoading}
                >
                  <View style={[modalStyles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[modalStyles.priorityText, priority === p.value && { color: p.color }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Story Points and Due Date Row */}
          <View style={modalStyles.rowGroup}>
            <View style={[modalStyles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={modalStyles.label}>Story Points</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                value={storyPoints}
                onChangeText={setStoryPoints}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>
            <View style={[modalStyles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={modalStyles.label}>Due Date</Text>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Select date"
              />
            </View>
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, isLoading && modalStyles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>Add Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 13,
    color: '#374151',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

/**
 * BoardScreen - Displays a single board with sections and tasks.
 * Supports drag-and-drop for task reordering and section reordering.
 *
 * Requirements:
 * - 2.6: Enable section reordering via drag
 * - 2.7: Display sections as columns in the board view
 * - 4.3: Handle task reordering within section
 * - 4.4: Handle task movement between sections
 * - 4.5: Provide visual feedback during drag
 * - 15.9: Show sync status indicator
 */
export function BoardScreen({
  boardId,
  onBack,
  onTaskPress,
  onEpicPress,
}: BoardScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors, getEffectiveTheme, getBoardTheme } = useTheme();

  // Get board-specific theme if set
  const boardTheme = boardId ? getEffectiveTheme(boardId) : null;
  const effectiveColors = boardTheme?.colors || colors;

  const board = useAppSelector((state) => boardId ? selectBoardById(state, boardId) : null);
  const sections = useAppSelector((state) => boardId ? selectSectionsByBoardId(state, boardId) : []);
  const epics = useAppSelector((state) => boardId ? selectEpicsByBoardId(state, boardId) : []);
  const syncStatus = useAppSelector(selectSyncStatus);
  const hasActiveFilters = useAppSelector((state) => boardId ? selectHasActiveFilters(state, boardId) : false);
  const filteredCount = useAppSelector((state) => boardId ? selectFilteredTaskCount(state, boardId) : 0);
  const totalCount = useAppSelector((state) => boardId ? selectTotalTaskCount(state, boardId) : 0);
  const filters = useAppSelector((state) => boardId ? selectFiltersByBoardId(state, boardId) : { epicIds: [], priorities: [], dueDateFilter: null, searchQuery: '' });

  const isLoading = useAppSelector((state) => state.boards.isLoading || state.sections.isLoading || state.tasks.isLoading);

  // Build tasks by section ID map
  const tasksBySectionId = useAppSelector((state) => {
    if (!boardId) return {};
    const result: Record<string, Task[]> = {};
    sections.forEach((section) => {
      if (section?.id) {
        result[section.id] = selectFilteredTasksBySectionId(state, section.id, boardId);
      }
    });
    return result;
  });

  const [createTaskModal, setCreateTaskModal] = useState<{
    visible: boolean;
    sectionId: string | null;
    sectionName: string;
  }>({ visible: false, sectionId: null, sectionName: '' });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createSectionModalVisible, setCreateSectionModalVisible] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  
  // Edit board modal state
  const [editBoardModalVisible, setEditBoardModalVisible] = useState(false);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);
  
  // Filter panel state
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  
  // Task preview modal state
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [previewSectionName, setPreviewSectionName] = useState('');

  /**
   * Fetch board data on mount
   */
  useEffect(() => {
    if (!boardId) {
      return;
    }
    dispatch(setCurrentBoard(boardId));
    dispatch(fetchBoard(boardId));
    dispatch(fetchSections(boardId));
    dispatch(fetchTasks(boardId));
    dispatch(fetchEpics(boardId));

    return () => {
      dispatch(setCurrentBoard(null));
    };
  }, [dispatch, boardId]);

  /**
   * Handle task press - show preview modal first
   */
  const handleTaskPress = useCallback(
    (taskId: string) => {
      // Find the task and its section
      for (const [sectionId, tasks] of Object.entries(tasksBySectionId)) {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          const section = sections.find((s) => s.id === sectionId);
          setPreviewTask(task);
          setPreviewSectionName(section?.name || 'Unknown');
          return;
        }
      }
    },
    [tasksBySectionId, sections]
  );

  /**
   * Handle view full details from preview
   */
  const handleViewFullDetails = useCallback(() => {
    if (previewTask && onTaskPress) {
      onTaskPress(previewTask.id);
    }
    setPreviewTask(null);
  }, [previewTask, onTaskPress]);

  /**
   * Handle task reorder within a section (optimistic update)
   */
  const handleTaskReorder = useCallback(
    (sectionId: string, taskIds: string[]) => {
      dispatch(reorderTasksInSection({ sectionId, taskIds }));

      const tasks = tasksBySectionId[sectionId] || [];
      const oldTaskIds = tasks.map((t) => t.id);

      for (let i = 0; i < taskIds.length; i++) {
        if (taskIds[i] !== oldTaskIds[i]) {
          const movedTaskId = taskIds[i];
          const task = tasks.find((t) => t.id === movedTaskId);
          if (task) {
            dispatch(
              moveTask({
                taskId: movedTaskId,
                oldSectionId: sectionId,
                data: { sectionId, position: i },
              })
            );
          }
          break;
        }
      }
    },
    [dispatch, tasksBySectionId]
  );

  /**
   * Handle moving task to a different section via quick menu
   */
  const handleMoveTask = useCallback(
    (taskId: string, newSectionId: string) => {
      let oldSectionId: string | null = null;
      for (const [sectionId, tasks] of Object.entries(tasksBySectionId)) {
        if (tasks.some((t) => t.id === taskId)) {
          oldSectionId = sectionId;
          break;
        }
      }

      if (oldSectionId && oldSectionId !== newSectionId) {
        dispatch(
          moveTask({
            taskId,
            oldSectionId,
            data: { sectionId: newSectionId, position: 0 },
          })
        );
      }
    },
    [dispatch, tasksBySectionId]
  );

  /**
   * Handle toggling epic on a task
   */
  const handleToggleEpic = useCallback(
    async (taskId: string, epicId: string) => {
      // Find the task to check if epic is already assigned
      let task: Task | undefined;
      for (const tasks of Object.values(tasksBySectionId)) {
        task = tasks.find((t) => t.id === taskId);
        if (task) break;
      }

      if (!task) return;

      try {
        if (task.epicIds.includes(epicId)) {
          await dispatch(removeEpicFromTask({ taskId, epicId })).unwrap();
        } else {
          await dispatch(assignEpicToTask({ taskId, epicId })).unwrap();
        }
      } catch {
        Alert.alert('Error', 'Failed to update epic assignment');
      }
    },
    [dispatch, tasksBySectionId]
  );

  /**
   * Handle section reorder (optimistic update)
   */
  const handleSectionReorder = useCallback(
    (sectionIds: string[]) => {
      dispatch(setSectionOrder({ boardId, sectionOrder: sectionIds }));
      dispatch(reorderSections({ boardId, sectionOrder: sectionIds }));
    },
    [dispatch, boardId]
  );

  /**
   * Handle add task button press
   */
  const handleAddTask = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      setCreateTaskModal({
        visible: true,
        sectionId,
        sectionName: section?.name || 'Section',
      });
    },
    [sections]
  );

  /**
   * Handle create task
   */
  const handleCreateTask = useCallback(
    async (data: CreateTaskData, sectionId: string) => {
      setIsCreatingTask(true);
      try {
        await dispatch(createTask({ 
          boardId, 
          data: { 
            title: data.title,
            sectionId,
            description: data.description,
            priority: data.priority ?? undefined,
            storyPoints: data.storyPoints,
            endDate: data.endDate,
          } 
        })).unwrap();
        setCreateTaskModal({ visible: false, sectionId: null, sectionName: '' });
      } catch {
        Alert.alert('Error', 'Failed to create task. Please try again.');
      } finally {
        setIsCreatingTask(false);
      }
    },
    [dispatch, boardId]
  );

  /**
   * Handle add section
   */
  const handleAddSection = useCallback(() => {
    setCreateSectionModalVisible(true);
  }, []);

  /**
   * Handle create section
   */
  const handleCreateSection = useCallback(
    async (name: string) => {
      setIsCreatingSection(true);
      try {
        await dispatch(createSection({ boardId, name })).unwrap();
        setCreateSectionModalVisible(false);
      } catch {
        Alert.alert('Error', 'Failed to create section. Please try again.');
      } finally {
        setIsCreatingSection(false);
      }
    },
    [dispatch, boardId]
  );

  /**
   * Handle update board
   */
  const handleUpdateBoard = useCallback(
    async (name: string, description: string, color: string) => {
      setIsUpdatingBoard(true);
      try {
        await dispatch(updateBoard({ id: boardId, data: { name, description: description || undefined, color } })).unwrap();
        setEditBoardModalVisible(false);
      } catch {
        Alert.alert('Error', 'Failed to update board. Please try again.');
      } finally {
        setIsUpdatingBoard(false);
      }
    },
    [dispatch, boardId]
  );

  /**
   * Filter handlers
   */
  const handleToggleEpicFilter = useCallback(
    (epicId: string) => {
      dispatch(toggleEpicFilter({ boardId, epicId }));
    },
    [dispatch, boardId]
  );

  const handleTogglePriorityFilter = useCallback(
    (priority: Priority) => {
      dispatch(togglePriorityFilter({ boardId, priority }));
    },
    [dispatch, boardId]
  );

  const handleSetDueDateFilter = useCallback(
    (dueDateFilter: DueDateFilter | null) => {
      dispatch(setDueDateFilter({ boardId, dueDateFilter }));
    },
    [dispatch, boardId]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters(boardId));
  }, [dispatch, boardId]);

  if (!boardId || !board) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: effectiveColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={effectiveColors.primary} />
          <Text style={[styles.loadingText, { color: effectiveColors.textSecondary }]}>Loading board...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ThemedBackground boardId={boardId}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: board.color || effectiveColors.primary }]}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.headerContent}
              onPress={() => setEditBoardModalVisible(true)}
            >
              <Text style={styles.title} numberOfLines={1}>
                {board.name}
              </Text>
              <Text style={styles.editHint}>Tap to edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            {/* Filter Button */}
            <TouchableOpacity 
              style={[styles.headerIconButton, hasActiveFilters && styles.headerIconButtonActive]} 
              onPress={() => setFilterPanelVisible(true)}
              accessibilityLabel={hasActiveFilters ? `Filters active, ${filteredCount} of ${totalCount} tasks` : 'Open filters'}
            >
              <Text style={styles.headerIconText}>⚙️</Text>
              {hasActiveFilters && <View style={styles.filterActiveDot} />}
            </TouchableOpacity>
            <DarkModeToggle />
            <BoardThemeSelector boardId={boardId} />
            <SyncStatusIndicator status={syncStatus} />
          </View>
        </View>

        {/* Filter count indicator (only when filters active) */}
        {hasActiveFilters && (
          <View style={[styles.filterIndicator, { backgroundColor: effectiveColors.primaryLight }]}>
            <Text style={[styles.filterIndicatorText, { color: effectiveColors.primary }]}>
              Showing {filteredCount} of {totalCount} tasks
            </Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={[styles.clearFiltersText, { color: effectiveColors.error }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Board content */}
        {isLoading && sections.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={effectiveColors.primary} />
            <Text style={[styles.loadingText, { color: effectiveColors.textSecondary }]}>Loading sections...</Text>
          </View>
        ) : (
          <View style={styles.boardContent}>
            <DraggableSectionList
              sections={sections}
              tasksBySectionId={tasksBySectionId}
              epics={epics}
              onTaskPress={handleTaskPress}
              onTaskReorder={handleTaskReorder}
              onMoveTask={handleMoveTask}
              onToggleEpic={handleToggleEpic}
              onEpicPress={onEpicPress}
              onSectionReorder={handleSectionReorder}
              onAddTask={handleAddTask}
              onAddSection={handleAddSection}
            />
          </View>
        )}

        {/* Task Preview Modal */}
        <TaskPreviewModal
          visible={previewTask !== null}
          task={previewTask}
          epics={epics}
          sectionName={previewSectionName}
          onClose={() => setPreviewTask(null)}
          onViewDetails={handleViewFullDetails}
        />

        {/* Filter Panel */}
        <FilterPanel
          visible={filterPanelVisible}
          onClose={() => setFilterPanelVisible(false)}
          epics={epics}
          selectedEpicIds={filters.epicIds}
          onToggleEpic={handleToggleEpicFilter}
          selectedPriorities={filters.priorities}
          onTogglePriority={handleTogglePriorityFilter}
          selectedDueDateFilter={filters.dueDateFilter}
          onSetDueDateFilter={handleSetDueDateFilter}
          onClearAll={handleClearFilters}
        />

        {/* Create Task Modal */}
        <CreateTaskModal
          visible={createTaskModal.visible}
          sectionId={createTaskModal.sectionId}
          sectionName={createTaskModal.sectionName}
          onClose={() => setCreateTaskModal({ visible: false, sectionId: null, sectionName: '' })}
          onSubmit={handleCreateTask}
          isLoading={isCreatingTask}
        />

        {/* Create Section Modal */}
        <CreateSectionModal
          visible={createSectionModalVisible}
          onClose={() => setCreateSectionModalVisible(false)}
          onSubmit={handleCreateSection}
          isLoading={isCreatingSection}
        />

        {/* Edit Board Modal */}
        <EditBoardModal
          visible={editBoardModalVisible}
          boardName={board.name}
          boardDescription={board.description || ''}
          boardColor={board.color || '#6366f1'}
          onClose={() => setEditBoardModalVisible(false)}
          onSubmit={handleUpdateBoard}
          isLoading={isUpdatingBoard}
        />
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginRight: 8,
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIconButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerIconText: {
    fontSize: 18,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  themeSelectorWrapper: {
    marginLeft: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  boardContent: {
    flex: 1,
  },
});

export default BoardScreen;
