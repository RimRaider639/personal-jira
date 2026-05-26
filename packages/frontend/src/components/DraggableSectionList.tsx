import React, { useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { Section, Task, Epic } from '@kanban/shared';
import { useTheme } from '@/theme/ThemeContext';
import { DraggableTaskList } from './DraggableTaskList';

const SECTION_WIDTH = 300;

interface SectionWithTasks extends Section {
  tasks: Task[];
}

interface DraggableSectionListProps {
  sections: Section[];
  tasksBySectionId: Record<string, Task[]>;
  epics: Epic[];
  onTaskPress: (taskId: string) => void;
  onTaskReorder: (sectionId: string, taskIds: string[]) => void;
  onMoveTask: (taskId: string, newSectionId: string) => void;
  onToggleEpic: (taskId: string, epicId: string) => void;
  onTogglePin?: (taskId: string) => void;
  onEpicPress?: (epicId: string) => void;
  onClone?: (taskId: string) => void;
  onSectionReorder: (sectionIds: string[]) => void;
  onAddTask: (sectionId: string) => void;
  onAddSection: () => void;
}

/**
 * DraggableSectionList - Horizontal list of draggable sections
 * Now with theme support and quick move functionality.
 */
function DraggableSectionListComponent({
  sections,
  tasksBySectionId,
  epics,
  onTaskPress,
  onTaskReorder,
  onMoveTask,
  onToggleEpic,
  onTogglePin,
  onEpicPress,
  onClone,
  onSectionReorder,
  onAddTask,
  onAddSection,
}: DraggableSectionListProps): React.JSX.Element {
  const { colors } = useTheme();

  // Combine sections with their tasks for rendering
  const sectionsWithTasks: SectionWithTasks[] = useMemo(
    () =>
      sections
        .filter((section): section is Section => section != null)
        .map((section) => ({
          ...section,
          tasks: (tasksBySectionId[section.id] || []).filter((task): task is Task => task != null),
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
          <View
            style={[
              styles.sectionColumn,
              { backgroundColor: colors.sectionBackground },
              isActive && styles.sectionDragging,
            ]}
          >
            {/* Section Header - Draggable */}
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                { backgroundColor: colors.sectionBackground, borderBottomColor: colors.border },
              ]}
              onLongPress={drag}
              disabled={isActive}
              delayLongPress={200}
              accessibilityRole="button"
              accessibilityLabel={`Drag to reorder ${item.name} section`}
            >
              <View style={styles.headerContent}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{item.name}</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                  <Text style={[styles.countText, { color: colors.textSecondary }]}>
                    {item.tasks.length}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dragHint, { color: colors.textMuted }]}>⋮⋮</Text>
            </TouchableOpacity>

            {/* Task List */}
            <DraggableTaskList
              tasks={item.tasks}
              epics={epics}
              sections={sections}
              sectionId={item.id}
              onTaskPress={onTaskPress}
              onReorder={onTaskReorder}
              onMoveTask={onMoveTask}
              onToggleEpic={onToggleEpic}
              onTogglePin={onTogglePin}
              onEpicPress={onEpicPress}
              onClone={onClone}
              onAddTask={() => handleAddTask(item.id)}
              sectionName={item.name}
            />
          </View>
        </ScaleDecorator>
      );
    },
    [colors, epics, sections, onTaskPress, onTaskReorder, onMoveTask, onToggleEpic, onTogglePin, onEpicPress, onClone, handleAddTask]
  );

  const keyExtractor = useCallback((item: SectionWithTasks) => item.id, []);

  const ListFooterComponent = useCallback(
    () => (
      <TouchableOpacity
        style={[
          styles.addSectionButton,
          { backgroundColor: colors.sectionBackground, borderColor: colors.border },
        ]}
        onPress={onAddSection}
        accessibilityRole="button"
        accessibilityLabel="Add new section"
      >
        <Text style={[styles.addSectionText, { color: colors.textSecondary }]}>+ Add Section</Text>
      </TouchableOpacity>
    ),
    [onAddSection, colors]
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dragHint: {
    fontSize: 16,
    marginLeft: 8,
  },
  addSectionButton: {
    width: 200,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    marginRight: 16,
  },
  addSectionText: {
    fontSize: 14,
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
  if (prevProps.sections.length !== nextProps.sections.length) return false;
  for (let i = 0; i < prevProps.sections.length; i++) {
    const prevSection = prevProps.sections[i];
    const nextSection = nextProps.sections[i];
    if (!prevSection || !nextSection) return false;
    if (
      prevSection.id !== nextSection.id ||
      prevSection.name !== nextSection.name ||
      prevSection.position !== nextSection.position
    ) {
      return false;
    }
  }

  const prevSectionIds = Object.keys(prevProps.tasksBySectionId);
  const nextSectionIds = Object.keys(nextProps.tasksBySectionId);
  if (prevSectionIds.length !== nextSectionIds.length) return false;

  for (const sectionId of prevSectionIds) {
    const prevTasks = prevProps.tasksBySectionId[sectionId] || [];
    const nextTasks = nextProps.tasksBySectionId[sectionId] || [];
    if (prevTasks.length !== nextTasks.length) return false;
    for (let i = 0; i < prevTasks.length; i++) {
      const prevTask = prevTasks[i];
      const nextTask = nextTasks[i];
      if (!prevTask || !nextTask) return false;
      if (prevTask.id !== nextTask.id || prevTask.sectionId !== nextTask.sectionId) return false;
    }
  }

  if (prevProps.epics !== nextProps.epics) {
    if (prevProps.epics.length !== nextProps.epics.length) return false;
  }

  if (prevProps.onTaskPress !== nextProps.onTaskPress) return false;
  if (prevProps.onTaskReorder !== nextProps.onTaskReorder) return false;
  if (prevProps.onMoveTask !== nextProps.onMoveTask) return false;
  if (prevProps.onToggleEpic !== nextProps.onToggleEpic) return false;
  if (prevProps.onTogglePin !== nextProps.onTogglePin) return false;
  if (prevProps.onEpicPress !== nextProps.onEpicPress) return false;
  if (prevProps.onClone !== nextProps.onClone) return false;
  if (prevProps.onSectionReorder !== nextProps.onSectionReorder) return false;
  if (prevProps.onAddTask !== nextProps.onAddTask) return false;
  if (prevProps.onAddSection !== nextProps.onAddSection) return false;

  return true;
}

export const DraggableSectionList = memo(DraggableSectionListComponent, arePropsEqual);

export default DraggableSectionList;
