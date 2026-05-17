import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchTask,
  updateTask,
  deleteTask,
  assignEpicToTask,
  removeEpicFromTask,
} from '@/store/slices';
import { selectTaskById, selectEpicsByBoardId } from '@/store/selectors';
import type { Priority, Epic } from '@kanban/shared';

interface TaskDetailScreenProps {
  taskId: string;
  boardId: string;
  onBack?: () => void;
  onDelete?: () => void;
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
}: TaskDetailScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();

  const task = useAppSelector((state) => selectTaskById(state, taskId));
  const epics = useAppSelector((state) => selectEpicsByBoardId(state, boardId));
  const isLoading = useAppSelector((state) => state.tasks.isLoading);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority | null>(null);
  const [editStoryPoints, setEditStoryPoints] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Epic selector state
  const [showEpicSelector, setShowEpicSelector] = useState(false);

  useEffect(() => {
    dispatch(fetchTask(taskId));
  }, [dispatch, taskId]);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditPriority(task.priority);
      setEditStoryPoints(task.storyPoints?.toString() || '');
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
          },
        })
      ).unwrap();
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, taskId, task, editTitle, editDescription, editPriority, editStoryPoints]);

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

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const taskEpics = epics.filter((epic) => task.epicIds.includes(epic.id));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
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
        <View style={styles.section}>
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title"
              placeholderTextColor="#9ca3af"
            />
          ) : (
            <Text style={styles.title}>{task.title}</Text>
          )}
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Priority</Text>
          {isEditing ? (
            <View style={styles.prioritySelector}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityOption,
                    editPriority === p.value && styles.prioritySelected,
                    { borderColor: p.color },
                  ]}
                  onPress={() => setEditPriority(p.value)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={styles.priorityLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.priorityOption,
                  editPriority === null && styles.prioritySelected,
                ]}
                onPress={() => setEditPriority(null)}
              >
                <Text style={styles.priorityLabel}>None</Text>
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
                          PRIORITIES.find((p) => p.value === task.priority)?.color || '#9ca3af',
                      },
                    ]}
                  />
                  <Text style={styles.priorityValue}>
                    {PRIORITIES.find((p) => p.value === task.priority)?.label || task.priority}
                  </Text>
                </>
              ) : (
                <Text style={styles.emptyValue}>Not set</Text>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          {isEditing ? (
            <TextInput
              style={styles.descriptionInput}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Add a description..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={task.description ? styles.description : styles.emptyValue}>
              {task.description || 'No description'}
            </Text>
          )}
        </View>

        {/* Story Points */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Story Points</Text>
          {isEditing ? (
            <TextInput
              style={styles.storyPointsInput}
              value={editStoryPoints}
              onChangeText={setEditStoryPoints}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          ) : (
            <Text style={task.storyPoints ? styles.storyPointsValue : styles.emptyValue}>
              {task.storyPoints ?? 'Not set'}
            </Text>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Due Date</Text>
          <Text style={task.endDate ? styles.dateValue : styles.emptyValue}>
            {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'Not set'}
          </Text>
        </View>

        {/* Epics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Epics</Text>
            <TouchableOpacity onPress={() => setShowEpicSelector(!showEpicSelector)}>
              <Text style={styles.addButton}>{showEpicSelector ? 'Done' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>
          {showEpicSelector ? (
            <View style={styles.epicSelector}>
              {epics.map((epic) => (
                <TouchableOpacity
                  key={epic.id}
                  style={[
                    styles.epicOption,
                    task.epicIds.includes(epic.id) && styles.epicSelected,
                  ]}
                  onPress={() => handleToggleEpic(epic.id)}
                >
                  <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
                  <Text style={styles.epicName}>{epic.name}</Text>
                  {task.epicIds.includes(epic.id) && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
              {epics.length === 0 && (
                <Text style={styles.emptyValue}>No epics available</Text>
              )}
            </View>
          ) : (
            <View style={styles.epicsList}>
              {taskEpics.length > 0 ? (
                taskEpics.map((epic) => (
                  <View
                    key={epic.id}
                    style={[styles.epicBadge, { backgroundColor: epic.color + '20' }]}
                  >
                    <Text style={[styles.epicBadgeText, { color: epic.color }]}>
                      {epic.name}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyValue}>No epics assigned</Text>
              )}
            </View>
          )}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Comments ({task.comments.length})</Text>
          <View style={styles.commentsList}>
            {task.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Text style={styles.commentDate}>
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
            {task.comments.length === 0 && (
              <Text style={styles.emptyValue}>No comments yet</Text>
            )}
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attachments ({task.attachments.length})</Text>
          <View style={styles.attachmentsList}>
            {task.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachment}>
                <Text style={styles.attachmentIcon}>📎</Text>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.filename}
                </Text>
              </View>
            ))}
            {task.attachments.length === 0 && (
              <Text style={styles.emptyValue}>No attachments</Text>
            )}
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.metadata}>
            <Text style={styles.metaItem}>
              Created: {new Date(task.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.metaItem}>
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
  addButton: {
    color: '#6366f1',
    fontWeight: '600',
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
  commentsList: {
    marginTop: 8,
  },
  comment: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
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
  attachmentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
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
