import React, { useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { Epic, Priority, DueDateFilter } from '@kanban/shared';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  // Epic filter
  epics: Epic[];
  selectedEpicIds: string[];
  onToggleEpic: (epicId: string) => void;
  // Priority filter
  selectedPriorities: Priority[];
  onTogglePriority: (priority: Priority) => void;
  // Due date filter
  selectedDueDateFilter: DueDateFilter | null;
  onSetDueDateFilter: (filter: DueDateFilter | null) => void;
  // Clear all
  onClearAll: () => void;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#22c55e' },
];

const DUE_DATE_OPTIONS: { value: DueDateFilter | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: '7days', label: 'Next 7 Days' },
  { value: 'overdue', label: 'Overdue' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

/**
 * FilterPanel - Side panel with epic, priority, and due date filters
 * Memoized for performance optimization.
 *
 * Requirements:
 * - 9.2, 9.4, 9.5: Epic filter with multi-select
 * - 10.2: Priority filter with priority level options
 * - 11.2: Due date filter with preset options
 * - 13.2: Optimize re-renders with React.memo
 */
function FilterPanelComponent({
  visible,
  onClose,
  epics,
  selectedEpicIds,
  onToggleEpic,
  selectedPriorities,
  onTogglePriority,
  selectedDueDateFilter,
  onSetDueDateFilter,
  onClearAll,
}: FilterPanelProps): React.JSX.Element {
  const { colors } = useTheme();
  
  const hasActiveFilters = useMemo(
    () =>
      selectedEpicIds.length > 0 ||
      selectedPriorities.length > 0 ||
      selectedDueDateFilter !== null,
    [selectedEpicIds.length, selectedPriorities.length, selectedDueDateFilter]
  );

  const handleClearAll = useCallback(() => {
    onClearAll();
  }, [onClearAll]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.panel, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Epic Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Epics</Text>
                {selectedEpicIds.length > 0 && (
                  <Text style={[styles.selectedCount, { color: colors.primary }]}>
                    {selectedEpicIds.length} selected
                  </Text>
                )}
              </View>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                Tasks must have ALL selected epics
              </Text>
              <View style={styles.optionsList}>
                {epics.length > 0 ? (
                  epics.map((epic) => (
                    <TouchableOpacity
                      key={epic.id}
                      style={[
                        styles.option,
                        { borderColor: colors.border },
                        selectedEpicIds.includes(epic.id) && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                      ]}
                      onPress={() => onToggleEpic(epic.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selectedEpicIds.includes(epic.id) }}
                    >
                      <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
                      <Text style={[styles.optionText, { color: colors.text }]}>{epic.name}</Text>
                      {selectedEpicIds.includes(epic.id) && (
                        <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No epics available</Text>
                )}
              </View>
            </View>

            {/* Priority Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Priority</Text>
                {selectedPriorities.length > 0 && (
                  <Text style={[styles.selectedCount, { color: colors.primary }]}>
                    {selectedPriorities.length} selected
                  </Text>
                )}
              </View>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                Tasks with ANY selected priority
              </Text>
              <View style={styles.optionsList}>
                {PRIORITIES.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.option,
                      { borderColor: colors.border },
                      selectedPriorities.includes(priority.value) && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                    ]}
                    onPress={() => onTogglePriority(priority.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selectedPriorities.includes(priority.value) }}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: priority.color }]}
                    />
                    <Text style={[styles.optionText, { color: colors.text }]}>{priority.label}</Text>
                    {selectedPriorities.includes(priority.value) && (
                      <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Due Date</Text>
              </View>
              <View style={styles.optionsList}>
                {DUE_DATE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value || 'all'}
                    style={[
                      styles.option,
                      { borderColor: colors.border },
                      selectedDueDateFilter === option.value && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                    ]}
                    onPress={() => onSetDueDateFilter(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedDueDateFilter === option.value }}
                  >
                    <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
                    {selectedDueDateFilter === option.value && (
                      <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {hasActiveFilters && (
              <TouchableOpacity style={[styles.clearButton, { borderColor: colors.error }]} onPress={handleClearAll}>
                <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panel: {
    width: PANEL_WIDTH,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectedCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  optionsList: {
    gap: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  epicDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export const FilterPanel = memo(FilterPanelComponent);

export default FilterPanel;
