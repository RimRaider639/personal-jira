import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HiOutlineBookmark } from 'react-icons/hi';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchTask,
  fetchSections,
  fetchEpics,
  fetchTasks,
  updateTask,
  deleteTask,
  assignEpicToTask,
  removeEpicFromTask,
  uploadAttachment,
  deleteAttachment,
  addComment,
  deleteComment,
  moveTask,
  addDependency,
  removeDependency,
  toggleTaskPin,
} from '@/store/slices';
import { selectTaskById, selectEpicsByBoardId, selectSectionsByBoardId, selectTasksByBoardId } from '@/store/selectors';
import { DatePicker } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
import type { Priority, Epic, Task } from '@kanban/shared';

interface TaskDetailScreenProps {
  taskId: string;
  boardId: string;
  onBack?: () => void;
  onDelete?: () => void;
  onEpicPress?: (epicId: string) => void;
  onTaskPress?: (taskId: string, boardId: string) => void;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#22c55e' },
];

/**
 * TaskDetailScreen - Displays and allows editing of task details
 *
 * Requirements:
 * - 4.1: Display all task properties
 * - 4.2: Implement inline editing for all fields
 * - 5.3, 5.4, 5.5, 5.6: Epic assignment
 * - 6.1-6.5: Comments
 */
export function TaskDetailScreen({
  taskId,
  boardId,
  onBack,
  onDelete,
  onEpicPress,
  onTaskPress,
}: TaskDetailScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();

  const task = useAppSelector((state) => selectTaskById(state, taskId));
  // Use board-specific epics since epics are scoped to boards in the backend
  const epics = useAppSelector((state) => selectEpicsByBoardId(state, boardId));
  const sections = useAppSelector((state) => selectSectionsByBoardId(state, boardId));
  const allBoardTasks = useAppSelector((state) => selectTasksByBoardId(state, boardId));
  const isLoading = useAppSelector((state) => state.tasks.isLoading);
  const taskError = useAppSelector((state) => state.tasks.error);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority | null>(null);
  const [editStoryPoints, setEditStoryPoints] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Attachment state
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Epic selector state
  const [showEpicSelector, setShowEpicSelector] = useState(false);
  
  // Section selector state (for moving tasks)
  const [showSectionSelector, setShowSectionSelector] = useState(false);

  // Dependency selector state
  const [showDependencySelector, setShowDependencySelector] = useState(false);
  const [addingDependencyId, setAddingDependencyId] = useState<string | null>(null);

  // Get dependent tasks
  const dependentTasks = useMemo(() => {
    if (!task?.dependentTaskIds || task.dependentTaskIds.length === 0) return [];
    return allBoardTasks.filter(t => task.dependentTaskIds.includes(t.id));
  }, [task, allBoardTasks]);

  // Get available tasks for dependency (exclude self and already dependent)
  const availableTasksForDependency = useMemo(() => {
    if (!task) return [];
    return allBoardTasks.filter(t => 
      t.id !== task.id && 
      !task.dependentTaskIds?.includes(t.id)
    );
  }, [task, allBoardTasks]);

  useEffect(() => {
    dispatch(fetchTask(taskId));
    // Fetch sections, epics, and tasks for the board (needed for move, epic assignment, and dependencies)
    if (boardId) {
      dispatch(fetchSections(boardId));
      dispatch(fetchEpics(boardId));
      dispatch(fetchTasks(boardId));
    }
  }, [dispatch, taskId, boardId]);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditPriority(task.priority);
      setEditStoryPoints(task.storyPoints?.toString() || '');
      setEditEndDate(task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '');
    }
  }, [task]);

  const handleSave = useCallback(async () => {
    if (!task || !editTitle.trim()) return;

    setIsSaving(true);
    try {
      await dispatch(
        updateTask({
          id: taskId,
          data: {
            title: editTitle.trim(),
            description: editDescription.trim() || undefined,
            priority: editPriority,
            storyPoints: editStoryPoints ? parseInt(editStoryPoints, 10) : undefined,
            endDate: editEndDate || undefined,
          },
        })
      ).unwrap();
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, taskId, task, editTitle, editDescription, editPriority, editStoryPoints, editEndDate]);

  const handleDelete = useCallback(async () => {
    if (!task) return;

    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(
              deleteTask({
                taskId,
                sectionId: task.sectionId,
                boardId: task.boardId,
              })
            ).unwrap();
            onDelete?.();
            onBack?.();
          } catch {
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  }, [dispatch, taskId, task, onDelete, onBack]);

  const handleToggleEpic = useCallback(
    async (epicId: string) => {
      if (!task) return;

      const isAssigned = task.epicIds.includes(epicId);
      try {
        if (isAssigned) {
          await dispatch(removeEpicFromTask({ taskId, epicId })).unwrap();
        } else {
          await dispatch(assignEpicToTask({ taskId, epicId })).unwrap();
        }
      } catch {
        Alert.alert('Error', `Failed to ${isAssigned ? 'remove' : 'assign'} epic`);
      }
    },
    [dispatch, taskId, task]
  );

  // Handle file upload (web only)
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploadingAttachment(true);
      setUploadError(null);
      try {
        await dispatch(uploadAttachment({ taskId, file })).unwrap();
        Alert.alert('Success', 'Attachment uploaded successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload attachment';
        setUploadError(errorMessage);
        Alert.alert('Error', errorMessage);
        console.error('Upload error:', error);
      } finally {
        setIsUploadingAttachment(false);
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [dispatch, taskId]
  );

  const handleAddAttachment = useCallback(() => {
    setUploadError(null);
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      Alert.alert('Info', 'File upload is only available on web');
    }
  }, []);

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      Alert.alert('Delete Attachment', 'Are you sure you want to delete this attachment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteAttachment({ taskId, attachmentId })).unwrap();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete attachment';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]);
    },
    [dispatch, taskId]
  );

  const handleOpenAttachment = useCallback((url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      await dispatch(addComment({ taskId, content: newComment.trim() })).unwrap();
      setNewComment('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsAddingComment(false);
    }
  }, [dispatch, taskId, newComment]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteComment({ taskId, commentId })).unwrap();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]);
    },
    [dispatch, taskId]
  );

  // Handle moving task to a different section
  const handleMoveToSection = useCallback(
    async (newSectionId: string) => {
      if (!task || task.sectionId === newSectionId) {
        setShowSectionSelector(false);
        return;
      }

      try {
        await dispatch(
          moveTask({
            taskId,
            oldSectionId: task.sectionId,
            data: { sectionId: newSectionId, position: 0 },
          })
        ).unwrap();
        setShowSectionSelector(false);
        Alert.alert('Success', 'Task moved successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
        Alert.alert('Error', errorMessage);
      }
    },
    [dispatch, taskId, task]
  );

  // Handle adding a dependency
  const handleAddDependency = useCallback(
    async (dependentTaskId: string) => {
      if (!task) return;

      setAddingDependencyId(dependentTaskId);
      try {
        await dispatch(addDependency({ taskId, dependentTaskId })).unwrap();
        // Refresh the task to get updated dependentTaskIds
        dispatch(fetchTask(taskId));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add dependency';
        Alert.alert('Error', errorMessage);
      } finally {
        setAddingDependencyId(null);
      }
    },
    [dispatch, taskId, task]
  );

  // Handle removing a dependency
  const handleRemoveDependency = useCallback(
    async (dependentTaskId: string) => {
      if (!task) return;

      // On web, Alert.alert may not work properly, so use window.confirm as fallback
      const confirmRemove = Platform.OS === 'web' 
        ? window.confirm('Are you sure you want to remove this dependency?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Remove Dependency', 'Are you sure you want to remove this dependency?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });

      if (!confirmRemove) return;

      try {
        await dispatch(removeDependency({ taskId, dependentTaskId })).unwrap();
        // Refresh the task to get updated dependentTaskIds
        dispatch(fetchTask(taskId));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove dependency';
        Alert.alert('Error', errorMessage);
      }
    },
    [dispatch, taskId, task]
  );

  // Handle clicking on a dependent task
  const handleDependentTaskPress = useCallback(
    (depTaskId: string) => {
      if (onTaskPress) {
        onTaskPress(depTaskId, boardId);
      }
    },
    [onTaskPress, boardId]
  );

  // Handle toggling pin status
  const handleTogglePin = useCallback(async () => {
    if (!task) return;
    try {
      await dispatch(toggleTaskPin(taskId)).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to update pin status');
    }
  }, [dispatch, taskId, task]);

  if (!task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const taskEpics = epics.filter((epic) => task.epicIds.includes(epic.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {/* Pin Button */}
          <TouchableOpacity
            onPress={handleTogglePin}
            style={[styles.headerButton, styles.pinButton]}
            accessibilityLabel={task.isPinned ? 'Unpin task' : 'Pin task'}
          >
            <View style={[styles.pinIconContainer, task.isPinned && { backgroundColor: colors.primary + '20' }]}>
              <HiOutlineBookmark
                size={18}
                color={task.isPinned ? colors.primary : colors.textMuted}
                style={task.isPinned ? { fill: colors.primary } : undefined}
              />
            </View>
          </TouchableOpacity>
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                style={styles.headerButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.headerButton, styles.saveButton]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.headerButton}
              >
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {isEditing ? (
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.primary }]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
          )}
        </View>

        {/* Priority */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Priority</Text>
          {isEditing ? (
            <View style={styles.prioritySelector}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityOption,
                    { borderColor: colors.border },
                    editPriority === p.value && [styles.prioritySelected, { backgroundColor: colors.border }],
                    { borderColor: p.color },
                  ]}
                  onPress={() => setEditPriority(p.value)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.priorityLabel, { color: colors.text }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.priorityOption,
                  { borderColor: colors.border },
                  editPriority === null && [styles.prioritySelected, { backgroundColor: colors.border }],
                ]}
                onPress={() => setEditPriority(null)}
              >
                <Text style={[styles.priorityLabel, { color: colors.text }]}>None</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.priorityDisplay}>
              {task.priority ? (
                <>
                  <View
                    style={[
                      styles.priorityDot,
                      {
                        backgroundColor:
                          PRIORITIES.find((p) => p.value === task.priority)?.color || colors.textMuted,
                      },
                    ]}
                  />
                  <Text style={[styles.priorityValue, { color: colors.text }]}>
                    {PRIORITIES.find((p) => p.value === task.priority)?.label || task.priority}
                  </Text>
                </>
              ) : (
                <Text style={[styles.emptyValue, { color: colors.textMuted }]}>Not set</Text>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Description</Text>
          {isEditing ? (
            <TextInput
              style={[styles.descriptionInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Add a description..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={task.description ? [styles.description, { color: colors.text }] : [styles.emptyValue, { color: colors.textMuted }]}>
              {task.description || 'No description'}
            </Text>
          )}
        </View>

        {/* Story Points */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Story Points</Text>
          {isEditing ? (
            <TextInput
              style={[styles.storyPointsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editStoryPoints}
              onChangeText={setEditStoryPoints}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          ) : (
            <Text style={task.storyPoints ? [styles.storyPointsValue, { color: colors.text }] : [styles.emptyValue, { color: colors.textMuted }]}>
              {task.storyPoints ?? 'Not set'}
            </Text>
          )}
        </View>

        {/* Due Date */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Due Date</Text>
          {isEditing ? (
            <DatePicker
              value={editEndDate}
              onChange={setEditEndDate}
              placeholder="Select due date"
            />
          ) : (
            <Text style={task.endDate ? [styles.dateValue, { color: colors.text }] : [styles.emptyValue, { color: colors.textMuted }]}>
              {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'Not set'}
            </Text>
          )}
        </View>

        {/* Move to Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Section</Text>
            <TouchableOpacity onPress={() => setShowSectionSelector(!showSectionSelector)}>
              <Text style={[styles.addButton, { color: colors.primary }]}>{showSectionSelector ? 'Done' : 'Move'}</Text>
            </TouchableOpacity>
          </View>
          {showSectionSelector ? (
            <View style={styles.sectionSelector}>
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.sectionOption,
                    { borderColor: colors.border },
                    task.sectionId === section.id && [styles.sectionSelected, { backgroundColor: colors.primary + '20', borderColor: colors.primary }],
                  ]}
                  onPress={() => handleMoveToSection(section.id)}
                >
                  <Text style={[styles.sectionOptionName, { color: colors.text }]}>{section.name}</Text>
                  {task.sectionId === section.id && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={[styles.sectionValue, { color: colors.text }]}>
              {sections.find((s) => s.id === task.sectionId)?.name || 'Unknown'}
            </Text>
          )}
        </View>

        {/* Epics */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Epics</Text>
            <TouchableOpacity onPress={() => setShowEpicSelector(!showEpicSelector)}>
              <Text style={[styles.addButton, { color: colors.primary }]}>{showEpicSelector ? 'Done' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>
          {showEpicSelector ? (
            <View style={styles.epicSelector}>
              {epics.map((epic) => (
                <TouchableOpacity
                  key={epic.id}
                  style={[
                    styles.epicOption,
                    { borderColor: colors.border },
                    task.epicIds.includes(epic.id) && [styles.epicSelected, { backgroundColor: '#22c55e20', borderColor: '#22c55e' }],
                  ]}
                  onPress={() => handleToggleEpic(epic.id)}
                >
                  <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
                  <Text style={[styles.epicName, { color: colors.text }]}>{epic.name}</Text>
                  {task.epicIds.includes(epic.id) && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
              {epics.length === 0 && (
                <Text style={[styles.emptyValue, { color: colors.textMuted }]}>No epics available</Text>
              )}
            </View>
          ) : (
            <View style={styles.epicsList}>
              {taskEpics.length > 0 ? (
                taskEpics.map((epic) => (
                  <TouchableOpacity
                    key={epic.id}
                    style={[styles.epicBadge, { backgroundColor: epic.color + '20' }]}
                    onPress={() => onEpicPress?.(epic.id)}
                  >
                    <Text style={[styles.epicBadgeText, { color: epic.color }]}>
                      {epic.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyValue, { color: colors.textMuted }]}>No epics assigned</Text>
              )}
            </View>
          )}
        </View>

        {/* Dependent Tasks */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Dependent Tasks ({dependentTasks.length})</Text>
            <TouchableOpacity onPress={() => setShowDependencySelector(!showDependencySelector)}>
              <Text style={[styles.addButton, { color: colors.primary }]}>{showDependencySelector ? 'Done' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>
          {showDependencySelector ? (
            <View style={styles.dependencySelector}>
              {availableTasksForDependency.length > 0 ? (
                availableTasksForDependency.map((depTask) => {
                  const depSection = sections.find(s => s.id === depTask.sectionId);
                  const isAdding = addingDependencyId === depTask.id;
                  return (
                    <TouchableOpacity
                      key={depTask.id}
                      style={[styles.dependencyOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handleAddDependency(depTask.id)}
                      disabled={addingDependencyId !== null}
                    >
                      <View style={styles.dependencyOptionInfo}>
                        <Text style={[styles.dependencyOptionTitle, { color: colors.text }]} numberOfLines={1}>
                          {depTask.title}
                        </Text>
                        <Text style={[styles.dependencyOptionSection, { color: colors.textMuted }]}>
                          {depSection?.name || 'Unknown'}
                        </Text>
                      </View>
                      {isAdding ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.addDependencyIcon, { color: colors.primary }]}>+</Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={[styles.emptyValue, { color: colors.textMuted }]}>No other tasks available</Text>
              )}
            </View>
          ) : (
            <View style={styles.dependenciesList}>
              {dependentTasks.length > 0 ? (
                dependentTasks.map((depTask) => {
                  const depSection = sections.find(s => s.id === depTask.sectionId);
                  return (
                    <View key={depTask.id} style={[styles.dependencyItem, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                      <TouchableOpacity
                        style={styles.dependencyItemInfo}
                        onPress={() => handleDependentTaskPress(depTask.id)}
                      >
                        <Text style={[styles.dependencyItemTitle, { color: colors.primary }]} numberOfLines={1}>
                          {depTask.title}
                        </Text>
                        <Text style={[styles.dependencyItemSection, { color: colors.textMuted }]}>
                          {depSection?.name || 'Unknown'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeDependencyButton}
                        onPress={() => handleRemoveDependency(depTask.id)}
                      >
                        <Text style={styles.removeDependencyText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.emptyValue, { color: colors.textMuted }]}>No dependent tasks</Text>
              )}
            </View>
          )}
        </View>

        {/* Comments */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Comments ({task.comments.length})</Text>
          
          {/* Add comment input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={[styles.commentInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!isAddingComment}
            />
            <TouchableOpacity
              style={[styles.addCommentButton, { backgroundColor: colors.primary }, (!newComment.trim() || isAddingComment) && styles.buttonDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim() || isAddingComment}
            >
              {isAddingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addCommentButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.commentsList}>
            {task.comments.map((comment) => (
              <View key={comment.id} style={[styles.comment, { backgroundColor: colors.background }]}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentDate, { color: colors.textMuted }]}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                    <Text style={styles.deleteCommentText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.commentContent, { color: colors.text }]}>{comment.content}</Text>
              </View>
            ))}
            {task.comments.length === 0 && (
              <Text style={[styles.emptyValue, { color: colors.textMuted }]}>No comments yet</Text>
            )}
          </View>
        </View>

        {/* Attachments */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Attachments ({task.attachments.length})</Text>
            <TouchableOpacity 
              onPress={handleAddAttachment}
              disabled={isUploadingAttachment}
            >
              {isUploadingAttachment ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.addButton, { color: colors.primary }]}>+ Add</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Upload error display */}
          {uploadError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Upload failed: {uploadError}</Text>
            </View>
          )}
          
          {/* Hidden file input for web */}
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef as any}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect as any}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
          )}

          <View style={styles.attachmentsList}>
            {task.attachments.map((attachment) => (
              <View key={attachment.id} style={[styles.attachment, { backgroundColor: colors.background }]}>
                <TouchableOpacity 
                  style={styles.attachmentInfo}
                  onPress={() => handleOpenAttachment(attachment.cloudinaryUrl)}
                >
                  <Text style={styles.attachmentIcon}>📎</Text>
                  <View style={styles.attachmentDetails}>
                    <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                      {attachment.filename}
                    </Text>
                    <Text style={[styles.attachmentSize, { color: colors.textMuted }]}>
                      {(attachment.fileSize / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteAttachmentButton}
                  onPress={() => handleDeleteAttachment(attachment.id)}
                >
                  <Text style={styles.deleteAttachmentText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {task.attachments.length === 0 && !uploadError && (
              <Text style={[styles.emptyValue, { color: colors.textMuted }]}>No attachments</Text>
            )}
          </View>
        </View>

        {/* Metadata */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Details</Text>
          <View style={styles.metadata}>
            <Text style={[styles.metaItem, { color: colors.textMuted }]}>
              Created: {new Date(task.createdAt).toLocaleString()}
            </Text>
            <Text style={[styles.metaItem, { color: colors.textMuted }]}>
              Updated: {new Date(task.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  pinButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  pinIconContainer: {
    padding: 6,
    borderRadius: 6,
  },
  pinButtonText: {
    fontSize: 18,
    opacity: 0.6,
  },
  pinButtonTextActive: {
    opacity: 1,
  },
  editText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  cancelText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    paddingBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  emptyValue: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  prioritySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityOption: {
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
  prioritySelected: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#374151',
  },
  priorityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityValue: {
    fontSize: 16,
    color: '#374151',
  },
  storyPointsInput: {
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    width: 80,
  },
  storyPointsValue: {
    fontSize: 16,
    color: '#374151',
  },
  dateValue: {
    fontSize: 16,
    color: '#374151',
  },
  dateInput: {
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  addButton: {
    color: '#6366f1',
    fontWeight: '600',
  },
  sectionSelector: {
    marginTop: 8,
  },
  sectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  sectionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  sectionOptionName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  sectionValue: {
    fontSize: 16,
    color: '#374151',
  },
  epicSelector: {
    marginTop: 8,
  },
  epicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  epicSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  epicDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  epicName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  checkmark: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  epicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  epicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  epicBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dependencySelector: {
    marginTop: 8,
  },
  dependencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  dependencyOptionInfo: {
    flex: 1,
    marginRight: 8,
  },
  dependencyOptionTitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dependencyOptionSection: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  addDependencyIcon: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  dependenciesList: {
    marginTop: 4,
  },
  dependencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  dependencyItemInfo: {
    flex: 1,
  },
  dependencyItemTitle: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  dependencyItemSection: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  removeDependencyButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeDependencyText: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  commentsList: {
    marginTop: 8,
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 44,
  },
  addCommentButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addCommentButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  comment: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#374151',
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteCommentText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  attachmentsList: {
    marginTop: 8,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  attachmentName: {
    fontSize: 14,
    color: '#374151',
  },
  attachmentSize: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  deleteAttachmentButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteAttachmentText: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  metadata: {
    marginTop: 4,
  },
  metaItem: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});

export default TaskDetailScreen;
