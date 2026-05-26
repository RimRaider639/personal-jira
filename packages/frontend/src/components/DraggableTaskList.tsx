import React, { useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { Task, Epic, Section } from '@kanban/shared';
import { useTheme } from '@/theme/ThemeContext';
import { TaskCard } from './TaskCard';

interface DraggableTaskListProps {
  tasks: Task[];
  epics: Epic[];
  sections: Section[];
  sectionId: string;
  onTaskPress: (taskId: string) => void;
  onReorder: (sectionId: string, taskIds: string[]) => void;
  onMoveTask: (taskId: string, newSectionId: string) => void;
  onToggleEpic: (taskId: string, epicId: string) => void;
  onTogglePin?: (taskId: string) => void;
  onEpicPress?: (epicId: string) => void;
  onClone?: (taskId: string) => void;
  onAddTask: () => void;
  sectionName: string;
}

/**
 * DraggableTaskList - A draggable list of tasks within a section
 * Optimized with memoization for performance.
 */
function DraggableTaskListComponent({
  tasks,
  epics,
  sections,
  sectionId,
  onTaskPress,
  onReorder,
  onMoveTask,
  onToggleEpic,
  onTogglePin,
  onEpicPress,
  onClone,
  onAddTask,
  sectionName,
}: DraggableTaskListProps): React.JSX.Element {
  const { colors } = useTheme();

  const handleDragEnd = useCallback(
    ({ data }: { data: Task[] }) => {
      const taskIds = data.map((task) => task.id);
      onReorder(sectionId, taskIds);
    },
    [sectionId, onReorder]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => {
      return (
        <ScaleDecorator>
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            delayLongPress={150}
            accessibilityRole="button"
            accessibilityLabel={`Drag to reorder ${item.title}`}
            accessibilityHint="Long press to drag and reorder this task"
          >
            <TaskCard
              task={item}
              epics={epics}
              sections={sections}
              onPress={onTaskPress}
              onMove={onMoveTask}
              onToggleEpic={onToggleEpic}
              onTogglePin={onTogglePin}
              onEpicPress={onEpicPress}
              onClone={onClone}
              isDragging={isActive}
            />
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [epics, sections, onTaskPress, onMoveTask, onToggleEpic, onTogglePin, onEpicPress, onClone]
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const ListFooterComponent = useCallback(
    () => (
      <TouchableOpacity
        style={[styles.addTaskButton, { borderColor: colors.border }]}
        onPress={onAddTask}
        accessibilityRole="button"
        accessibilityLabel={`Add task to ${sectionName}`}
      >
        <Text style={[styles.addTaskText, { color: colors.textSecondary }]}>+ Add Task</Text>
      </TouchableOpacity>
    ),
    [onAddTask, sectionName, colors]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks yet</Text>
      </View>
    ),
    [colors]
  );

  return (
    <DraggableFlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onDragEnd={handleDragEnd}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      containerStyle={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      activationDistance={10}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  addTaskButton: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addTaskText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

/**
 * Custom comparison for memoization
 */
function arePropsEqual(
  prevProps: DraggableTaskListProps,
  nextProps: DraggableTaskListProps
): boolean {
  if (prevProps.sectionId !== nextProps.sectionId) return false;
  if (prevProps.sectionName !== nextProps.sectionName) return false;
  if (prevProps.tasks.length !== nextProps.tasks.length) return false;
  
  for (let i = 0; i < prevProps.tasks.length; i++) {
    const prevTask = prevProps.tasks[i];
    const nextTask = nextProps.tasks[i];
    if (!prevTask || !nextTask) return false;
    if (prevTask.id !== nextTask.id || prevTask.position !== nextTask.position) {
      return false;
    }
    if (
      prevTask.title !== nextTask.title ||
      prevTask.priority !== nextTask.priority ||
      prevTask.endDate !== nextTask.endDate ||
      prevTask.sectionId !== nextTask.sectionId
    ) {
      return false;
    }
    if (prevTask.epicIds.length !== nextTask.epicIds.length) return false;
  }

  if (prevProps.epics !== nextProps.epics) {
    if (prevProps.epics.length !== nextProps.epics.length) return false;
  }

  if (prevProps.sections !== nextProps.sections) {
    if (prevProps.sections.length !== nextProps.sections.length) return false;
  }

  if (prevProps.onTaskPress !== nextProps.onTaskPress) return false;
  if (prevProps.onReorder !== nextProps.onReorder) return false;
  if (prevProps.onMoveTask !== nextProps.onMoveTask) return false;
  if (prevProps.onToggleEpic !== nextProps.onToggleEpic) return false;
  if (prevProps.onTogglePin !== nextProps.onTogglePin) return false;
  if (prevProps.onEpicPress !== nextProps.onEpicPress) return false;
  if (prevProps.onClone !== nextProps.onClone) return false;
  if (prevProps.onAddTask !== nextProps.onAddTask) return false;

  return true;
}

export const DraggableTaskList = memo(DraggableTaskListComponent, arePropsEqual);

export default DraggableTaskList;
