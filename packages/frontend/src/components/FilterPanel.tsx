import React, { useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
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

/**
 * FilterPanel - Full filter panel with epic, priority, and due date filters
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
  const hasActiveFilters = useMemo(
    () =>
      selectedEpicIds.length > 0 ||
      selectedPriorities.length > 0 ||
      selectedDueDateFilter !== null,
    [selectedEpicIds.length, selectedPriorities.length, selectedDueDateFilter]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <View style={styles.headerActions}>
              {hasActiveFilters && (
                <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Epic Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Epics</Text>
                {selectedEpicIds.length > 0 && (
                  <Text style={styles.selectedCount}>
                    {selectedEpicIds.length} selected (AND)
                  </Text>
                )}
              </View>
              <Text style={styles.sectionHint}>
                Tasks must have ALL selected epics
              </Text>
              <View style={styles.optionsList}>
                {epics.length > 0 ? (
                  epics.map((epic) => (
                    <TouchableOpacity
                      key={epic.id}
                      style={[
                        styles.option,
                        selectedEpicIds.includes(epic.id) && styles.optionSelected,
                      ]}
                      onPress={() => onToggleEpic(epic.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selectedEpicIds.includes(epic.id) }}
                    >
                      <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
                      <Text style={styles.optionText}>{epic.name}</Text>
                      {selectedEpicIds.includes(epic.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No epics available</Text>
                )}
              </View>
            </View>

            {/* Priority Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Priority</Text>
                {selectedPriorities.length > 0 && (
                  <Text style={styles.selectedCount}>
                    {selectedPriorities.length} selected (OR)
                  </Text>
                )}
              </View>
              <Text style={styles.sectionHint}>
                Tasks with ANY selected priority
              </Text>
              <View style={styles.optionsList}>
                {PRIORITIES.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.option,
                      selectedPriorities.includes(priority.value) && styles.optionSelected,
                    ]}
                    onPress={() => onTogglePriority(priority.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selectedPriorities.includes(priority.value) }}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: priority.color }]}
                    />
                    <Text style={styles.optionText}>{priority.label}</Text>
                    {selectedPriorities.includes(priority.value) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Due Date</Text>
              </View>
              <View style={styles.optionsList}>
                {DUE_DATE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value || 'all'}
                    style={[
                      styles.option,
                      selectedDueDateFilter === option.value && styles.optionSelected,
                    ]}
                    onPress={() => onSetDueDateFilter(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedDueDateFilter === option.value }}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                    {selectedDueDateFilter === option.value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllButton: {
    marginRight: 16,
  },
  clearAllText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  closeText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCount: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  sectionHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  epicDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    color: '#374151',
  },
  checkmark: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export const FilterPanel = memo(FilterPanelComponent);

export default FilterPanel;
