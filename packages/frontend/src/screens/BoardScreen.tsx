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
  setCurrentBoard,
  moveTask,
  reorderTasksInSection,
  setSectionOrder,
  reorderSections,
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
} from '@/store/selectors';
import { DraggableSectionList, SyncStatusIndicator } from '@/components';
import type { Task, Section } from '@kanban/shared';

interface BoardScreenProps {
  boardId: string;
  onBack?: () => void;
  onTaskPress?: (taskId: string) => void;
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
              <TextInput
                style={modalStyles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={endDate}
                onChangeText={setEndDate}
                editable={!isLoading}
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
}: BoardScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();

  const board = useAppSelector((state) => boardId ? selectBoardById(state, boardId) : null);
  const sections = useAppSelector((state) => boardId ? selectSectionsByBoardId(state, boardId) : []);
  const epics = useAppSelector((state) => boardId ? selectEpicsByBoardId(state, boardId) : []);
  const syncStatus = useAppSelector(selectSyncStatus);
  const hasActiveFilters = useAppSelector((state) => boardId ? selectHasActiveFilters(state, boardId) : false);
  const filteredCount = useAppSelector((state) => boardId ? selectFilteredTaskCount(state, boardId) : 0);
  const totalCount = useAppSelector((state) => boardId ? selectTotalTaskCount(state, boardId) : 0);

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

  /**
   * Fetch board data on mount
   */
  useEffect(() => {
    if (!boardId) {
      return;
    }
    dispatch(setCurrentBoard(boardId));
    // Fetch the board itself (needed when refreshing directly on board page)
    dispatch(fetchBoard(boardId));
    dispatch(fetchSections(boardId));
    dispatch(fetchTasks(boardId));
    dispatch(fetchEpics(boardId));

    return () => {
      dispatch(setCurrentBoard(null));
    };
  }, [dispatch, boardId]);

  /**
   * Handle task press
   */
  const handleTaskPress = useCallback(
    (taskId: string) => {
      if (onTaskPress) {
        onTaskPress(taskId);
      } else {
        console.log('Navigate to task:', taskId);
      }
    },
    [onTaskPress]
  );

  /**
   * Handle task reorder within a section (optimistic update)
   */
  const handleTaskReorder = useCallback(
    (sectionId: string, taskIds: string[]) => {
      // Optimistic update
      dispatch(reorderTasksInSection({ sectionId, taskIds }));

      // Find the task that was moved and its new position
      const tasks = tasksBySectionId[sectionId] || [];
      const oldTaskIds = tasks.map((t) => t.id);

      // Find which task moved
      for (let i = 0; i < taskIds.length; i++) {
        if (taskIds[i] !== oldTaskIds[i]) {
          const movedTaskId = taskIds[i];
          const task = tasks.find((t) => t.id === movedTaskId);
          if (task) {
            // Sync with backend
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
   * Handle section reorder (optimistic update)
   */
  const handleSectionReorder = useCallback(
    (sectionIds: string[]) => {
      // Optimistic update
      dispatch(setSectionOrder({ boardId, sectionOrder: sectionIds }));

      // Sync with backend
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

  if (!boardId || !board) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading board...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: board.color || '#6366f1' }]}>
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
          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={1}>
              {board.name}
            </Text>
            {hasActiveFilters && (
              <Text style={styles.filterInfo}>
                Showing {filteredCount} of {totalCount} tasks
              </Text>
            )}
          </View>
        </View>
        <SyncStatusIndicator status={syncStatus} />
      </View>

      {/* Board content */}
      {isLoading && sections.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading sections...</Text>
        </View>
      ) : (
        <View style={styles.boardContent}>
          <DraggableSectionList
            sections={sections}
            tasksBySectionId={tasksBySectionId}
            epics={epics}
            onTaskPress={handleTaskPress}
            onTaskReorder={handleTaskReorder}
            onSectionReorder={handleSectionReorder}
            onAddTask={handleAddTask}
            onAddSection={handleAddSection}
          />
        </View>
      )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  filterInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  boardContent: {
    flex: 1,
  },
});

export default BoardScreen;
