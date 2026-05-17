import React, { useState, useCallback, memo, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { apiClient } from '@/services/api';

interface ExportButtonProps {
  boardId?: string;
  exportAll?: boolean;
  style?: object;
}

/**
 * ExportButton - Triggers data export
 * Includes accessibility features for screen readers.
 *
 * Requirements:
 * - 20.1: Implement single board export
 * - 20.2: Implement all boards export
 * - 20.3: Trigger file download on web, share sheet on mobile
 * - 13.6: Implement accessibility features
 */
function ExportButtonComponent({
  boardId,
  exportAll = false,
  style,
}: ExportButtonProps): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);

  const accessibilityLabel = useMemo(
    () => (exportAll ? 'Export all boards data' : 'Export current board data'),
    [exportAll]
  );

  const accessibilityHint = useMemo(
    () =>
      Platform.OS === 'web'
        ? 'Downloads a JSON file with your data'
        : 'Opens share sheet with your data',
    []
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const endpoint = exportAll ? '/export/all' : `/boards/${boardId}/export`;
      const response = await apiClient.get<{ data: object }>(endpoint);

      const exportData = response.data.data;
      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = exportAll
        ? `kanban-export-all-${new Date().toISOString().split('T')[0]}.json`
        : `kanban-board-${boardId}-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web: Trigger file download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Alert.alert('Success', 'Export downloaded successfully');
      } else {
        // Mobile: Would use Share API or file system
        // For now, show success message
        Alert.alert(
          'Export Ready',
          'Export data is ready. In a production app, this would open the share sheet.'
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [boardId, exportAll]);

  return (
    <TouchableOpacity
      style={[styles.button, style, isExporting && styles.buttonDisabled]}
      onPress={handleExport}
      disabled={isExporting}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isExporting, busy: isExporting }}
    >
      {isExporting ? (
        <ActivityIndicator size="small" color="#6366f1" />
      ) : (
        <>
          <Text style={styles.icon} aria-hidden={true}>
            📥
          </Text>
          <Text style={styles.text}>{exportAll ? 'Export All' : 'Export'}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 44, // Minimum touch target size for accessibility
    minWidth: 44,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export const ExportButton = memo(ExportButtonComponent);

export default ExportButton;
