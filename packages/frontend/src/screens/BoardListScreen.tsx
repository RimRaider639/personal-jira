import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchBoards,
  createBoard,
  deleteBoard,
  logout,
  clearBoardsError,
  fetchAllEpics,
  fetchAllTasks,
  fetchAllSections,
  createEpic,
  updateEpic,
  deleteEpic,
  fetchBoardStats,
  fetchActivityHeatmap,
  fetchPinnedTasks,
  toggleTaskPin,
  createTask,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/store/slices';
import { selectAllBoards, selectCurrentUser, selectAllEpics, selectAllTasks, selectAllSections, selectPinnedTasks, selectAllNotes } from '@/store/selectors';
import { ThemedBackground, DarkModeToggle, EpicModal, ProfileAvatar } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
import type { Board, Epic, Task, BoardStats, ActivityHeatmapEntry, Note, Section } from '@kanban/shared';
import type { RootStackParamList } from '@/navigation/RootNavigator';

interface CreateBoardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  isLoading: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

/**
 * CreateBoardModal - Modal for creating a new board
 */
function CreateBoardModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  colors,
}: CreateBoardModalProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }
    onSubmit(name.trim(), description.trim());
  }, [name, description, onSubmit]);

  const handleClose = useCallback(() => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
          <Text style={[modalStyles.title, { color: colors.text }]}>Create New Board</Text>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.label, { color: colors.text }]}>Board Name *</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, error && modalStyles.inputError]}
              placeholder="Enter board name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              autoFocus
              editable={!isLoading}
            />
            {error && <Text style={modalStyles.errorText}>{error}</Text>}
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.label, { color: colors.text }]}>Description (optional)</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter board description"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={[modalStyles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[modalStyles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, { backgroundColor: colors.primary }, isLoading && modalStyles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Note colors for sticky notes
 */
const NOTE_COLORS = [
  '#fef08a', // Yellow
  '#fca5a5', // Red
  '#86efac', // Green
  '#93c5fd', // Blue
  '#c4b5fd', // Purple
  '#fdba74', // Orange
];

interface CreateNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, color: string) => void;
  isLoading: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

/**
 * CreateNoteModal - Modal for creating a new sticky note
 */
function CreateNoteModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  colors,
}: CreateNoteModalProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!content.trim()) {
      setError('Note content is required');
      return;
    }
    if (content.length > 500) {
      setError('Note cannot exceed 500 characters');
      return;
    }
    onSubmit(content.trim(), selectedColor);
  }, [content, selectedColor, onSubmit]);

  const handleClose = useCallback(() => {
    setContent('');
    setSelectedColor(NOTE_COLORS[0]);
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
          <Text style={[modalStyles.title, { color: colors.text }]}>New Sticky Note</Text>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.label, { color: colors.text }]}>Content *</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, minHeight: 100 }, error && modalStyles.inputError]}
              placeholder="Write your note..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={(text) => {
                setContent(text);
                setError('');
              }}
              multiline
              numberOfLines={4}
              autoFocus
              editable={!isLoading}
              maxLength={500}
            />
            <Text style={[noteModalStyles.charCount, { color: colors.textMuted }]}>
              {content.length}/500
            </Text>
            {error && <Text style={modalStyles.errorText}>{error}</Text>}
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.label, { color: colors.text }]}>Color</Text>
            <View style={noteModalStyles.colorPicker}>
              {NOTE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    noteModalStyles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && noteModalStyles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={[modalStyles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[modalStyles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, { backgroundColor: colors.primary }, isLoading && modalStyles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface CreateFridgeTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, boardId: string, sectionId: string) => void;
  isLoading: boolean;
  boards: Board[];
  sections: Section[];
  colors: ReturnType<typeof useTheme>['colors'];
}

/**
 * CreateFridgeTaskModal - Modal for creating a new task from the Fridge
 */
function CreateFridgeTaskModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  boards,
  sections,
  colors,
}: CreateFridgeTaskModalProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [error, setError] = useState('');

  // Get sections for selected board
  const boardSections = useMemo(() => {
    if (!selectedBoardId) return [];
    return sections.filter(s => s.boardId === selectedBoardId).sort((a, b) => a.position - b.position);
  }, [selectedBoardId, sections]);

  // Auto-select first board and section
  useEffect(() => {
    if (visible && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [visible, boards, selectedBoardId]);

  useEffect(() => {
    if (boardSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(boardSections[0].id);
    } else if (boardSections.length > 0 && !boardSections.find(s => s.id === selectedSectionId)) {
      setSelectedSectionId(boardSections[0].id);
    }
  }, [boardSections, selectedSectionId]);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!selectedBoardId) {
      setError('Please select a board');
      return;
    }
    if (!selectedSectionId) {
      setError('Please select a section');
      return;
    }
    onSubmit(title.trim(), selectedBoardId, selectedSectionId);
  }, [title, selectedBoardId, selectedSectionId, onSubmit]);

  const handleClose = useCallback(() => {
    setTitle('');
    setSelectedBoardId('');
    setSelectedSectionId('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
          <Text style={[modalStyles.title, { color: colors.text }]}>New Task</Text>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, error && modalStyles.inputError]}
              placeholder="Enter task title"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError('');
              }}
              autoFocus
              editable={!isLoading}
            />
            {error && <Text style={modalStyles.errorText}>{error}</Text>}
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.label, { color: colors.text }]}>Board *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fridgeTaskModalStyles.optionScroll}>
              {boards.map((board) => (
                <TouchableOpacity
                  key={board.id}
                  style={[
                    fridgeTaskModalStyles.optionButton,
                    { borderColor: colors.border },
                    selectedBoardId === board.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedBoardId(board.id)}
                >
                  <Text style={[
                    fridgeTaskModalStyles.optionText,
                    { color: selectedBoardId === board.id ? '#fff' : colors.text },
                  ]}>
                    {board.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={modalStyles.inputGroup}>
            <Text style={[modalStyles.label, { color: colors.text }]}>Section *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fridgeTaskModalStyles.optionScroll}>
              {boardSections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    fridgeTaskModalStyles.optionButton,
                    { borderColor: colors.border },
                    selectedSectionId === section.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedSectionId(section.id)}
                >
                  <Text style={[
                    fridgeTaskModalStyles.optionText,
                    { color: selectedSectionId === section.id ? '#fff' : colors.text },
                  ]}>
                    {section.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={[modalStyles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[modalStyles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, { backgroundColor: colors.primary }, isLoading && modalStyles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={modalStyles.submitButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * StickyNoteCard - Individual sticky note card
 */
interface StickyNoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function StickyNoteCard({ note, onEdit, onDelete, colors }: StickyNoteCardProps): React.JSX.Element {
  const handleLongPress = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.confirm(`Delete this note?`)) {
        onDelete(note.id);
      }
    } else {
      Alert.alert(
        'Delete Note',
        'Are you sure you want to delete this note?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(note.id) },
        ]
      );
    }
  }, [note.id, onDelete]);

  return (
    <TouchableOpacity
      style={[fridgeStyles.stickyNote, { backgroundColor: note.color }]}
      onPress={() => onEdit(note)}
      onLongPress={handleLongPress}
    >
      <Text style={fridgeStyles.stickyNoteText} numberOfLines={6}>
        {note.content}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * EditNoteContent - Content for editing a note in a modal
 */
interface EditNoteContentProps {
  note: Note;
  onSave: (content: string, color: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function EditNoteContent({ note, onSave, onClose, colors }: EditNoteContentProps): React.JSX.Element {
  const [content, setContent] = useState(note.content);
  const [selectedColor, setSelectedColor] = useState(note.color);
  const [error, setError] = useState('');

  const handleSave = useCallback(() => {
    if (!content.trim()) {
      setError('Note content is required');
      return;
    }
    if (content.length > 500) {
      setError('Note cannot exceed 500 characters');
      return;
    }
    onSave(content.trim(), selectedColor);
  }, [content, selectedColor, onSave]);

  return (
    <>
      <View style={modalStyles.inputGroup}>
        <Text style={[modalStyles.label, { color: colors.text }]}>Content *</Text>
        <TextInput
          style={[modalStyles.input, modalStyles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, minHeight: 100 }, error && modalStyles.inputError]}
          placeholder="Write your note..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={(text) => {
            setContent(text);
            setError('');
          }}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={[noteModalStyles.charCount, { color: colors.textMuted }]}>
          {content.length}/500
        </Text>
        {error && <Text style={modalStyles.errorText}>{error}</Text>}
      </View>

      <View style={modalStyles.inputGroup}>
        <Text style={[modalStyles.label, { color: colors.text }]}>Color</Text>
        <View style={noteModalStyles.colorPicker}>
          {NOTE_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                noteModalStyles.colorOption,
                { backgroundColor: color },
                selectedColor === color && noteModalStyles.colorSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      </View>

      <View style={modalStyles.buttons}>
        <TouchableOpacity
          style={[modalStyles.cancelButton, { borderColor: colors.border }]}
          onPress={onClose}
        >
          <Text style={[modalStyles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[modalStyles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={modalStyles.submitButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

/**
 * PinnedTaskCard - Individual pinned task card
 */
interface PinnedTaskCardProps {
  task: Task;
  board: Board | undefined;
  section: Section | undefined;
  onPress: (taskId: string, boardId: string) => void;
  onUnpin: (taskId: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function PinnedTaskCard({ task, board, section, onPress, onUnpin, colors }: PinnedTaskCardProps): React.JSX.Element {
  const handleUnpin = useCallback((e: any) => {
    e.stopPropagation();
    onUnpin(task.id);
  }, [task.id, onUnpin]);

  const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  return (
    <TouchableOpacity
      style={[fridgeStyles.pinnedTask, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
      onPress={() => onPress(task.id, task.boardId)}
    >
      <View style={fridgeStyles.pinnedTaskHeader}>
        {task.priority && (
          <View style={[fridgeStyles.priorityDot, { backgroundColor: priorityColors[task.priority] }]} />
        )}
        <TouchableOpacity onPress={handleUnpin} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={fridgeStyles.unpinIcon}>📌</Text>
        </TouchableOpacity>
      </View>
      <Text style={[fridgeStyles.pinnedTaskTitle, { color: colors.text }]} numberOfLines={2}>
        {task.title}
      </Text>
      <Text style={[fridgeStyles.pinnedTaskMeta, { color: colors.textMuted }]} numberOfLines={1}>
        {board?.name || 'Unknown'} • {section?.name || 'Unknown'}
      </Text>
    </TouchableOpacity>
  );
}

interface BoardCardProps {
  board: Board;
  onPress: (boardId: string) => void;
  onDelete: (boardId: string) => void;
  onHeatmapPress: (boardId: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  cardWidth: number;
  stats?: BoardStats;
  heatmap?: ActivityHeatmapEntry[];
}

/**
 * MiniHeatmap - Small activity heatmap for board cards
 */
function MiniHeatmap({ data, colors }: { data: ActivityHeatmapEntry[]; colors: ReturnType<typeof useTheme>['colors'] }): React.JSX.Element {
  // Show last 14 days in a 2x7 grid
  const last14Days = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = data.find(d => d.date === dateStr);
      days.push({ date: dateStr, count: entry?.count || 0 });
    }
    
    return days;
  }, [data]);

  const getHeatColor = (count: number): string => {
    if (count === 0) return colors.border;
    if (count <= 2) return '#86efac';
    if (count <= 5) return '#22c55e';
    if (count <= 10) return '#16a34a';
    return '#15803d';
  };

  return (
    <View style={miniHeatmapStyles.container}>
      {last14Days.map((day, index) => (
        <View
          key={day.date}
          style={[
            miniHeatmapStyles.cell,
            { backgroundColor: getHeatColor(day.count) },
          ]}
        />
      ))}
    </View>
  );
}

const miniHeatmapStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    width: 58, // 7 cells * 6px + 6 gaps * 2px
  },
  cell: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
});

/**
 * BoardCard - Individual board card component with stats and heatmap
 */
function BoardCard({ board, onPress, onDelete, onHeatmapPress, colors, cardWidth, stats, heatmap }: BoardCardProps): React.JSX.Element {
  const handlePress = useCallback(() => {
    onPress(board.id);
  }, [board.id, onPress]);

  const handleLongPress = useCallback(() => {
    Alert.alert(
      'Delete Board',
      `Are you sure you want to delete "${board.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(board.id),
        },
      ]
    );
  }, [board.id, board.name, onDelete]);

  return (
    <TouchableOpacity
      style={[styles.boardCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, width: cardWidth }]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open board ${board.name}`}
      accessibilityHint="Long press to delete"
    >
      <View style={[styles.boardColorBar, { backgroundColor: board.color || '#6366f1' }]} />
      <View style={styles.boardContent}>
        <Text style={[styles.boardName, { color: colors.text }]} numberOfLines={1}>
          {board.name}
        </Text>
        
        {/* Stats */}
        {stats && (
          <View style={styles.boardStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.openTasks}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>open</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.completedTasks}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>done</Text>
            </View>
            {stats.overdueTasks > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.overdueTasks}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>overdue</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Mini Heatmap - always show */}
        <TouchableOpacity 
          style={styles.heatmapContainer}
          onPress={() => onHeatmapPress(board.id)}
        >
          <MiniHeatmap data={heatmap || []} colors={colors} />
          <Text style={[styles.heatmapLabel, { color: colors.textMuted }]}>Activity</Text>
        </TouchableOpacity>
        
        <Text style={[styles.boardMeta, { color: colors.textMuted }]}>
          {board.sectionOrder.length} sections
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * BoardListScreen - Displays all user boards in a grid/list view.
 *
 * Requirements:
 * - 1.7: Display all user boards in a navigable list or grid view
 * - 1.1: Create new boards
 * - 1.5: Delete boards with confirmation
 */
export function BoardListScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BoardList'>>();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const boards = useAppSelector(selectAllBoards);
  const user = useAppSelector(selectCurrentUser);
  const epics = useAppSelector(selectAllEpics);
  const allTasks = useAppSelector(selectAllTasks);
  const allSections = useAppSelector(selectAllSections);
  const pinnedTasks = useAppSelector(selectPinnedTasks);
  const notes = useAppSelector(selectAllNotes);
  const isLoading = useAppSelector((state) => state.boards.isLoading);
  const error = useAppSelector((state) => state.boards.error);

  // Calculate responsive card width
  // Desktop: 4 cards per row, Tablet: 3 cards, Mobile: 2 cards
  // Wider cards to accommodate stats and heatmap
  const boardCardWidth = useMemo(() => {
    const padding = 32; // Total horizontal padding
    const gap = 16; // Gap between cards
    const availableWidth = screenWidth - padding;
    
    let cardsPerRow: number;
    if (screenWidth >= 1200) {
      cardsPerRow = 4;
    } else if (screenWidth >= 900) {
      cardsPerRow = 3;
    } else if (screenWidth >= 600) {
      cardsPerRow = 2;
    } else {
      cardsPerRow = 1;
    }
    
    const cardWidth = (availableWidth - (gap * (cardsPerRow - 1))) / cardsPerRow;
    return Math.floor(cardWidth);
  }, [screenWidth]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Epic modal state
  const [epicModalVisible, setEpicModalVisible] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [isNewEpic, setIsNewEpic] = useState(false);
  const [isSavingEpic, setIsSavingEpic] = useState(false);

  // Heatmap modal state
  const [heatmapModalVisible, setHeatmapModalVisible] = useState(false);
  const [selectedBoardForHeatmap, setSelectedBoardForHeatmap] = useState<string | null>(null);
  const [heatmapDays, setHeatmapDays] = useState(30);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fridge state
  const [isCreateNoteModalVisible, setIsCreateNoteModalVisible] = useState(false);
  const [isCreateFridgeTaskModalVisible, setIsCreateFridgeTaskModalVisible] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingFridgeTask, setIsCreatingFridgeTask] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Get stats and heatmaps from store
  const boardStats = useAppSelector((state) => state.boards.stats);
  const boardHeatmaps = useAppSelector((state) => state.boards.heatmaps);

  /**
   * Fetch boards, epics, tasks, sections, and notes on mount
   */
  useEffect(() => {
    dispatch(fetchBoards());
    dispatch(fetchAllEpics());
    dispatch(fetchAllTasks());
    dispatch(fetchAllSections());
    dispatch(fetchPinnedTasks());
    dispatch(fetchNotes());
  }, [dispatch]);

  /**
   * Fetch stats and heatmaps for all boards
   */
  useEffect(() => {
    boards.forEach(board => {
      if (!boardStats[board.id]) {
        dispatch(fetchBoardStats(board.id));
      }
      if (!boardHeatmaps[board.id]) {
        dispatch(fetchActivityHeatmap({ boardId: board.id, days: 30 }));
      }
    });
  }, [dispatch, boards, boardStats, boardHeatmaps]);

  /**
   * Handle openEpicId route parameter - navigate to epic detail when coming from task card
   */
  useEffect(() => {
    const openEpicId = route.params?.openEpicId;
    if (openEpicId && epics.length > 0) {
      const epicToOpen = epics.find(e => e.id === openEpicId);
      if (epicToOpen) {
        // Clear the param first
        navigation.setParams({ openEpicId: undefined });
        // Navigate to epic detail
        navigation.navigate('EpicDetail', { epicId: openEpicId });
      }
    }
  }, [route.params?.openEpicId, epics, navigation]);

  // Get linked tasks for selected epic
  const linkedTasks = useMemo(() => {
    if (!selectedEpic) return [];
    return allTasks.filter(task => task.epicIds?.includes(selectedEpic.id));
  }, [selectedEpic, allTasks]);

  // Get linked board IDs for selected epic
  const linkedBoardIds = useMemo(() => {
    if (!selectedEpic) return [];
    // Get unique board IDs from linked tasks
    const boardIds = new Set(linkedTasks.map(t => t.boardId));
    return Array.from(boardIds);
  }, [selectedEpic, linkedTasks]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const boardsResult = await dispatch(fetchBoards()).unwrap();
      await Promise.all([
        dispatch(fetchAllEpics()).unwrap(),
        dispatch(fetchAllTasks()).unwrap(),
        dispatch(fetchAllSections()).unwrap(),
        dispatch(fetchPinnedTasks()).unwrap(),
        dispatch(fetchNotes()).unwrap(),
        // Refresh stats and heatmaps for all boards
        ...boardsResult.map(board => dispatch(fetchBoardStats(board.id))),
        ...boardsResult.map(board => dispatch(fetchActivityHeatmap({ boardId: board.id, days: 30 }))),
      ]);
    } catch {
      // Error handled by slice
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  /**
   * Handle heatmap press - open modal with enlarged heatmap
   */
  const handleHeatmapPress = useCallback((boardId: string) => {
    setSelectedBoardForHeatmap(boardId);
    setHeatmapDays(30);
    setShowCustomInput(false);
    setCustomDaysInput('');
    setHeatmapModalVisible(true);
    // Fetch fresh heatmap data
    dispatch(fetchActivityHeatmap({ boardId, days: 30 }));
  }, [dispatch]);

  /**
   * Handle heatmap timeframe change
   */
  const handleHeatmapTimeframeChange = useCallback((days: number) => {
    setHeatmapDays(days);
    setShowCustomInput(false);
    if (selectedBoardForHeatmap) {
      dispatch(fetchActivityHeatmap({ boardId: selectedBoardForHeatmap, days }));
    }
  }, [dispatch, selectedBoardForHeatmap]);

  /**
   * Handle custom days input
   */
  const handleCustomDaysSubmit = useCallback(() => {
    const days = parseInt(customDaysInput, 10);
    if (days > 0 && days <= 365 && selectedBoardForHeatmap) {
      setHeatmapDays(days);
      dispatch(fetchActivityHeatmap({ boardId: selectedBoardForHeatmap, days }));
    }
  }, [customDaysInput, selectedBoardForHeatmap, dispatch]);

  /**
   * Handle board press - navigate to board
   */
  const handleBoardPress = useCallback((boardId: string) => {
    navigation.navigate('Board', { boardId });
  }, [navigation]);

  /**
   * Handle board delete
   */
  const handleBoardDelete = useCallback(
    async (boardId: string) => {
      try {
        await dispatch(deleteBoard(boardId)).unwrap();
      } catch {
        Alert.alert('Error', 'Failed to delete board. Please try again.');
      }
    },
    [dispatch]
  );

  /**
   * Handle create board
   */
  const handleCreateBoard = useCallback(
    async (name: string, description: string) => {
      setIsCreating(true);
      try {
        await dispatch(createBoard({ name, description: description || undefined })).unwrap();
        setIsCreateModalVisible(false);
      } catch {
        Alert.alert('Error', 'Failed to create board. Please try again.');
      } finally {
        setIsCreating(false);
      }
    },
    [dispatch]
  );

  /**
   * Handle epic press - navigate to epic detail page
   */
  const handleEpicPress = useCallback((epic: Epic) => {
    navigation.navigate('EpicDetail', { epicId: epic.id });
  }, [navigation]);

  /**
   * Handle epic edit - open modal for editing
   */
  const handleEpicEdit = useCallback((epic: Epic) => {
    setSelectedEpic(epic);
    setIsNewEpic(false);
    setEpicModalVisible(true);
  }, []);

  /**
   * Handle create new epic
   */
  const handleCreateEpicPress = useCallback(() => {
    setSelectedEpic(null);
    setIsNewEpic(true);
    setEpicModalVisible(true);
  }, []);

  /**
   * Handle save epic
   */
  const handleSaveEpic = useCallback(
    async (data: { name: string; description: string; color: string; endDate?: string; boardIds: string[] }) => {
      setIsSavingEpic(true);
      try {
        if (isNewEpic) {
          // Create new epic - use first board if available, or create without board
          const boardId = data.boardIds[0] || boards[0]?.id;
          if (!boardId) {
            Alert.alert('Error', 'Please create a board first');
            return;
          }
          await dispatch(createEpic({ 
            boardId, 
            data: { name: data.name, description: data.description || undefined, color: data.color, endDate: data.endDate } 
          })).unwrap();
        } else if (selectedEpic) {
          await dispatch(updateEpic({ 
            id: selectedEpic.id, 
            data: { name: data.name, description: data.description || undefined, color: data.color, endDate: data.endDate } 
          })).unwrap();
        }
        setEpicModalVisible(false);
        setSelectedEpic(null);
      } catch {
        Alert.alert('Error', 'Failed to save epic');
      } finally {
        setIsSavingEpic(false);
      }
    },
    [dispatch, isNewEpic, selectedEpic, boards]
  );

  /**
   * Handle delete epic
   */
  const handleDeleteEpic = useCallback(() => {
    if (!selectedEpic) return;
    Alert.alert(
      'Delete Epic',
      `Are you sure you want to delete "${selectedEpic.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteEpic({ epicId: selectedEpic.id, boardId: selectedEpic.boardId })).unwrap();
              setEpicModalVisible(false);
              setSelectedEpic(null);
            } catch {
              Alert.alert('Error', 'Failed to delete epic');
            }
          },
        },
      ]
    );
  }, [dispatch, selectedEpic]);

  /**
   * Handle task press from epic modal
   */
  const handleTaskPress = useCallback((taskId: string, boardId: string) => {
    setEpicModalVisible(false);
    navigation.navigate('TaskDetail', { taskId, boardId });
  }, [navigation]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  }, [dispatch]);

  /**
   * Clear error
   */
  const handleClearError = useCallback(() => {
    dispatch(clearBoardsError());
  }, [dispatch]);

  // ==================== Fridge Handlers ====================

  /**
   * Handle create note
   */
  const handleCreateNote = useCallback(async (content: string, color: string) => {
    setIsCreatingNote(true);
    try {
      await dispatch(createNote({ content, color })).unwrap();
      setIsCreateNoteModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to create note');
    } finally {
      setIsCreatingNote(false);
    }
  }, [dispatch]);

  /**
   * Handle edit note
   */
  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
  }, []);

  /**
   * Handle save edited note
   */
  const handleSaveEditedNote = useCallback(async (content: string, color: string) => {
    if (!editingNote) return;
    try {
      await dispatch(updateNote({ id: editingNote.id, content, color })).unwrap();
      setEditingNote(null);
    } catch {
      Alert.alert('Error', 'Failed to update note');
    }
  }, [dispatch, editingNote]);

  /**
   * Handle delete note
   */
  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await dispatch(deleteNote(noteId)).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to delete note');
    }
  }, [dispatch]);

  /**
   * Handle create fridge task
   */
  const handleCreateFridgeTask = useCallback(async (title: string, boardId: string, sectionId: string) => {
    setIsCreatingFridgeTask(true);
    try {
      const result = await dispatch(createTask({ boardId, data: { title, sectionId } })).unwrap();
      // Pin the task automatically
      await dispatch(toggleTaskPin(result.id)).unwrap();
      setIsCreateFridgeTaskModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setIsCreatingFridgeTask(false);
    }
  }, [dispatch]);

  /**
   * Handle unpin task
   */
  const handleUnpinTask = useCallback(async (taskId: string) => {
    try {
      await dispatch(toggleTaskPin(taskId)).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to unpin task');
    }
  }, [dispatch]);

  /**
   * Handle pinned task press
   */
  const handlePinnedTaskPress = useCallback((taskId: string, boardId: string) => {
    navigation.navigate('TaskDetail', { taskId, boardId });
  }, [navigation]);

  // Get task count per epic
  const epicTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    epics.forEach(epic => {
      counts[epic.id] = allTasks.filter(t => t.epicIds?.includes(epic.id)).length;
    });
    return counts;
  }, [epics, allTasks]);

  // Sort epics by due date (most urgent first, then no due date at the end)
  const sortedEpics = useMemo(() => {
    return [...epics].sort((a, b) => {
      // Epics without due dates go to the end
      if (!a.endDate && !b.endDate) return a.name.localeCompare(b.name);
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      
      // Sort by due date (earliest first)
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });
  }, [epics]);

  // Get selected board for heatmap modal
  const selectedBoard = useMemo(() => {
    if (!selectedBoardForHeatmap) return null;
    return boards.find(b => b.id === selectedBoardForHeatmap) || null;
  }, [selectedBoardForHeatmap, boards]);

  // Helper function to calculate time remaining
  const getTimeRemaining = useCallback((endDate: string | null | undefined): { text: string; color: string } | null => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: '#ef4444' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: '#f97316' };
    } else if (diffDays === 1) {
      return { text: '1 day left', color: '#f97316' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: '#eab308' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days left`, color: '#22c55e' };
    } else {
      const weeks = Math.floor(diffDays / 7);
      return { text: `${weeks}w left`, color: '#22c55e' };
    }
  }, []);

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.headerText }]}>Pragma</Text>
            <Text style={[styles.subtitle, { color: colors.headerText, opacity: 0.8 }]}>
              Welcome, {user?.displayName || 'User'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <DarkModeToggle />
            <ProfileAvatar
              displayName={user?.displayName || 'User'}
              onLogout={handleLogout}
            />
          </View>
        </View>

        {/* Error Banner */}
        {error && (
          <TouchableOpacity style={[styles.errorBanner, { backgroundColor: colors.error + '10' }]} onPress={handleClearError}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <Text style={[styles.errorDismiss, { color: colors.textMuted }]}>Tap to dismiss</Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        {isLoading && boards.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading boards...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {/* Epics Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🏷 Epics</Text>
                <TouchableOpacity onPress={handleCreateEpicPress}>
                  <Text style={[styles.addLink, { color: colors.primary }]}>+ New</Text>
                </TouchableOpacity>
              </View>
              
              {sortedEpics.length === 0 ? (
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  No epics yet. Create one to group related tasks.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.epicsScroll}>
                  {sortedEpics.map(epic => {
                    const timeRemaining = getTimeRemaining(epic.endDate);
                    return (
                      <TouchableOpacity
                        key={epic.id}
                        style={[styles.epicCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                        onPress={() => handleEpicPress(epic)}
                      >
                        <View style={styles.epicCardHeader}>
                          <View style={[styles.epicColorBar, { backgroundColor: epic.color }]} />
                          <TouchableOpacity 
                            style={styles.epicEditButton}
                            onPress={(e) => { e.stopPropagation(); handleEpicEdit(epic); }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text style={[styles.epicEditIcon, { color: colors.textMuted }]}>✏️</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.epicName, { color: colors.text }]} numberOfLines={1}>
                          {epic.name}
                        </Text>
                        <Text style={[styles.epicTaskCount, { color: colors.textMuted }]}>
                          {epicTaskCounts[epic.id] || 0} tasks
                        </Text>
                        {timeRemaining && (
                          <View style={[styles.timeRemainingTag, { backgroundColor: timeRemaining.color + '20' }]}>
                            <Text style={[styles.timeRemainingText, { color: timeRemaining.color }]}>
                              {timeRemaining.text}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Fridge Section - Pinned Tasks & Sticky Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🧊 Fridge</Text>
                <View style={fridgeStyles.fridgeActions}>
                  <TouchableOpacity onPress={() => setIsCreateNoteModalVisible(true)}>
                    <Text style={[styles.addLink, { color: colors.primary }]}>+ Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsCreateFridgeTaskModalVisible(true)} style={{ marginLeft: 12 }}>
                    <Text style={[styles.addLink, { color: colors.primary }]}>+ Task</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {pinnedTasks.length === 0 && notes.length === 0 ? (
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  Your fridge is empty. Pin tasks or add sticky notes to keep important items visible.
                </Text>
              ) : (
                <View style={fridgeStyles.fridgeContent}>
                  {/* Sticky Notes */}
                  {notes.length > 0 && (
                    <View style={fridgeStyles.notesSection}>
                      <Text style={[fridgeStyles.subsectionTitle, { color: colors.textMuted }]}>📝 Notes</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fridgeStyles.notesScroll}>
                        {notes.map(note => (
                          <StickyNoteCard
                            key={note.id}
                            note={note}
                            onEdit={handleEditNote}
                            onDelete={handleDeleteNote}
                            colors={colors}
                          />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  {/* Pinned Tasks */}
                  {pinnedTasks.length > 0 && (
                    <View style={fridgeStyles.pinnedSection}>
                      <Text style={[fridgeStyles.subsectionTitle, { color: colors.textMuted }]}>📌 Pinned Tasks</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fridgeStyles.pinnedScroll}>
                        {pinnedTasks.map(task => {
                          const board = boards.find(b => b.id === task.boardId);
                          const section = allSections.find(s => s.id === task.sectionId);
                          return (
                            <PinnedTaskCard
                              key={task.id}
                              task={task}
                              board={board}
                              section={section}
                              onPress={handlePinnedTaskPress}
                              onUnpin={handleUnpinTask}
                              colors={colors}
                            />
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Boards Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Boards</Text>
                <TouchableOpacity onPress={() => setIsCreateModalVisible(true)}>
                  <Text style={[styles.addLink, { color: colors.primary }]}>+ New</Text>
                </TouchableOpacity>
              </View>
              
              {boards.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No boards yet</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Create your first board to start organizing your tasks
                  </Text>
                </View>
              ) : (
                <View style={styles.boardGrid}>
                  {boards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onPress={handleBoardPress}
                      onDelete={handleBoardDelete}
                      onHeatmapPress={handleHeatmapPress}
                      colors={colors}
                      cardWidth={boardCardWidth}
                      stats={boardStats[board.id]}
                      heatmap={boardHeatmaps[board.id]?.data}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Create Board Modal */}
        <CreateBoardModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onSubmit={handleCreateBoard}
          isLoading={isCreating}
          colors={colors}
        />

        {/* Epic Modal */}
        <EpicModal
          visible={epicModalVisible}
          epic={selectedEpic}
          linkedTasks={linkedTasks}
          allBoards={boards}
          allSections={allSections}
          linkedBoardIds={linkedBoardIds}
          onClose={() => { setEpicModalVisible(false); setSelectedEpic(null); }}
          onSave={handleSaveEpic}
          onDelete={selectedEpic ? handleDeleteEpic : undefined}
          onTaskPress={handleTaskPress}
          isLoading={isSavingEpic}
          isNew={isNewEpic}
        />

        {/* Create Note Modal */}
        <CreateNoteModal
          visible={isCreateNoteModalVisible}
          onClose={() => setIsCreateNoteModalVisible(false)}
          onSubmit={handleCreateNote}
          isLoading={isCreatingNote}
          colors={colors}
        />

        {/* Create Fridge Task Modal */}
        <CreateFridgeTaskModal
          visible={isCreateFridgeTaskModalVisible}
          onClose={() => setIsCreateFridgeTaskModalVisible(false)}
          onSubmit={handleCreateFridgeTask}
          isLoading={isCreatingFridgeTask}
          boards={boards}
          sections={allSections}
          colors={colors}
        />

        {/* Edit Note Modal */}
        {editingNote && (
          <Modal
            visible={!!editingNote}
            animationType="slide"
            transparent
            onRequestClose={() => setEditingNote(null)}
          >
            <View style={modalStyles.overlay}>
              <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
                <Text style={[modalStyles.title, { color: colors.text }]}>Edit Note</Text>
                <EditNoteContent
                  note={editingNote}
                  onSave={handleSaveEditedNote}
                  onClose={() => setEditingNote(null)}
                  colors={colors}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Heatmap Modal */}
        <Modal
          visible={heatmapModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setHeatmapModalVisible(false)}
        >
          <View style={heatmapModalStyles.overlay}>
            <View style={[heatmapModalStyles.container, { backgroundColor: colors.surface }]}>
              <View style={heatmapModalStyles.header}>
                <Text style={[heatmapModalStyles.title, { color: colors.text }]}>
                  Activity Heatmap
                </Text>
                <TouchableOpacity onPress={() => setHeatmapModalVisible(false)}>
                  <Text style={[heatmapModalStyles.closeButton, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* Board name */}
              {selectedBoard && (
                <Text style={[heatmapModalStyles.boardName, { color: colors.text }]}>
                  {selectedBoard.name}
                </Text>
              )}
              
              {/* Timeframe selector */}
              <View style={heatmapModalStyles.timeframeSelector}>
                {[30, 60, 90].map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      heatmapModalStyles.timeframeButton,
                      heatmapDays === days && !showCustomInput && { backgroundColor: colors.primary },
                      (heatmapDays !== days || showCustomInput) && { backgroundColor: colors.border },
                    ]}
                    onPress={() => handleHeatmapTimeframeChange(days)}
                  >
                    <Text style={[
                      heatmapModalStyles.timeframeText,
                      { color: heatmapDays === days && !showCustomInput ? '#fff' : colors.text },
                    ]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    heatmapModalStyles.timeframeButton,
                    showCustomInput && { backgroundColor: colors.primary },
                    !showCustomInput && { backgroundColor: colors.border },
                  ]}
                  onPress={() => setShowCustomInput(!showCustomInput)}
                >
                  <Text style={[
                    heatmapModalStyles.timeframeText,
                    { color: showCustomInput ? '#fff' : colors.text },
                  ]}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Custom days input */}
              {showCustomInput && (
                <View style={heatmapModalStyles.customInputRow}>
                  <TextInput
                    style={[heatmapModalStyles.customInput, { backgroundColor: colors.border, color: colors.text }]}
                    placeholder="Days (1-365)"
                    placeholderTextColor={colors.textMuted}
                    value={customDaysInput}
                    onChangeText={setCustomDaysInput}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <TouchableOpacity
                    style={[heatmapModalStyles.applyButton, { backgroundColor: colors.primary }]}
                    onPress={handleCustomDaysSubmit}
                  >
                    <Text style={heatmapModalStyles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Current timeframe display */}
              <Text style={[heatmapModalStyles.currentTimeframe, { color: colors.textMuted }]}>
                Showing last {heatmapDays} days
              </Text>
              
              {/* Large Heatmap */}
              {selectedBoardForHeatmap && boardHeatmaps[selectedBoardForHeatmap] && (
                <View style={heatmapModalStyles.heatmapContainer}>
                  <LargeHeatmap 
                    data={boardHeatmaps[selectedBoardForHeatmap].data} 
                    days={heatmapDays}
                    colors={colors} 
                  />
                </View>
              )}
              
              <Text style={[heatmapModalStyles.legend, { color: colors.textMuted }]}>
                Activity includes: tasks created, status changes, comments, and attachments
              </Text>
              
              {/* Board Description */}
              {selectedBoard?.description && (
                <View style={[heatmapModalStyles.descriptionSection, { borderTopColor: colors.border }]}>
                  <Text style={[heatmapModalStyles.descriptionLabel, { color: colors.textMuted }]}>
                    Board Description
                  </Text>
                  <Text style={[heatmapModalStyles.descriptionText, { color: colors.text }]}>
                    {selectedBoard.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedBackground>
  );
}

/**
 * LargeHeatmap - Full activity heatmap for modal
 */
function LargeHeatmap({ data, days, colors }: { data: ActivityHeatmapEntry[]; days: number; colors: ReturnType<typeof useTheme>['colors'] }): React.JSX.Element {
  const heatmapData = useMemo(() => {
    const result: { date: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = data.find(d => d.date === dateStr);
      result.push({ date: dateStr, count: entry?.count || 0 });
    }
    
    return result;
  }, [data, days]);

  const getHeatColor = (count: number): string => {
    if (count === 0) return colors.border;
    if (count <= 2) return '#86efac';
    if (count <= 5) return '#22c55e';
    if (count <= 10) return '#16a34a';
    return '#15803d';
  };

  // Calculate grid dimensions (7 columns for days of week)
  const weeks = Math.ceil(heatmapData.length / 7);

  return (
    <View>
      <View style={largeHeatmapStyles.grid}>
        {heatmapData.map((day, index) => (
          <View
            key={day.date}
            style={[
              largeHeatmapStyles.cell,
              { backgroundColor: getHeatColor(day.count) },
            ]}
          />
        ))}
      </View>
      <View style={largeHeatmapStyles.legendRow}>
        <Text style={[largeHeatmapStyles.legendText, { color: colors.textMuted }]}>Less</Text>
        <View style={[largeHeatmapStyles.legendCell, { backgroundColor: colors.border }]} />
        <View style={[largeHeatmapStyles.legendCell, { backgroundColor: '#86efac' }]} />
        <View style={[largeHeatmapStyles.legendCell, { backgroundColor: '#22c55e' }]} />
        <View style={[largeHeatmapStyles.legendCell, { backgroundColor: '#16a34a' }]} />
        <View style={[largeHeatmapStyles.legendCell, { backgroundColor: '#15803d' }]} />
        <Text style={[largeHeatmapStyles.legendText, { color: colors.textMuted }]}>More</Text>
      </View>
    </View>
  );
}

const largeHeatmapStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'flex-start',
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
  },
});

const heatmapModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    padding: 4,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentTimeframe: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  heatmapContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  legend: {
    fontSize: 12,
    textAlign: 'center',
  },
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorDismiss: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  epicsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  epicCard: {
    width: 140,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 12,
  },
  epicCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  epicColorBar: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  epicEditButton: {
    padding: 2,
  },
  epicEditIcon: {
    fontSize: 12,
  },
  epicName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  epicTaskCount: {
    fontSize: 12,
  },
  timeRemainingTag: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  timeRemainingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  boardCard: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 180, // Minimum height to fit content
  },
  boardColorBar: {
    height: 6,
  },
  boardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  boardName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  boardDescription: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 16,
    flex: 1,
  },
  boardMeta: {
    fontSize: 11,
    marginTop: 'auto',
  },
  boardStats: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  heatmapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  heatmapLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  addButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const noteModalStyles = StyleSheet.create({
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#1f2937',
  },
});

const fridgeTaskModalStyles = StyleSheet.create({
  optionScroll: {
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

const fridgeStyles = StyleSheet.create({
  fridgeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fridgeContent: {
    gap: 16,
  },
  notesSection: {
    marginBottom: 8,
  },
  pinnedSection: {
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  notesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  pinnedScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  stickyNote: {
    width: 140,
    height: 140,
    padding: 12,
    borderRadius: 4,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    transform: [{ rotate: '-1deg' }],
  },
  stickyNoteText: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 18,
  },
  pinnedTask: {
    width: 160,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 12,
  },
  pinnedTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unpinIcon: {
    fontSize: 14,
  },
  pinnedTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  pinnedTaskMeta: {
    fontSize: 11,
  },
});

export default BoardListScreen;
