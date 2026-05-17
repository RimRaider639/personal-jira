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

interface CreateTaskModalProps {
  visible: boolean;
  sectionId: string | null;
  sectionName: string;
  onClose: () => void;
  onSubmit: (title: string, sectionId: string) => void;
  isLoading: boolean;
}

/**
 * CreateTaskModal - Modal for creating a new task
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
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (sectionId) {
      onSubmit(title.trim(), sectionId);
    }
  }, [title, sectionId, onSubmit]);

  const handleClose = useCallback(() => {
    setTitle('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Add Task to {sectionName}</Text>

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
    maxWidth: 400,
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

  const board = useAppSelector((state) => selectBoardById(state, boardId));
  const sections = useAppSelector((state) => selectSectionsByBoardId(state, boardId));
  const epics = useAppSelector((state) => selectEpicsByBoardId(state, boardId));
  const syncStatus = useAppSelector(selectSyncStatus);
  const hasActiveFilters = useAppSelector((state) => selectHasActiveFilters(state, boardId));
  const filteredCount = useAppSelector((state) => selectFilteredTaskCount(state, boardId));
  const totalCount = useAppSelector((state) => selectTotalTaskCount(state, boardId));

  const isLoading = useAppSelector((state) => state.sections.isLoading || state.tasks.isLoading);

  // Build tasks by section ID map
  const tasksBySectionId = useAppSelector((state) => {
    const result: Record<string, Task[]> = {};
    sections.forEach((section) => {
      result[section.id] = selectFilteredTasksBySectionId(state, section.id, boardId);
    });
    return result;
  });

  const [createTaskModal, setCreateTaskModal] = useState<{
    visible: boolean;
    sectionId: string | null;
    sectionName: string;
  }>({ visible: false, sectionId: null, sectionName: '' });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  /**
   * Fetch board data on mount
   */
  useEffect(() => {
    dispatch(setCurrentBoard(boardId));
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
    async (title: string, sectionId: string) => {
      setIsCreatingTask(true);
      try {
        await dispatch(createTask({ boardId, data: { title, sectionId } })).unwrap();
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
    Alert.prompt(
      'Add Section',
      'Enter section name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (name) => {
            if (name?.trim()) {
              dispatch(createSection({ boardId, name: name.trim() }));
            }
          },
        },
      ],
      'plain-text'
    );
  }, [dispatch, boardId]);

  if (!board) {
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
