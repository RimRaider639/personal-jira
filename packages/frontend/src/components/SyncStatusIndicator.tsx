import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';

interface SyncStatusIndicatorProps {
  status: string;
  pendingCount?: number;
}

/**
 * SyncStatusIndicator - Shows sync status with visual feedback
 * Includes accessibility features for screen readers.
 *
 * Requirements:
 * - 15.9: Show sync status indicator
 * - 13.6: Implement accessibility features
 */
function SyncStatusIndicatorComponent({
  status,
  pendingCount = 0,
}: SyncStatusIndicatorProps): React.JSX.Element {
  const statusColor = useMemo(() => {
    switch (status) {
      case 'synced':
        return '#10b981';
      case 'syncing':
        return '#f59e0b';
      case 'offline':
        return '#6b7280';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }, [status]);

  const statusText = useMemo(() => {
    switch (status) {
      case 'synced':
        return '● Synced';
      case 'syncing':
        return '● Syncing...';
      case 'offline':
        return pendingCount > 0 ? `● Offline (${pendingCount} pending)` : '● Offline';
      case 'error':
        return '● Sync Error';
      default:
        return '● Unknown';
    }
  }, [status, pendingCount]);

  const accessibilityLabel = useMemo(() => {
    switch (status) {
      case 'synced':
        return 'Sync status: All changes saved';
      case 'syncing':
        return 'Sync status: Saving changes';
      case 'offline':
        return pendingCount > 0
          ? `Sync status: Offline with ${pendingCount} changes pending`
          : 'Sync status: Offline';
      case 'error':
        return 'Sync status: Error saving changes';
      default:
        return 'Sync status: Unknown';
    }
  }, [status, pendingCount]);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: statusColor }]}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export const SyncStatusIndicator = memo(SyncStatusIndicatorComponent);

export default SyncStatusIndicator;
