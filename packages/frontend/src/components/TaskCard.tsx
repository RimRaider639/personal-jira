import React, { useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Task, Epic, Priority } from '@kanban/shared';

interface TaskCardProps {
  task: Task;
  epics: Epic[];
  onPress: (taskId: string) => void;
  isDragging?: boolean;
}

/**
 * Get priority color - extracted for reuse
 */
const getPriorityColor = (priority: Priority | null): string => {
  switch (priority) {
    case 'critical':
      return '#dc2626';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#eab308';
    case 'low':
      return '#22c55e';
    default:
      return '#9ca3af';
  }
};

/**
 * TaskCard - Individual task card component with drag support
 * Memoized for performance optimization.
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
  onPress,
  isDragging = false,
}: TaskCardProps): React.JSX.Element {
  const handlePress = useCallback(() => {
    onPress(task.id);
  }, [task.id, onPress]);

  const taskEpics = useMemo(
    () => epics.filter((epic) => task.epicIds.includes(epic.id)),
    [epics, task.epicIds]
  );

  const priorityColor = useMemo(() => getPriorityColor(task.priority), [task.priority]);

  const isOverdue = useMemo(() => {
    if (!task.endDate) return false;
    return new Date(task.endDate) < new Date();
  }, [task.endDate]);

  const formattedDate = useMemo(() => {
    if (!task.endDate) return null;
    return new Date(task.endDate).toLocaleDateString();
  }, [task.endDate]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
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
        <View
          style={[styles.priorityBar, { backgroundColor: priorityColor }]}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>

        {/* Epic badges */}
        {taskEpics.length > 0 && (
          <View style={styles.epicsContainer}>
            {taskEpics.slice(0, 2).map((epic) => (
              <View
                key={epic.id}
                style={[styles.epicBadge, { backgroundColor: epic.color + '20' }]}
              >
                <Text style={[styles.epicText, { color: epic.color }]} numberOfLines={1}>
                  {epic.name}
                </Text>
              </View>
            ))}
            {taskEpics.length > 2 && (
              <Text style={styles.moreEpics}>+{taskEpics.length - 2}</Text>
            )}
          </View>
        )}

        {/* Meta info */}
        <View style={styles.meta}>
          {formattedDate && (
            <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
              📅 {formattedDate}
            </Text>
          )}
          {task.storyPoints && (
            <Text style={styles.storyPoints}>{task.storyPoints} pts</Text>
          )}
          {task.comments.length > 0 && (
            <Text style={styles.comments}>💬 {task.comments.length}</Text>
          )}
          {task.attachments.length > 0 && (
            <Text style={styles.attachments}>📎 {task.attachments.length}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  cardDragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  priorityBar: {
    height: 3,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  epicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  epicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    color: '#6b7280',
    alignSelf: 'center',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 11,
    color: '#6b7280',
    marginRight: 8,
  },
  overdue: {
    color: '#dc2626',
  },
  storyPoints: {
    fontSize: 11,
    color: '#6b7280',
    marginRight: 8,
  },
  comments: {
    fontSize: 11,
    color: '#6b7280',
    marginRight: 8,
  },
  attachments: {
    fontSize: 11,
    color: '#6b7280',
  },
});

/**
 * Custom comparison function for React.memo
 * Only re-render if task data, epics, or drag state changes
 */
function arePropsEqual(prevProps: TaskCardProps, nextProps: TaskCardProps): boolean {
  // Check drag state first (most likely to change during drag)
  if (prevProps.isDragging !== nextProps.isDragging) return false;

  // Check task identity and key fields
  if (prevProps.task.id !== nextProps.task.id) return false;
  if (prevProps.task.title !== nextProps.task.title) return false;
  if (prevProps.task.priority !== nextProps.task.priority) return false;
  if (prevProps.task.endDate !== nextProps.task.endDate) return false;
  if (prevProps.task.storyPoints !== nextProps.task.storyPoints) return false;
  if (prevProps.task.comments.length !== nextProps.task.comments.length) return false;
  if (prevProps.task.attachments.length !== nextProps.task.attachments.length) return false;

  // Check epic IDs (shallow array comparison)
  if (prevProps.task.epicIds.length !== nextProps.task.epicIds.length) return false;
  for (let i = 0; i < prevProps.task.epicIds.length; i++) {
    if (prevProps.task.epicIds[i] !== nextProps.task.epicIds[i]) return false;
  }

  // Check epics array reference (if same reference, no need to deep compare)
  if (prevProps.epics !== nextProps.epics) {
    // Only compare epics that are relevant to this task
    const prevRelevantEpics = prevProps.epics.filter((e) => prevProps.task.epicIds.includes(e.id));
    const nextRelevantEpics = nextProps.epics.filter((e) => nextProps.task.epicIds.includes(e.id));
    if (prevRelevantEpics.length !== nextRelevantEpics.length) return false;
    for (let i = 0; i < prevRelevantEpics.length; i++) {
      if (
        prevRelevantEpics[i].id !== nextRelevantEpics[i].id ||
        prevRelevantEpics[i].name !== nextRelevantEpics[i].name ||
        prevRelevantEpics[i].color !== nextRelevantEpics[i].color
      ) {
        return false;
      }
    }
  }

  // Check callback reference (should be stable with useCallback)
  if (prevProps.onPress !== nextProps.onPress) return false;

  return true;
}

export const TaskCard = memo(TaskCardComponent, arePropsEqual);

export default TaskCard;
