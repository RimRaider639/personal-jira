import React, { useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { Section, Task, Epic } from '@kanban/shared';
import { DraggableTaskList } from './DraggableTaskList';

const SECTION_WIDTH = 300;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SectionWithTasks extends Section {
  tasks: Task[];
}

interface DraggableSectionListProps {
  sections: Section[];
  tasksBySectionId: Record<string, Task[]>;
  epics: Epic[];
  onTaskPress: (taskId: string) => void;
  onTaskReorder: (sectionId: string, taskIds: string[]) => void;
  onSectionReorder: (sectionIds: string[]) => void;
  onAddTask: (sectionId: string) => void;
  onAddSection: () => void;
}

/**
 * DraggableSectionList - Horizontal list of draggable sections
 * Optimized with memoization for performance.
 *
 * Requirements:
 * - 2.6: Enable section reordering via drag
 * - 4.3: Handle task reordering within section
 * - 4.4: Handle task movement between sections
 * - 13.2: Optimize re-renders with React.memo
 */
function DraggableSectionListComponent({
  sections,
  tasksBySectionId,
  epics,
  onTaskPress,
  onTaskReorder,
  onSectionReorder,
  onAddTask,
  onAddSection,
}: DraggableSectionListProps): React.JSX.Element {
  // Combine sections with their tasks for rendering
  const sectionsWithTasks: SectionWithTasks[] = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        tasks: tasksBySectionId[section.id] || [],
      })),
    [sections, tasksBySectionId]
  );

  const handleSectionDragEnd = useCallback(
    ({ data }: { data: SectionWithTasks[] }) => {
      const sectionIds = data.map((section) => section.id);
      onSectionReorder(sectionIds);
    },
    [onSectionReorder]
  );

  const handleAddTask = useCallback(
    (sectionId: string) => {
      onAddTask(sectionId);
    },
    [onAddTask]
  );

  const renderSection = useCallback(
    ({ item, drag, isActive }: RenderItemParams<SectionWithTasks>) => {
      return (
        <ScaleDecorator>
          <View style={[styles.sectionColumn, isActive && styles.sectionDragging]}>
            {/* Section Header - Draggable */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onLongPress={drag}
              disabled={isActive}
              delayLongPress={200}
              accessibilityRole="button"
              accessibilityLabel={`Drag to reorder ${item.name} section`}
              accessibilityHint="Long press to drag and reorder this section"
            >
              <View style={styles.headerContent}>
                <Text style={styles.sectionTitle}>{item.name}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{item.tasks.length}</Text>
                </View>
              </View>
              <Text style={styles.dragHint}>⋮⋮</Text>
            </TouchableOpacity>

            {/* Task List */}
            <DraggableTaskList
              tasks={item.tasks}
              epics={epics}
              sectionId={item.id}
              onTaskPress={onTaskPress}
              onReorder={onTaskReorder}
              onAddTask={() => handleAddTask(item.id)}
              sectionName={item.name}
            />
          </View>
        </ScaleDecorator>
      );
    },
    [epics, onTaskPress, onTaskReorder, handleAddTask]
  );

  const keyExtractor = useCallback((item: SectionWithTasks) => item.id, []);

  const ListFooterComponent = useCallback(
    () => (
      <TouchableOpacity
        style={styles.addSectionButton}
        onPress={onAddSection}
        accessibilityRole="button"
        accessibilityLabel="Add new section"
      >
        <Text style={styles.addSectionText}>+ Add Section</Text>
      </TouchableOpacity>
    ),
    [onAddSection]
  );

  return (
    <DraggableFlatList
      data={sectionsWithTasks}
      renderItem={renderSection}
      keyExtractor={keyExtractor}
      onDragEnd={handleSectionDragEnd}
      horizontal
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={styles.contentContainer}
      showsHorizontalScrollIndicator={false}
      activationDistance={15}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingRight: 0,
  },
  sectionColumn: {
    width: SECTION_WIDTH,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 16,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  sectionDragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  countBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dragHint: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 8,
  },
  addSectionButton: {
    width: 200,
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    marginRight: 16,
  },
  addSectionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});

/**
 * Custom comparison for memoization
 */
function arePropsEqual(
  prevProps: DraggableSectionListProps,
  nextProps: DraggableSectionListProps
): boolean {
  // Check sections array
  if (prevProps.sections.length !== nextProps.sections.length) return false;
  for (let i = 0; i < prevProps.sections.length; i++) {
    if (
      prevProps.sections[i].id !== nextProps.sections[i].id ||
      prevProps.sections[i].name !== nextProps.sections[i].name ||
      prevProps.sections[i].position !== nextProps.sections[i].position
    ) {
      return false;
    }
  }

  // Check tasksBySectionId (compare task counts and IDs per section)
  const prevSectionIds = Object.keys(prevProps.tasksBySectionId);
  const nextSectionIds = Object.keys(nextProps.tasksBySectionId);
  if (prevSectionIds.length !== nextSectionIds.length) return false;

  for (const sectionId of prevSectionIds) {
    const prevTasks = prevProps.tasksBySectionId[sectionId] || [];
    const nextTasks = nextProps.tasksBySectionId[sectionId] || [];
    if (prevTasks.length !== nextTasks.length) return false;
    // Check task IDs in order
    for (let i = 0; i < prevTasks.length; i++) {
      if (prevTasks[i].id !== nextTasks[i].id) return false;
    }
  }

  // Check epics reference
  if (prevProps.epics !== nextProps.epics) {
    if (prevProps.epics.length !== nextProps.epics.length) return false;
  }

  // Check callback references
  if (prevProps.onTaskPress !== nextProps.onTaskPress) return false;
  if (prevProps.onTaskReorder !== nextProps.onTaskReorder) return false;
  if (prevProps.onSectionReorder !== nextProps.onSectionReorder) return false;
  if (prevProps.onAddTask !== nextProps.onAddTask) return false;
  if (prevProps.onAddSection !== nextProps.onAddSection) return false;

  return true;
}

export const DraggableSectionList = memo(DraggableSectionListComponent, arePropsEqual);

export default DraggableSectionList;
