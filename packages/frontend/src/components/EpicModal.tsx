import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { DatePicker } from './DatePicker';
import type { Epic, Task, Board, Section } from '@kanban/shared';

interface EpicModalProps {
  visible: boolean;
  epic: Epic | null;
  linkedTasks: Task[];
  allBoards: Board[];
  allSections: Section[];
  linkedBoardIds: string[];
  onClose: () => void;
  onSave: (data: { name: string; description: string; color: string; endDate?: string; boardIds: string[] }) => void;
  onDelete?: () => void;
  onTaskPress?: (taskId: string, boardId: string) => void;
  isLoading?: boolean;
  isNew?: boolean;
}

const EPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

/**
 * EpicModal - Modal for viewing/editing epic details
 * Shows linked tasks and allows scoping to boards
 */
export function EpicModal({
  visible,
  epic,
  linkedTasks,
  allBoards,
  allSections,
  linkedBoardIds,
  onClose,
  onSave,
  onDelete,
  onTaskPress,
  isLoading = false,
  isNew = false,
}: EpicModalProps): React.JSX.Element {
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(EPIC_COLORS[0]);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Reset form when epic changes
  useEffect(() => {
    if (epic) {
      setName(epic.name);
      setDescription(epic.description || '');
      setColor(epic.color);
      // Properly handle endDate - ensure it's in YYYY-MM-DD format
      const epicEndDate = (epic as Epic & { endDate?: string }).endDate;
      if (epicEndDate) {
        // Parse the date and format it correctly
        const date = new Date(epicEndDate);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          setEndDate(`${year}-${month}-${day}`);
        } else {
          setEndDate('');
        }
      } else {
        setEndDate('');
      }
    } else {
      setName('');
      setDescription('');
      setColor(EPIC_COLORS[Math.floor(Math.random() * EPIC_COLORS.length)]);
      setEndDate('');
    }
    setError('');
  }, [epic, visible]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setError('Epic name is required');
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      color,
      endDate: endDate || undefined,
      boardIds: linkedBoardIds, // Pass the existing linked boards
    });
  }, [name, description, color, endDate, linkedBoardIds, onSave]);

  // Group tasks by board
  const tasksByBoard = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    linkedTasks.forEach(task => {
      if (!grouped[task.boardId]) {
        grouped[task.boardId] = [];
      }
      grouped[task.boardId].push(task);
    });
    return grouped;
  }, [linkedTasks]);

  // Calculate completed tasks based on "done" sections
  const { completedCount, progress } = useMemo(() => {
    if (linkedTasks.length === 0) {
      return { completedCount: 0, progress: 0 };
    }
    
    // Find all "done" section IDs (case-insensitive match)
    const doneSectionIds = allSections
      .filter(section => section.name.toLowerCase() === 'done')
      .map(section => section.id);
    
    // Count tasks in done sections
    const completed = linkedTasks.filter(task => doneSectionIds.includes(task.sectionId)).length;
    const progressPercent = Math.round((completed / linkedTasks.length) * 100);
    
    return { completedCount: completed, progress: progressPercent };
  }, [linkedTasks, allSections]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.container, { backgroundColor: colors.surface }]} 
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.colorBar, { backgroundColor: color }]} />
            <Text style={[styles.title, { color: colors.text }]}>
              {isNew ? 'Create Epic' : 'Epic Details'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: error ? colors.error : colors.border, color: colors.text }]}
                placeholder="Epic name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={t => { setName(t); setError(''); }}
                editable={!isLoading}
              />
              {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                placeholder="Describe this epic..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>

            {/* Color */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
              <View style={styles.colorPicker}>
                {EPIC_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorSelected]}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>
            </View>

            {/* End Date */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Target End Date</Text>
              <DatePicker value={endDate} onChange={setEndDate} placeholder="Select date" />
            </View>

            {/* Scope / Boards - Read-only display of linked boards */}
            {!isNew && linkedBoardIds.length > 0 && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Linked Boards</Text>
                <View style={styles.boardTags}>
                  {linkedBoardIds.map(boardId => {
                    const board = allBoards.find(b => b.id === boardId);
                    return board ? (
                      <View key={boardId} style={[styles.boardTag, { backgroundColor: (board.color || '#6366f1') + '20' }]}>
                        <View style={[styles.boardTagDot, { backgroundColor: board.color || '#6366f1' }]} />
                        <Text style={[styles.boardTagText, { color: colors.text }]}>{board.name}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
                <Text style={[styles.scopeHint, { color: colors.textMuted }]}>
                  Boards are linked when tasks in those boards are assigned to this epic
                </Text>
              </View>
            )}

            {/* Progress (only for existing epics) */}
            {!isNew && linkedTasks.length > 0 && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: color, width: `${progress}%` }]} />
                  </View>
                  <Text style={[styles.progressText, { color: colors.textMuted }]}>
                    {completedCount}/{linkedTasks.length} tasks ({progress}%)
                  </Text>
                </View>
              </View>
            )}

            {/* Linked Tasks (only for existing epics) */}
            {!isNew && linkedTasks.length > 0 && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Linked Tasks</Text>
                {Object.entries(tasksByBoard).map(([boardId, tasks]) => {
                  const board = allBoards.find(b => b.id === boardId);
                  return (
                    <View key={boardId} style={styles.boardTaskGroup}>
                      <Text style={[styles.boardGroupTitle, { color: colors.textMuted }]}>
                        {board?.name || 'Unknown Board'}
                      </Text>
                      {tasks.map(task => (
                        <TouchableOpacity
                          key={task.id}
                          style={[styles.taskItem, { borderColor: colors.borderLight }]}
                          onPress={() => onTaskPress?.(task.id, boardId)}
                        >
                          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
                            {task.title}
                          </Text>
                          {task.priority && (
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                                {task.priority}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            {!isNew && onDelete && (
              <TouchableOpacity 
                style={[styles.deleteButton, { borderColor: colors.error }]} 
                onPress={onDelete}
                disabled={isLoading}
              >
                <Text style={[styles.deleteText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: color }, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveText}>{isNew ? 'Create' : 'Save'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#dc2626';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#9ca3af';
  }
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
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  colorBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  boardSelector: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  boardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  boardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  boardName: {
    flex: 1,
    fontSize: 14,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  boardTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  boardTagText: {
    fontSize: 13,
  },
  noBoards: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  scopeHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
  },
  boardTaskGroup: {
    marginBottom: 16,
  },
  boardGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 6,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EpicModal;
