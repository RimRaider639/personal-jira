import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text as ChakraText,
  Icon,
} from '@chakra-ui/react';
import { Menu, Portal } from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorMode';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchAllEpics,
  fetchAllTasks,
  fetchAllSections,
  fetchBoards,
  updateEpic,
  deleteEpic,
  changeTaskSection,
} from '@/store/slices';
import { selectAllEpics, selectAllTasks, selectAllSections, selectAllBoards } from '@/store/selectors';
import { DatePicker } from '@/components';
import { getStatusColor, getPriorityColor, getDeadlineInfo } from '@/components/chakra';
import { useTheme } from '@/theme/ThemeContext';
import { CheckIcon, ChevronDownIcon } from '@/theme/icons';
import type { Epic, Task, Board, Section } from '@kanban/shared';

interface EpicDetailScreenProps {
  epicId: string;
  onBack?: () => void;
  onDelete?: () => void;
  onTaskPress?: (taskId: string, boardId: string) => void;
}

const EPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const PRIORITIES: { value: string; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#22c55e' },
];

/**
 * EpicDetailScreen - Dedicated page for viewing/editing epic details
 * Similar to TaskDetailScreen with inline editing capabilities
 */
export function EpicDetailScreen({
  epicId,
  onBack,
  onDelete,
  onTaskPress,
}: EpicDetailScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const epics = useAppSelector(selectAllEpics);
  const allTasks = useAppSelector(selectAllTasks);
  const allSections = useAppSelector(selectAllSections);
  const allBoards = useAppSelector(selectAllBoards);
  const isLoading = useAppSelector((state) => state.epics.isLoading);

  const epic = useMemo(() => epics.find(e => e.id === epicId), [epics, epicId]);

  // Editing state for individual fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Linked tasks - sorted by deadline
  const linkedTasks = useMemo(() => {
    if (!epic) return [];
    const tasks = allTasks.filter(task => task.epicIds?.includes(epic.id));
    // Sort by deadline (tasks with deadlines first, then by date)
    return tasks.sort((a, b) => {
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });
  }, [epic, allTasks]);

  // Progress calculation
  const { completedCount, progress } = useMemo(() => {
    if (linkedTasks.length === 0) {
      return { completedCount: 0, progress: 0 };
    }
    const doneSectionIds = allSections
      .filter(section => section.name.toLowerCase() === 'done')
      .map(section => section.id);
    const completed = linkedTasks.filter(task => doneSectionIds.includes(task.sectionId)).length;
    const progressPercent = Math.round((completed / linkedTasks.length) * 100);
    return { completedCount: completed, progress: progressPercent };
  }, [linkedTasks, allSections]);

  // Epic deadline info
  const epicDeadlineInfo = useMemo(() => {
    const epicEndDate = (epic as Epic & { endDate?: string })?.endDate;
    if (!epicEndDate) return null;
    
    const deadline = new Date(epicEndDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      date: deadline,
      daysRemaining: diffDays,
      isOverdue: diffDays < 0,
      isUrgent: diffDays >= 0 && diffDays <= 2,
    };
  }, [epic]);

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

  // Status change state
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Theme colors for Chakra components
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    dispatch(fetchAllEpics());
    dispatch(fetchAllTasks());
    dispatch(fetchAllSections());
    dispatch(fetchBoards());
  }, [dispatch]);

  useEffect(() => {
    if (epic) {
      setEditName(epic.name);
      setEditDescription(epic.description || '');
      setEditColor(epic.color);
      // Handle endDate formatting
      const epicEndDate = (epic as Epic & { endDate?: string }).endDate;
      if (epicEndDate) {
        const date = new Date(epicEndDate);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          setEditEndDate(`${year}-${month}-${day}`);
        } else {
          setEditEndDate('');
        }
      } else {
        setEditEndDate('');
      }
    }
  }, [epic]);

  const handleSaveField = useCallback(async (field: string) => {
    if (!epic) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      
      switch (field) {
        case 'name':
          if (!editName.trim()) {
            Alert.alert('Error', 'Epic name is required');
            setIsSaving(false);
            return;
          }
          updateData.name = editName.trim();
          break;
        case 'description':
          updateData.description = editDescription.trim();
          break;
        case 'color':
          updateData.color = editColor;
          break;
        case 'endDate':
          updateData.endDate = editEndDate || undefined;
          break;
      }

      await dispatch(updateEpic({
        id: epic.id,
        data: updateData as Partial<{ name: string; description: string; color: string; boardId: string; endDate?: string }>,
      })).unwrap();
      
      setEditingField(null);
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, epic, editName, editDescription, editColor, editEndDate]);

  const handleDelete = useCallback(async () => {
    if (!epic) return;

    Alert.alert('Delete Epic', 'Are you sure you want to delete this epic? Tasks will not be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteEpic({ epicId: epic.id, boardId: epic.boardId })).unwrap();
            onDelete?.();
            onBack?.();
          } catch {
            Alert.alert('Error', 'Failed to delete epic');
          }
        },
      },
    ]);
  }, [dispatch, epic, onDelete, onBack]);

  const startEditing = useCallback((field: string) => {
    setEditingField(field);
  }, []);

  const cancelEditing = useCallback(() => {
    if (epic) {
      setEditName(epic.name);
      setEditDescription(epic.description || '');
      setEditColor(epic.color);
      const epicEndDate = (epic as Epic & { endDate?: string }).endDate;
      if (epicEndDate) {
        const date = new Date(epicEndDate);
        if (!isNaN(date.getTime())) {
          setEditEndDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
        }
      }
    }
    setEditingField(null);
  }, [epic]);

  // Handle task status change
  const handleStatusChange = useCallback(async (taskId: string, newSectionId: string, oldSectionId: string) => {
    if (newSectionId === oldSectionId) return;
    
    setIsChangingStatus(true);
    try {
      await dispatch(changeTaskSection({ taskId, sectionId: newSectionId, oldSectionId })).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to change task status');
    } finally {
      setIsChangingStatus(false);
    }
  }, [dispatch]);

  // Get sections for a board (for status dropdown)
  const getSectionsForBoard = useCallback((boardId: string): Section[] => {
    return allSections.filter(s => s.boardId === boardId);
  }, [allSections]);

  if (!epic) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading epic...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: epic.color }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {editingField === 'name' ? (
            <View>
              <TextInput
                style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.primary }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Epic name"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={cancelEditing} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleSaveField('name')} 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => startEditing('name')}>
              <Text style={[styles.title, { color: colors.text }]}>{epic.name}</Text>
              <Text style={[styles.editHint, { color: colors.textMuted }]}>Tap to edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Color */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Color</Text>
          {editingField === 'color' ? (
            <View>
              <View style={styles.colorPicker}>
                {EPIC_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorOption, { backgroundColor: c }, editColor === c && styles.colorSelected]}
                    onPress={() => setEditColor(c)}
                  />
                ))}
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity onPress={cancelEditing} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleSaveField('color')} 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  disabled={isSaving}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => startEditing('color')} style={styles.colorDisplay}>
              <View style={[styles.colorPreview, { backgroundColor: epic.color }]} />
              <Text style={[styles.colorValue, { color: colors.text }]}>{epic.color}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
          {editingField === 'description' ? (
            <View>
              <TextInput
                style={[styles.descriptionInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Add a description..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={cancelEditing} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleSaveField('description')} 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  disabled={isSaving}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => startEditing('description')}>
              <Text style={epic.description ? [styles.description, { color: colors.text }] : [styles.emptyValue, { color: colors.textMuted }]}>
                {epic.description || 'No description - tap to add'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* End Date */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Target End Date</Text>
          {editingField === 'endDate' ? (
            <View>
              <DatePicker
                value={editEndDate}
                onChange={setEditEndDate}
                placeholder="Select date"
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={cancelEditing} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleSaveField('endDate')} 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  disabled={isSaving}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => startEditing('endDate')}>
              <View style={styles.deadlineContainer}>
                <Text style={editEndDate ? [styles.dateValue, { color: colors.text }] : [styles.emptyValue, { color: colors.textMuted }]}>
                  {editEndDate ? new Date(editEndDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date set - tap to add'}
                </Text>
                {epicDeadlineInfo && (
                  <View style={[
                    styles.deadlineBadge,
                    epicDeadlineInfo.isOverdue && styles.deadlineOverdue,
                    epicDeadlineInfo.isUrgent && !epicDeadlineInfo.isOverdue && styles.deadlineUrgent,
                  ]}>
                    <Text style={[
                      styles.deadlineBadgeText,
                      epicDeadlineInfo.isOverdue && styles.deadlineOverdueText,
                      epicDeadlineInfo.isUrgent && !epicDeadlineInfo.isOverdue && styles.deadlineUrgentText,
                    ]}>
                      {epicDeadlineInfo.isOverdue 
                        ? `${Math.abs(epicDeadlineInfo.daysRemaining)} days overdue`
                        : epicDeadlineInfo.daysRemaining === 0
                          ? 'Due today'
                          : `${epicDeadlineInfo.daysRemaining} day${epicDeadlineInfo.daysRemaining === 1 ? '' : 's'} remaining`
                      }
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress */}
        {linkedTasks.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Progress</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { backgroundColor: epic.color, width: `${progress}%` }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {completedCount}/{linkedTasks.length} tasks completed ({progress}%)
              </Text>
            </View>
          </View>
        )}

        {/* Linked Tasks */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Linked Tasks ({linkedTasks.length})
          </Text>
          {linkedTasks.length === 0 ? (
            <Text style={[styles.emptyValue, { color: colors.textMuted }]}>
              No tasks linked to this epic yet
            </Text>
          ) : (
            Object.entries(tasksByBoard).map(([boardId, tasks]) => {
              const board = allBoards.find(b => b.id === boardId);
              const boardSections = getSectionsForBoard(boardId);
              return (
                <View key={boardId} style={styles.boardTaskGroup}>
                  <Text style={[styles.boardGroupTitle, { color: colors.textMuted }]}>
                    {board?.name || 'Unknown Board'}
                  </Text>
                  <VStack gap={2} w="full">
                    {tasks.map(task => {
                      const section = allSections.find(s => s.id === task.sectionId);
                      const statusColor = getStatusColor(section?.name);
                      const priorityColor = getPriorityColor(task.priority);
                      const deadlineInfo = getDeadlineInfo(task.endDate);
                      
                      return (
                        <Box
                          key={task.id}
                          bg={cardBg}
                          borderWidth="1px"
                          borderColor={cardBorder}
                          borderRadius="md"
                          p={3}
                          w="full"
                        >
                          {/* Single row layout: Title | Priority | Deadline | Status */}
                          <HStack justify="space-between" align="center" gap={3} w="full">
                            {/* Left side: Title (takes remaining space) */}
                            <ChakraText
                              fontWeight="medium"
                              fontSize="sm"
                              color={textColor}
                              lineClamp={1}
                              cursor="pointer"
                              flex={1}
                              minW={0}
                              _hover={{ color: 'brand.500' }}
                              onClick={() => onTaskPress?.(task.id, boardId)}
                            >
                              {task.title}
                            </ChakraText>
                            
                            {/* Right side: Priority, Deadline, Status */}
                            <HStack gap={2} flexShrink={0}>
                              {/* Priority Badge */}
                              {task.priority && (
                                <Box
                                  px={2}
                                  py={0.5}
                                  borderRadius="md"
                                  bg={`${priorityColor}20`}
                                >
                                  <ChakraText fontSize="xs" fontWeight="medium" color={priorityColor} textTransform="capitalize">
                                    {task.priority}
                                  </ChakraText>
                                </Box>
                              )}
                              
                              {/* Deadline Badge */}
                              {deadlineInfo && (
                                <Box
                                  px={2}
                                  py={0.5}
                                  borderRadius="md"
                                  bg={deadlineInfo.isOverdue ? 'red.100' : deadlineInfo.isUrgent ? 'orange.100' : 'gray.100'}
                                  _dark={{
                                    bg: deadlineInfo.isOverdue ? 'red.900' : deadlineInfo.isUrgent ? 'orange.900' : 'gray.700',
                                  }}
                                >
                                  <ChakraText
                                    fontSize="xs"
                                    fontWeight="medium"
                                    color={deadlineInfo.color}
                                  >
                                    {deadlineInfo.text}
                                  </ChakraText>
                                </Box>
                              )}
                              
                              {/* Status Dropdown */}
                              <Menu.Root>
                                <Menu.Trigger asChild>
                                  <Box
                                    as="button"
                                    px={2}
                                    py={0.5}
                                    borderRadius="md"
                                    bg={`${statusColor}20`}
                                    borderWidth="1px"
                                    borderColor={statusColor}
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    cursor={isChangingStatus ? 'not-allowed' : 'pointer'}
                                    _hover={{ opacity: 0.8 }}
                                    opacity={isChangingStatus ? 0.6 : 1}
                                    minW="90px"
                                  >
                                    <ChakraText fontSize="xs" fontWeight="medium" color={statusColor}>
                                      {section?.name || 'Unknown'}
                                    </ChakraText>
                                    <Icon boxSize={3} color={statusColor}>
                                      <ChevronDownIcon />
                                    </Icon>
                                  </Box>
                                </Menu.Trigger>
                                <Portal>
                                  <Menu.Positioner>
                                    <Menu.Content
                                      minW="150px"
                                      bg={cardBg}
                                      borderColor={cardBorder}
                                      boxShadow="lg"
                                      zIndex={1000}
                                    >
                                      {boardSections.map((s) => {
                                        const sectionStatusColor = getStatusColor(s.name);
                                        const isSelected = s.id === task.sectionId;
                                        return (
                                          <Menu.Item
                                            key={s.id}
                                            value={s.id}
                                            onClick={() => handleStatusChange(task.id, s.id, task.sectionId)}
                                            disabled={isChangingStatus}
                                          >
                                            <HStack justify="space-between" w="full">
                                              <HStack gap={2}>
                                                <Box
                                                  w="8px"
                                                  h="8px"
                                                  borderRadius="full"
                                                  bg={sectionStatusColor}
                                                />
                                                <ChakraText
                                                  fontSize="sm"
                                                  fontWeight={isSelected ? 'semibold' : 'normal'}
                                                  color={isSelected ? sectionStatusColor : textColor}
                                                >
                                                  {s.name}
                                                </ChakraText>
                                              </HStack>
                                              {isSelected && (
                                                <Icon boxSize={4} color={sectionStatusColor}>
                                                  <CheckIcon />
                                                </Icon>
                                              )}
                                            </HStack>
                                          </Menu.Item>
                                        );
                                      })}
                                    </Menu.Content>
                                  </Menu.Positioner>
                                </Portal>
                              </Menu.Root>
                            </HStack>
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </View>
              );
            })
          )}
        </View>

        {/* Metadata */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Details</Text>
          <View style={styles.metadata}>
            <Text style={[styles.metaItem, { color: colors.textMuted }]}>
              Board: {allBoards.find(b => b.id === epic.boardId)?.name || 'Unknown'}
            </Text>
            <Text style={[styles.metaItem, { color: colors.textMuted }]}>
              Created: {new Date(epic.createdAt).toLocaleString()}
            </Text>
            <Text style={[styles.metaItem, { color: colors.textMuted }]}>
              Updated: {new Date(epic.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    paddingBottom: 8,
  },
  editHint: {
    fontSize: 12,
    marginTop: 4,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
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
  colorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  colorValue: {
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  emptyValue: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  dateValue: {
    fontSize: 16,
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
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskSection: {
    fontSize: 12,
    marginTop: 2,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 8,
  },
  statusDropdown: {
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 12,
    marginRight: 12,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusOptionText: {
    fontSize: 14,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  deadlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  deadlineBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  deadlineOverdue: {
    backgroundColor: '#fee2e2',
  },
  deadlineOverdueText: {
    color: '#dc2626',
  },
  deadlineUrgent: {
    backgroundColor: '#fef3c7',
  },
  deadlineUrgentText: {
    color: '#d97706',
  },
  taskDeadlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskDeadlineText: {
    fontSize: 10,
    fontWeight: '500',
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
  metadata: {
    gap: 4,
  },
  metaItem: {
    fontSize: 13,
  },
});

export default EpicDetailScreen;
