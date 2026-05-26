import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchEpics,
  createEpic,
  updateEpic,
  deleteEpic,
} from '@/store/slices';
import { selectEpicsByBoardId, selectTasksByBoardId } from '@/store/selectors';
import { ThemedBackground } from '@/components';
import { ConfirmDialog } from '@/components/chakra';
import { useTheme } from '@/theme/ThemeContext';
import { useAppToast } from '@/hooks/useToast';
import type { Epic, Task } from '@kanban/shared';

interface EpicListScreenProps {
  boardId: string;
  onBack?: () => void;
  onTaskPress?: (taskId: string) => void;
}

interface CreateEpicModalProps {
  visible: boolean;
  editingEpic: Epic | null;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string) => void;
  isLoading: boolean;
}

const EPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

/**
 * CreateEpicModal - Modal for creating/editing an epic
 */
function CreateEpicModal({
  visible,
  editingEpic,
  onClose,
  onSubmit,
  isLoading,
}: CreateEpicModalProps): React.JSX.Element {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(EPIC_COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingEpic) {
      setName(editingEpic.name);
      setDescription(editingEpic.description || '');
      setColor(editingEpic.color);
    } else {
      setName('');
      setDescription('');
      setColor(EPIC_COLORS[Math.floor(Math.random() * EPIC_COLORS.length)]);
    }
    setError('');
  }, [editingEpic, visible]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError('Epic name is required');
      return;
    }
    onSubmit(name.trim(), description.trim(), color);
  }, [name, description, color, onSubmit]);

  const handleClose = useCallback(() => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {editingEpic ? 'Edit Epic' : 'Create Epic'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }, error && styles.inputError]}
              placeholder="Enter epic name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
              autoFocus
              editable={!isLoading}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter description (optional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
            <View style={styles.colorPicker}>
              {EPIC_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={handleClose} disabled={isLoading}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: color }, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{editingEpic ? 'Save' : 'Create'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface EpicCardProps {
  epic: Epic;
  tasks: Task[];
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTaskPress: (taskId: string) => void;
}

/**
 * EpicCard - Individual epic card with linked tasks
 */
function EpicCard({ epic, tasks, onPress, onEdit, onDelete, onTaskPress }: EpicCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const completedTasks = tasks.filter(t => t.sectionId); // Simplified - would need done section check
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <View style={[styles.epicCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={[styles.epicColorBar, { backgroundColor: epic.color }]} />
      
      <TouchableOpacity style={styles.epicContent} onPress={() => setExpanded(!expanded)}>
        <View style={styles.epicHeader}>
          <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
          <Text style={[styles.epicName, { color: colors.text }]}>{epic.name}</Text>
          <Text style={[styles.expandIcon, { color: colors.textMuted }]}>
            {expanded ? '▼' : '▶'}
          </Text>
        </View>
        
        {epic.description && (
          <Text style={[styles.epicDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {epic.description}
          </Text>
        )}

        <View style={styles.epicMeta}>
          <Text style={[styles.taskCount, { color: colors.textMuted }]}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Text>
          {tasks.length > 0 && (
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { backgroundColor: epic.color, width: `${progress}%` }]} />
            </View>
          )}
        </View>

        <View style={styles.epicActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && tasks.length > 0 && (
        <View style={[styles.tasksList, { borderTopColor: colors.border }]}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, { borderBottomColor: colors.borderLight }]}
              onPress={() => onTaskPress(task.id)}
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
      )}
    </View>
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

/**
 * EpicListScreen - View and manage epics for a board
 */
export function EpicListScreen({
  boardId,
  onBack,
  onTaskPress,
}: EpicListScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();

  const epics = useAppSelector((state) => selectEpicsByBoardId(state, boardId));
  const allTasks = useAppSelector((state) => selectTasksByBoardId(state, boardId));
  const isLoading = useAppSelector((state) => state.epics.isLoading);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [epicToDelete, setEpicToDelete] = useState<Epic | null>(null);

  // Toast hook
  const toast = useAppToast();

  useEffect(() => {
    dispatch(fetchEpics(boardId));
  }, [dispatch, boardId]);

  // Group tasks by epic
  const tasksByEpicId = useMemo(() => {
    const result: Record<string, Task[]> = {};
    epics.forEach((epic) => {
      result[epic.id] = allTasks.filter((task) => task.epicIds.includes(epic.id));
    });
    return result;
  }, [epics, allTasks]);

  const handleCreateEpic = useCallback(
    async (name: string, description: string, color: string) => {
      setIsSaving(true);
      try {
        await dispatch(createEpic({ boardId, data: { name, description: description || undefined, color } })).unwrap();
        setCreateModalVisible(false);
        toast.showSuccess('Epic Created', `"${name}" has been created successfully.`);
      } catch {
        toast.showError('Error', 'Failed to create epic');
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch, boardId, toast]
  );

  const handleUpdateEpic = useCallback(
    async (name: string, description: string, color: string) => {
      if (!editingEpic) return;
      setIsSaving(true);
      try {
        await dispatch(updateEpic({ id: editingEpic.id, data: { name, description: description || undefined, color } })).unwrap();
        setEditingEpic(null);
        toast.showSuccess('Epic Updated', `"${name}" has been updated successfully.`);
      } catch {
        toast.showError('Error', 'Failed to update epic');
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch, editingEpic, toast]
  );

  const handleDeleteEpic = useCallback(
    (epic: Epic) => {
      setEpicToDelete(epic);
    },
    []
  );

  const confirmDeleteEpic = useCallback(
    async () => {
      if (!epicToDelete) return;
      const epicName = epicToDelete.name;
      try {
        await dispatch(deleteEpic({ epicId: epicToDelete.id, boardId })).unwrap();
        toast.showSuccess('Epic Deleted', `"${epicName}" has been deleted.`);
      } catch {
        toast.showError('Error', 'Failed to delete epic');
      } finally {
        setEpicToDelete(null);
      }
    },
    [dispatch, boardId, epicToDelete, toast]
  );

  const handleTaskPress = useCallback(
    (taskId: string) => {
      onTaskPress?.(taskId);
    },
    [onTaskPress]
  );

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={[styles.backButtonText, { color: colors.headerText }]}>← Back</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { color: colors.headerText }]}>Epics</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ New Epic</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading && epics.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading epics...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {epics.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏷</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No epics yet</Text>
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                  Create epics to group related tasks together
                </Text>
              </View>
            ) : (
              epics.map((epic) => (
                <EpicCard
                  key={epic.id}
                  epic={epic}
                  tasks={tasksByEpicId[epic.id] || []}
                  onPress={() => {}}
                  onEdit={() => setEditingEpic(epic)}
                  onDelete={() => handleDeleteEpic(epic)}
                  onTaskPress={handleTaskPress}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* Create/Edit Modal */}
        <CreateEpicModal
          visible={createModalVisible || editingEpic !== null}
          editingEpic={editingEpic}
          onClose={() => {
            setCreateModalVisible(false);
            setEditingEpic(null);
          }}
          onSubmit={editingEpic ? handleUpdateEpic : handleCreateEpic}
          isLoading={isSaving}
        />

        {/* Delete Epic Confirmation */}
        <ConfirmDialog
          open={epicToDelete !== null}
          onClose={() => setEpicToDelete(null)}
          onConfirm={confirmDeleteEpic}
          title="Delete Epic"
          message={`Are you sure you want to delete "${epicToDelete?.name}"? Tasks will be unlinked but not deleted.`}
          variant="danger"
          confirmText="Delete"
        />
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 4 },
  backButtonText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  epicCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  epicColorBar: { height: 4 },
  epicContent: { padding: 16 },
  epicHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  epicDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  epicName: { flex: 1, fontSize: 16, fontWeight: '600' },
  expandIcon: { fontSize: 12 },
  epicDescription: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  epicMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taskCount: { fontSize: 13, marginRight: 12 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  epicActions: { flexDirection: 'row' },
  actionButton: { marginRight: 16 },
  actionText: { fontSize: 13, fontWeight: '600' },
  tasksList: { borderTopWidth: 1, paddingTop: 8 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  taskTitle: { flex: 1, fontSize: 14 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  inputError: { borderColor: '#ef4444' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
  cancelButton: { flex: 1, padding: 16, alignItems: 'center', marginRight: 8, borderRadius: 12, borderWidth: 1 },
  cancelButtonText: { fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, padding: 16, alignItems: 'center', marginLeft: 8, borderRadius: 12 },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

export default EpicListScreen;
