import React, { useEffect, useCallback, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchBoards,
  createBoard,
  deleteBoard,
  logout,
  clearBoardsError,
} from '@/store/slices';
import { selectAllBoards, selectCurrentUser } from '@/store/selectors';
import type { Board } from '@kanban/shared';
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
}

/**
 * BoardCard - Individual board card component
 */
function BoardCard({ board, onPress, onDelete }: BoardCardProps): React.JSX.Element {
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
      style={styles.boardCard}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open board ${board.name}`}
      accessibilityHint="Long press to delete"
    >
      <View style={[styles.boardColorBar, { backgroundColor: board.color || '#6366f1' }]} />
      <View style={styles.boardContent}>
        <Text style={styles.boardName} numberOfLines={1}>
          {board.name}
        </Text>
        {board.description && (
          <Text style={styles.boardDescription} numberOfLines={2}>
            {board.description}
          </Text>
        )}
        <Text style={styles.boardMeta}>
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
  const boards = useAppSelector(selectAllBoards);
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector((state) => state.boards.isLoading);
  const error = useAppSelector((state) => state.boards.error);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Fetch boards on mount
   */
  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchBoards()).unwrap();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Boards</Text>
          <Text style={styles.subtitle}>
            Welcome, {user?.displayName || 'User'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={handleClearError}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorDismiss}>Tap to dismiss</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {isLoading && boards.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading boards...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
        >
          {boards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No boards yet</Text>
              <Text style={styles.emptyDescription}>
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
                />
              ))}
            </View>
          )}

          {/* Create Board Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreateModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Create new board"
          >
            <Text style={styles.addButtonText}>+ Create New Board</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Create Board Modal */}
      <CreateBoardModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={handleCreateBoard}
        isLoading={isCreating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#6366f1',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  errorDismiss: {
    color: '#9ca3af',
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
    color: '#6b7280',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  boardCard: {
    backgroundColor: '#ffffff',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  boardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  boardMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  addButton: {
    backgroundColor: '#6366f1',
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
