import React, { useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { Task, Epic } from '@kanban/shared';
import { TaskCard } from './TaskCard';

interface DraggableTaskListProps {
  tasks: Task[];
  epics: Epic[];
  sectionId: string;
  onTaskPress: (taskId: string) => void;
  onReorder: (sectionId: string, taskIds: string[]) => void;
  onAddTask: () => void;
  sectionName: string;
}

/**
 * DraggableTaskList - A draggable list of tasks within a section
 * Optimized with memoization for performance.
 *
 * Requirements:
 * - 4.3: Handle task reordering within section
 * - 4.5: Provide visual feedback during drag
 * - 13.2: Optimize re-renders with React.memo
 * - 13.5: Ensure transitions complete within 300ms
 */
function DraggableTaskListComponent({
  tasks,
  epics,
  sectionId,
  onTaskPress,
  onReorder,
  onAddTask,
  sectionName,
}: DraggableTaskListProps): React.JSX.Element {
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
              onPress={onTaskPress}
              isDragging={isActive}
            />
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [epics, onTaskPress]
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const ListFooterComponent = useCallback(
    () => (
      <TouchableOpacity
        style={styles.addTaskButton}
        onPress={onAddTask}
        accessibilityRole="button"
        accessibilityLabel={`Add task to ${sectionName}`}
      >
        <Text style={styles.addTaskText}>+ Add Task</Text>
      </TouchableOpacity>
    ),
    [onAddTask, sectionName]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks yet</Text>
      </View>
    ),
    []
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
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addTaskText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

/**
 * Custom comparison for memoization
 */
function arePropsEqual(
  prevProps: DraggableTaskListProps,
  nextProps: DraggableTaskListProps
): boolean {
  // Check section identity
  if (prevProps.sectionId !== nextProps.sectionId) return false;
  if (prevProps.sectionName !== nextProps.sectionName) return false;

  // Check tasks array (shallow comparison of IDs and positions)
  if (prevProps.tasks.length !== nextProps.tasks.length) return false;
  for (let i = 0; i < prevProps.tasks.length; i++) {
    const prevTask = prevProps.tasks[i];
    const nextTask = nextProps.tasks[i];
    if (prevTask.id !== nextTask.id || prevTask.position !== nextTask.position) {
      return false;
    }
    // Check key task fields that affect rendering
    if (
      prevTask.title !== nextTask.title ||
      prevTask.priority !== nextTask.priority ||
      prevTask.endDate !== nextTask.endDate
    ) {
      return false;
    }
  }

  // Check epics reference (if same, skip deep comparison)
  if (prevProps.epics !== nextProps.epics) {
    if (prevProps.epics.length !== nextProps.epics.length) return false;
  }

  // Check callback references
  if (prevProps.onTaskPress !== nextProps.onTaskPress) return false;
  if (prevProps.onReorder !== nextProps.onReorder) return false;
  if (prevProps.onAddTask !== nextProps.onAddTask) return false;

  return true;
}

export const DraggableTaskList = memo(DraggableTaskListComponent, arePropsEqual);

export default DraggableTaskList;
