import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { Task, Epic } from '@kanban/shared';

interface TaskPreviewModalProps {
  visible: boolean;
  task: Task | null;
  epics: Epic[];
  sectionName: string;
  onClose: () => void;
  onViewDetails: () => void;
}

const PRIORITIES: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#dc2626' },
  high: { label: 'High', color: '#f97316' },
  medium: { label: 'Medium', color: '#eab308' },
  low: { label: 'Low', color: '#22c55e' },
};

/**
 * TaskPreviewModal - Quick preview modal for task details
 * Shows important info with option to view full details
 */
export function TaskPreviewModal({
  visible,
  task,
  epics,
  sectionName,
  onClose,
  onViewDetails,
}: TaskPreviewModalProps): React.JSX.Element {
  const { colors } = useTheme();

  const taskEpics = useMemo(
    () => (task ? epics.filter((epic) => task.epicIds.includes(epic.id)) : []),
    [epics, task]
  );

  const priorityInfo = task?.priority ? PRIORITIES[task.priority] : null;

  const isOverdue = useMemo(() => {
    if (!task?.endDate) return false;
    return new Date(task.endDate) < new Date();
  }, [task?.endDate]);

  const formattedDate = useMemo(() => {
    if (!task?.endDate) return null;
    return new Date(task.endDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [task?.endDate]);

  if (!task) return <></>;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Priority bar */}
          {priorityInfo && (
            <View style={[styles.priorityBar, { backgroundColor: priorityInfo.color }]} />
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>

            {/* Section badge */}
            <View style={[styles.sectionBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.sectionText, { color: colors.primary }]}>{sectionName}</Text>
            </View>

            {/* Meta row */}
            <View style={styles.metaRow}>
              {priorityInfo && (
                <View style={styles.metaItem}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityInfo.color }]} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {priorityInfo.label}
                  </Text>
                </View>
              )}
              {task.storyPoints !== null && task.storyPoints !== undefined && (
                <View style={[styles.storyPointsBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.storyPointsText, { color: colors.primary }]}>
                    {task.storyPoints} pts
                  </Text>
                </View>
              )}
            </View>

            {/* Due date */}
            {formattedDate && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Due Date</Text>
                <Text
                  style={[
                    styles.value,
                    { color: isOverdue ? colors.error : colors.text },
                  ]}
                >
                  📅 {formattedDate} {isOverdue && '(Overdue)'}
                </Text>
              </View>
            )}

            {/* Description */}
            {task.description && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Description</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                  {task.description}
                </Text>
              </View>
            )}

            {/* Epics */}
            {taskEpics.length > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Epics</Text>
                <View style={styles.epicsList}>
                  {taskEpics.map((epic) => (
                    <View
                      key={epic.id}
                      style={[styles.epicBadge, { backgroundColor: epic.color + '20' }]}
                    >
                      <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
                      <Text style={[styles.epicText, { color: epic.color }]}>{epic.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{task.comments.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Comments</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{task.attachments.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Attachments</Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailsButton, { backgroundColor: colors.primary }]}
              onPress={onViewDetails}
            >
              <Text style={styles.detailsButtonText}>View Full Details</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  priorityBar: {
    height: 4,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 28,
  },
  sectionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  storyPointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  storyPointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  epicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  epicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  epicDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  epicText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    marginTop: 8,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TaskPreviewModal;
