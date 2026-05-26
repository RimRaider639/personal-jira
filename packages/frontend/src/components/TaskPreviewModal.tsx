import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { Task, Epic } from '@kanban/shared';

interface TaskPreviewModalProps {
  visible: boolean;
  task: Task | null;
  epics: Epic[];
  allTasks: Task[];
  sectionName: string;
  onClose: () => void;
  onViewDetails: () => void;
  onEpicPress?: (epicId: string) => void;
  onTaskPress?: (taskId: string) => void;
}

const PRIORITIES: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#dc2626' },
  high: { label: 'High', color: '#f97316' },
  medium: { label: 'Medium', color: '#eab308' },
  low: { label: 'Low', color: '#22c55e' },
};

/**
 * TaskPreviewModal - Quick preview modal for task details
 * Shows important info with option to view full details
 * Displays attachments, comments, and dependent tasks
 */
export function TaskPreviewModal({
  visible,
  task,
  epics,
  allTasks,
  sectionName,
  onClose,
  onViewDetails,
  onEpicPress,
  onTaskPress,
}: TaskPreviewModalProps): React.JSX.Element {
  const { colors } = useTheme();

  const taskEpics = useMemo(
    () => (task ? epics.filter((epic) => task.epicIds.includes(epic.id)) : []),
    [epics, task]
  );

  const dependentTasks = useMemo(() => {
    if (!task?.dependentTaskIds || task.dependentTaskIds.length === 0) return [];
    return allTasks.filter((t) => task.dependentTaskIds.includes(t.id));
  }, [task, allTasks]);

  const priorityInfo = task?.priority ? PRIORITIES[task.priority] : null;

  const isOverdue = useMemo(() => {
    if (!task?.endDate) return false;
    return new Date(task.endDate) < new Date();
  }, [task?.endDate]);

  const formattedDate = useMemo(() => {
    if (!task?.endDate) return null;
    return new Date(task.endDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [task?.endDate]);

  const handleOpenAttachment = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  if (!task) return <></>;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Priority bar */}
          {priorityInfo && (
            <View style={[styles.priorityBar, { backgroundColor: priorityInfo.color }]} />
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>

            {/* Section badge */}
            <View style={[styles.sectionBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.sectionText, { color: colors.primary }]}>{sectionName}</Text>
            </View>

            {/* Meta row */}
            <View style={styles.metaRow}>
              {priorityInfo && (
                <View style={styles.metaItem}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityInfo.color }]} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {priorityInfo.label}
                  </Text>
                </View>
              )}
              {task.storyPoints !== null && task.storyPoints !== undefined && (
                <View style={[styles.storyPointsBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.storyPointsText, { color: colors.primary }]}>
                    {task.storyPoints} pts
                  </Text>
                </View>
              )}
            </View>

            {/* Due date */}
            {formattedDate && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Due Date</Text>
                <Text
                  style={[
                    styles.value,
                    { color: isOverdue ? colors.error : colors.text },
                  ]}
                >
                  📅 {formattedDate} {isOverdue && '(Overdue)'}
                </Text>
              </View>
            )}

            {/* Description */}
            {task.description && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Description</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                  {task.description}
                </Text>
              </View>
            )}

            {/* Epics */}
            {taskEpics.length > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Epics</Text>
                <View style={styles.epicsList}>
                  {taskEpics.map((epic) => (
                    <TouchableOpacity
                      key={epic.id}
                      style={[styles.epicBadge, { backgroundColor: epic.color + '20' }]}
                      onPress={() => onEpicPress?.(epic.id)}
                      disabled={!onEpicPress}
                    >
                      <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
                      <Text style={[styles.epicText, { color: epic.color }]}>{epic.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Dependent Tasks */}
            {dependentTasks.length > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Dependent Tasks ({dependentTasks.length})
                </Text>
                <View style={styles.dependentTasksList}>
                  {dependentTasks.slice(0, 3).map((depTask) => (
                    <TouchableOpacity
                      key={depTask.id}
                      style={[styles.dependentTaskItem, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                      onPress={() => onTaskPress?.(depTask.id)}
                      disabled={!onTaskPress}
                    >
                      <Text style={[styles.dependentTaskTitle, { color: colors.primary }]} numberOfLines={1}>
                        {depTask.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {dependentTasks.length > 3 && (
                    <Text style={[styles.moreText, { color: colors.textMuted }]}>
                      +{dependentTasks.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Attachments ({task.attachments.length})
                </Text>
                <View style={styles.attachmentsList}>
                  {task.attachments.slice(0, 4).map((attachment) => {
                    const isImage = attachment.mimeType.startsWith('image/');
                    const previewUrl = attachment.thumbnailUrl || (isImage ? attachment.cloudinaryUrl : null);
                    return (
                      <TouchableOpacity
                        key={attachment.id}
                        style={styles.attachmentItem}
                        onPress={() => handleOpenAttachment(attachment.cloudinaryUrl)}
                      >
                        {previewUrl ? (
                          <Image
                            source={{ uri: previewUrl }}
                            style={styles.attachmentImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.attachmentPlaceholder, { backgroundColor: colors.border }]}>
                            <Text style={styles.attachmentIcon}>📎</Text>
                          </View>
                        )}
                        <Text
                          style={[styles.attachmentName, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {attachment.filename}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {task.attachments.length > 4 && (
                    <View style={[styles.moreAttachments, { backgroundColor: colors.border }]}>
                      <Text style={[styles.moreText, { color: colors.textMuted }]}>
                        +{task.attachments.length - 4} more
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Comments */}
            {task.comments.length > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Recent Comments ({task.comments.length})
                </Text>
                <View style={styles.commentsList}>
                  {task.comments.slice(-3).map((comment) => (
                    <View
                      key={comment.id}
                      style={[styles.commentItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentAuthor, { color: colors.text }]}>
                          User
                        </Text>
                        <Text style={[styles.commentDate, { color: colors.textMuted }]}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        style={[styles.commentContent, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {comment.content}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailsButton, { backgroundColor: colors.primary }]}
              onPress={onViewDetails}
            >
              <Text style={styles.detailsButtonText}>View Full Details</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  priorityBar: {
    height: 4,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 28,
  },
  sectionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  storyPointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  storyPointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  epicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  epicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  epicDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  epicText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dependentTasksList: {
    gap: 6,
  },
  dependentTaskItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dependentTaskTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentItem: {
    width: 70,
    alignItems: 'center',
  },
  attachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  attachmentPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentIcon: {
    fontSize: 24,
  },
  attachmentName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  moreAttachments: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentsList: {
    gap: 8,
  },
  commentItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 10,
  },
  commentContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TaskPreviewModal;
