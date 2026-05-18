import React, { useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { Task, Epic, Section } from '@kanban/shared';
import { useTheme } from '@/theme/ThemeContext';
import { TaskCardMenu } from './TaskCardMenu';

interface TaskCardProps {
  task: Task;
  epics: Epic[];
  sections: Section[];
  onPress: (taskId: string) => void;
  onMove?: (taskId: string, newSectionId: string) => void;
  onToggleEpic?: (taskId: string, epicId: string) => void;
  onEpicPress?: (epicId: string) => void;
  isDragging?: boolean;
}

/**
 * TaskCard - Individual task card component with drag support
 * Memoized for performance optimization.
 * Now includes theme support and quick move menu.
 *
 * Requirements:
 * - 4.1: Display task title, priority indicator, due date
 * - 5.9: Show epic badges for associated epics
 * - 10.4: Visual feedback for overdue tasks
 * - 11.3: Show task count indicators
 * - 13.2: Optimize re-renders with React.memo
 */
function TaskCardComponent({
  task,
  epics,
  sections,
  onPress,
  onMove,
  onToggleEpic,
  onEpicPress,
  isDragging = false,
}: TaskCardProps): React.JSX.Element {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    onPress(task.id);
  }, [task.id, onPress]);

  const handleMove = useCallback(
    (taskId: string, newSectionId: string) => {
      onMove?.(taskId, newSectionId);
    },
    [onMove]
  );

  const handleToggleEpic = useCallback(
    (taskId: string, epicId: string) => {
      onToggleEpic?.(taskId, epicId);
    },
    [onToggleEpic]
  );

  const handleEpicPress = useCallback(
    (epicId: string) => {
      onEpicPress?.(epicId);
    },
    [onEpicPress]
  );

  const taskEpics = useMemo(
    () => epics.filter((epic) => task.epicIds.includes(epic.id)),
    [epics, task.epicIds]
  );

  const priorityColor = useMemo(() => {
    switch (task.priority) {
      case 'critical':
        return colors.priorityCritical;
      case 'high':
        return colors.priorityHigh;
      case 'medium':
        return colors.priorityMedium;
      case 'low':
        return colors.priorityLow;
      default:
        return 'transparent';
    }
  }, [task.priority, colors]);

  const isOverdue = useMemo(() => {
    if (!task.endDate) return false;
    return new Date(task.endDate) < new Date();
  }, [task.endDate]);

  const formattedDate = useMemo(() => {
    if (!task.endDate) return null;
    return new Date(task.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [task.endDate]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          shadowColor: colors.cardShadow,
        },
        isDragging && styles.cardDragging,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
      disabled={isDragging}
    >
      {/* Priority indicator */}
      {task.priority && (
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
      )}

      <View style={styles.content}>
        {/* Header with title and menu */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {task.title}
          </Text>
          {(onMove || onToggleEpic) && sections.length > 0 && (
            <TaskCardMenu
              taskId={task.id}
              currentSectionId={task.sectionId}
              sections={sections}
              epics={epics}
              taskEpicIds={task.epicIds}
              onMove={handleMove}
              onToggleEpic={handleToggleEpic}
            />
          )}
        </View>

        {/* Epic badges */}
        {taskEpics.length > 0 && (
          <View style={styles.epicsContainer}>
            {taskEpics.slice(0, 2).map((epic) => (
              <TouchableOpacity
                key={epic.id}
                style={[styles.epicBadge, { backgroundColor: epic.color + '20' }]}
                onPress={() => handleEpicPress(epic.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.epicText, { color: epic.color }]} numberOfLines={1}>
                  {epic.name}
                </Text>
              </TouchableOpacity>
            ))}
            {taskEpics.length > 2 && (
              <Text style={[styles.moreEpics, { color: colors.textMuted }]}>
                +{taskEpics.length - 2}
              </Text>
            )}
          </View>
        )}

        {/* Attachment previews */}
        {task.attachments.length > 0 && (
          <View style={styles.attachmentPreview}>
            {task.attachments.slice(0, 3).map((attachment) => {
              const isImage = attachment.mimeType.startsWith('image/');
              const previewUrl = attachment.thumbnailUrl || (isImage ? attachment.cloudinaryUrl : null);
              return previewUrl ? (
                <Image
                  key={attachment.id}
                  source={{ uri: previewUrl }}
                  style={styles.attachmentThumb}
                  resizeMode="cover"
                />
              ) : (
                <View key={attachment.id} style={[styles.attachmentThumb, styles.attachmentFile, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.attachmentFileIcon, { color: colors.textMuted }]}>📄</Text>
                </View>
              );
            })}
            {task.attachments.length > 3 && (
              <View style={[styles.attachmentThumb, styles.attachmentMore, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.attachmentMoreText, { color: colors.textMuted }]}>+{task.attachments.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Meta info */}
        <View style={styles.meta}>
          {formattedDate && (
            <Text
              style={[
                styles.metaItem,
                { color: isOverdue ? colors.error : colors.textSecondary },
              ]}
            >
              📅 {formattedDate}
            </Text>
          )}
          {task.storyPoints !== null && task.storyPoints !== undefined && (
            <View style={[styles.storyPointsBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.storyPointsText, { color: colors.primary }]}>
                {task.storyPoints}
              </Text>
            </View>
          )}
          {task.comments.length > 0 && (
            <Text style={[styles.metaItem, { color: colors.textSecondary }]}>
              💬 {task.comments.length}
            </Text>
          )}
          {task.attachments.length > 0 && (
            <Text style={[styles.metaItem, { color: colors.textSecondary }]}>
              📎 {task.attachments.length}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 90,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardDragging: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  priorityBar: {
    height: 3,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  epicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  epicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  epicText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreEpics: {
    fontSize: 10,
    alignSelf: 'center',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 'auto',
  },
  metaItem: {
    fontSize: 11,
    marginRight: 10,
  },
  storyPointsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 10,
  },
  storyPointsText: {
    fontSize: 10,
    fontWeight: '700',
  },
  attachmentPreview: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  attachmentThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
    overflow: 'hidden',
  },
  attachmentFile: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentFileIcon: {
    fontSize: 16,
  },
  attachmentMore: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentMoreText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: TaskCardProps, nextProps: TaskCardProps): boolean {
  if (prevProps.isDragging !== nextProps.isDragging) return false;
  if (prevProps.task.id !== nextProps.task.id) return false;
  if (prevProps.task.title !== nextProps.task.title) return false;
  if (prevProps.task.priority !== nextProps.task.priority) return false;
  if (prevProps.task.endDate !== nextProps.task.endDate) return false;
  if (prevProps.task.storyPoints !== nextProps.task.storyPoints) return false;
  if (prevProps.task.sectionId !== nextProps.task.sectionId) return false;
  if (prevProps.task.comments.length !== nextProps.task.comments.length) return false;
  if (prevProps.task.attachments.length !== nextProps.task.attachments.length) return false;
  if (prevProps.task.epicIds.length !== nextProps.task.epicIds.length) return false;
  
  for (let i = 0; i < prevProps.task.epicIds.length; i++) {
    if (prevProps.task.epicIds[i] !== nextProps.task.epicIds[i]) return false;
  }

  if (prevProps.sections.length !== nextProps.sections.length) return false;
  if (prevProps.epics !== nextProps.epics) {
    const prevRelevantEpics = prevProps.epics.filter((e) => prevProps.task.epicIds.includes(e.id));
    const nextRelevantEpics = nextProps.epics.filter((e) => nextProps.task.epicIds.includes(e.id));
    if (prevRelevantEpics.length !== nextRelevantEpics.length) return false;
  }

  if (prevProps.onPress !== nextProps.onPress) return false;
  if (prevProps.onMove !== nextProps.onMove) return false;
  if (prevProps.onToggleEpic !== nextProps.onToggleEpic) return false;
  if (prevProps.onEpicPress !== nextProps.onEpicPress) return false;

  return true;
}

export const TaskCard = memo(TaskCardComponent, arePropsEqual);

export default TaskCard;
