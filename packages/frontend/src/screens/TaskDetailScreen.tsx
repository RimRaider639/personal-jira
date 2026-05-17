import React, { useEffect, useCallback, useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchTask,
  fetchSections,
  fetchEpics,
  updateTask,
  deleteTask,
  assignEpicToTask,
  removeEpicFromTask,
  uploadAttachment,
  deleteAttachment,
  addComment,
  deleteComment,
  moveTask,
} from '@/store/slices';
import { selectTaskById, selectEpicsByBoardId, selectSectionsByBoardId } from '@/store/selectors';
import { DatePicker } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
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
  const sections = useAppSelector((state) => selectSectionsByBoardId(state, boardId));
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

  useEffect(() => {
    dispatch(fetchTask(taskId));
    // Also fetch sections and epics for the board (needed for move and epic assignment)
    if (boardId) {
      dispatch(fetchSections(boardId));
      dispatch(fetchEpics(boardId));
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
          {isEditing ? (
            <DatePicker
              value={editEndDate}
              onChange={setEditEndDate}
              placeholder="Select due date"
            />
          ) : (
            <Text style={task.endDate ? styles.dateValue : styles.emptyValue}>
              {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'Not set'}
            </Text>
          )}
        </View>

        {/* Move to Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Section</Text>
            <TouchableOpacity onPress={() => setShowSectionSelector(!showSectionSelector)}>
              <Text style={styles.addButton}>{showSectionSelector ? 'Done' : 'Move'}</Text>
            </TouchableOpacity>
          </View>
          {showSectionSelector ? (
            <View style={styles.sectionSelector}>
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.sectionOption,
                    task.sectionId === section.id && styles.sectionSelected,
                  ]}
                  onPress={() => handleMoveToSection(section.id)}
                >
                  <Text style={styles.sectionOptionName}>{section.name}</Text>
                  {task.sectionId === section.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionValue}>
              {sections.find((s) => s.id === task.sectionId)?.name || 'Unknown'}
            </Text>
          )}
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
          
          {/* Add comment input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#9ca3af"
              multiline
              editable={!isAddingComment}
            />
            <TouchableOpacity
              style={[styles.addCommentButton, (!newComment.trim() || isAddingComment) && styles.buttonDisabled]}
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
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                    <Text style={styles.deleteCommentText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))}
            {task.comments.length === 0 && (
              <Text style={styles.emptyValue}>No comments yet</Text>
            )}
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Attachments ({task.attachments.length})</Text>
            <TouchableOpacity 
              onPress={handleAddAttachment}
              disabled={isUploadingAttachment}
            >
              {isUploadingAttachment ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.addButton}>+ Add</Text>
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
              <View key={attachment.id} style={styles.attachment}>
                <TouchableOpacity 
                  style={styles.attachmentInfo}
                  onPress={() => handleOpenAttachment(attachment.cloudinaryUrl)}
                >
                  <Text style={styles.attachmentIcon}>📎</Text>
                  <View style={styles.attachmentDetails}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.filename}
                    </Text>
                    <Text style={styles.attachmentSize}>
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
