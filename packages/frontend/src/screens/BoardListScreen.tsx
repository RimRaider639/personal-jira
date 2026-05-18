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
} from '@/store/slices';
import { selectAllBoards, selectCurrentUser, selectAllEpics, selectAllTasks, selectAllSections } from '@/store/selectors';
import { ThemedBackground, DarkModeToggle, EpicModal } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
import type { Board, Epic, Task } from '@kanban/shared';
import type { RootStackParamList } from '@/navigation/RootNavigator';

interface CreateBoardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  isLoading: boolean;
}

/**
 * CreateBoardModal - Modal for creating a new board
 */
function CreateBoardModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
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
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Create New Board</Text>

          <View style={modalStyles.inputGroup}>
            <Text style={modalStyles.label}>Board Name *</Text>
            <TextInput
              style={[modalStyles.input, error && modalStyles.inputError]}
              placeholder="Enter board name"
              placeholderTextColor="#9ca3af"
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
            <Text style={modalStyles.label}>Description (optional)</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textArea]}
              placeholder="Enter board description"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          <View style={modalStyles.buttons}>
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.submitButton, isLoading && modalStyles.buttonDisabled]}
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

interface BoardCardProps {
  board: Board;
  onPress: (boardId: string) => void;
  onDelete: (boardId: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

/**
 * BoardCard - Individual board card component
 */
function BoardCard({ board, onPress, onDelete, colors }: BoardCardProps): React.JSX.Element {
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
      style={[styles.boardCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
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
        {board.description && (
          <Text style={[styles.boardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {board.description}
          </Text>
        )}
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
  const boards = useAppSelector(selectAllBoards);
  const user = useAppSelector(selectCurrentUser);
  const epics = useAppSelector(selectAllEpics);
  const allTasks = useAppSelector(selectAllTasks);
  const allSections = useAppSelector(selectAllSections);
  const isLoading = useAppSelector((state) => state.boards.isLoading);
  const error = useAppSelector((state) => state.boards.error);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Epic modal state
  const [epicModalVisible, setEpicModalVisible] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [isNewEpic, setIsNewEpic] = useState(false);
  const [isSavingEpic, setIsSavingEpic] = useState(false);

  /**
   * Fetch boards, epics, tasks, and sections on mount
   */
  useEffect(() => {
    dispatch(fetchBoards());
    dispatch(fetchAllEpics());
    dispatch(fetchAllTasks());
    dispatch(fetchAllSections());
  }, [dispatch]);

  /**
   * Handle openEpicId route parameter - open epic modal when navigating from task card
   */
  useEffect(() => {
    const openEpicId = route.params?.openEpicId;
    if (openEpicId && epics.length > 0) {
      const epicToOpen = epics.find(e => e.id === openEpicId);
      if (epicToOpen) {
        setSelectedEpic(epicToOpen);
        setIsNewEpic(false);
        setEpicModalVisible(true);
        // Clear the param to prevent re-opening on subsequent renders
        navigation.setParams({ openEpicId: undefined });
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
      await Promise.all([
        dispatch(fetchBoards()).unwrap(),
        dispatch(fetchAllEpics()).unwrap(),
        dispatch(fetchAllTasks()).unwrap(),
        dispatch(fetchAllSections()).unwrap(),
      ]);
    } catch {
      // Error handled by slice
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

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
   * Handle epic press - open modal
   */
  const handleEpicPress = useCallback((epic: Epic) => {
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

  // Get task count per epic
  const epicTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    epics.forEach(epic => {
      counts[epic.id] = allTasks.filter(t => t.epicIds?.includes(epic.id)).length;
    });
    return counts;
  }, [epics, allTasks]);

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.headerText }]}>My Boards</Text>
            <Text style={[styles.subtitle, { color: colors.headerText, opacity: 0.8 }]}>
              Welcome, {user?.displayName || 'User'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <DarkModeToggle />
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
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
              
              {epics.length === 0 ? (
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  No epics yet. Create one to group related tasks.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.epicsScroll}>
                  {epics.map(epic => (
                    <TouchableOpacity
                      key={epic.id}
                      style={[styles.epicCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                      onPress={() => handleEpicPress(epic)}
                    >
                      <View style={[styles.epicColorBar, { backgroundColor: epic.color }]} />
                      <Text style={[styles.epicName, { color: colors.text }]} numberOfLines={1}>
                        {epic.name}
                      </Text>
                      <Text style={[styles.epicTaskCount, { color: colors.textMuted }]}>
                        {epicTaskCounts[epic.id] || 0} tasks
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
                      colors={colors}
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
      </SafeAreaView>
    </ThemedBackground>
  );
}

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
  epicColorBar: {
    width: 24,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  epicName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  epicTaskCount: {
    fontSize: 12,
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
    marginHorizontal: -8,
  },
  boardCard: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
  },
  boardColorBar: {
    height: 4,
  },
  boardContent: {
    padding: 16,
  },
  boardName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  boardDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  boardMeta: {
    fontSize: 12,
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

export default BoardListScreen;
