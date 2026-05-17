import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface FilterBarProps {
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  onOpenFilters: () => void;
  onClearFilters: () => void;
}

/**
 * FilterBar - Displays active filter indicators and task count
 * Includes accessibility features for screen readers.
 *
 * Requirements:
 * - 8.3: Display active filter indicators
 * - 12.3: Show task count for current filter
 * - 12.4: Add clear filters button
 * - 13.6: Implement accessibility features
 */
function FilterBarComponent({
  hasActiveFilters,
  filteredCount,
  totalCount,
  onOpenFilters,
  onClearFilters,
}: FilterBarProps): React.JSX.Element {
  const filterButtonLabel = useMemo(
    () =>
      hasActiveFilters
        ? `Filters active, showing ${filteredCount} of ${totalCount} tasks. Tap to modify filters.`
        : 'Open filters',
    [hasActiveFilters, filteredCount, totalCount]
  );

  const countAccessibilityLabel = useMemo(
    () => `Showing ${filteredCount} of ${totalCount} tasks`,
    [filteredCount, totalCount]
  );

  return (
    <View style={styles.container} accessibilityRole="toolbar">
      <TouchableOpacity
        style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel={filterButtonLabel}
        accessibilityState={{ expanded: false }}
      >
        <Text
          style={[styles.filterIcon, hasActiveFilters && styles.filterIconActive]}
          aria-hidden={true}
        >
          ⚙️
        </Text>
        <Text style={[styles.filterText, hasActiveFilters && styles.filterTextActive]}>
          Filters
        </Text>
        {hasActiveFilters && <View style={styles.activeDot} aria-hidden={true} />}
      </TouchableOpacity>

      {hasActiveFilters && (
        <>
          <View
            style={styles.countContainer}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={countAccessibilityLabel}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.countText}>
              {filteredCount} of {totalCount} tasks
            </Text>
          </View>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            accessibilityHint="Removes all active filters and shows all tasks"
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 44, // Minimum touch target size
  },
  filterButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterIconActive: {
    color: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
    marginLeft: 6,
  },
  countContainer: {
    flex: 1,
    marginLeft: 12,
  },
  countText: {
    fontSize: 13,
    color: '#6b7280',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44, // Minimum touch target size
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
});

export const FilterBar = memo(FilterBarComponent);

export default FilterBar;
