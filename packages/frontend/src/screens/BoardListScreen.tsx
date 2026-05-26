/**
 * BoardListScreen - Displays all user boards in a responsive grid view.
 *
 * Migrated to Chakra UI with:
 * - SimpleGrid for responsive board card layout
 * - Card components with hover effects
 * - Stat components for board statistics
 * - Skeleton components for loading state
 * - Menu for edit/delete options
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 2.6, 17.3
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  Box,
  Container,
  Flex,
  SimpleGrid,
  Text,
  HStack,
  VStack,
  Icon,
  Badge,
  Input,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { ScrollView, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
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
  reorderPinnedTasks,
  createTask,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  reorderNotes,
  fetchStreak,
  checkIn,
  clearPendingMilestone,
} from '@/store/slices';
import {
  selectAllBoards,
  selectCurrentUser,
  selectAllEpics,
  selectAllTasks,
  selectAllSections,
  selectPinnedTasks,
  selectAllNotes,
} from '@/store/selectors';
import { ThemedBackground, DarkModeToggle, EpicModal, ProfileAvatar, TaskPreviewModal } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
import {
  AppCard,
  AppCardBody,
  AppButton,
  AppModal,
  LoadingState,
  EmptyState,
  ConfirmDialog,
  AppTooltip,
} from '@/components/chakra';
import { useAppToast } from '@/hooks/useToast';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LayersIcon,
  ListIcon,
  ActivityIcon,
  TagIcon,
  PinIcon,
  SearchIcon,
  CheckIcon,
} from '@/theme/icons';
import { FiFileText } from 'react-icons/fi';
import { HiOutlineClipboardList } from 'react-icons/hi';
import type { Board, Epic, Task, BoardStats, ActivityHeatmapEntry, Note, Section } from '@kanban/shared';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { Menu, Portal } from '@chakra-ui/react';

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


// ==================== BOARD CARD COMPONENT ====================

interface BoardCardProps {
  board: Board;
  onPress: (boardId: string) => void;
  onEdit: (board: Board) => void;
  onDelete: (boardId: string) => void;
  onHeatmapPress: (boardId: string) => void;
  stats?: BoardStats;
  heatmap?: ActivityHeatmapEntry[];
}

/**
 * MiniHeatmap - Small activity heatmap for board cards
 */
function MiniHeatmap({ data }: { data: ActivityHeatmapEntry[] }): React.JSX.Element {
  // Show last 14 days in a 2x7 grid
  const last14Days = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = data.find((d) => d.date === dateStr);
      days.push({ date: dateStr, count: entry?.count || 0 });
    }

    return days;
  }, [data]);

  const getHeatColor = (count: number): string => {
    if (count === 0) return 'gray.200';
    if (count <= 2) return 'green.200';
    if (count <= 5) return 'green.400';
    if (count <= 10) return 'green.500';
    return 'green.600';
  };

  return (
    <Flex wrap="wrap" gap="2px" w="58px">
      {last14Days.map((day) => (
        <Box
          key={day.date}
          w="6px"
          h="6px"
          borderRadius="1px"
          bg={getHeatColor(day.count)}
        />
      ))}
    </Flex>
  );
}

// ==================== GLOBAL SEARCH ====================

interface SearchResult {
  type: 'board' | 'task' | 'epic';
  id: string;
  title: string;
  subtitle?: string;
  boardId?: string;
}

interface GlobalSearchProps {
  boards: Board[];
  tasks: Task[];
  epics: Epic[];
  sections: Section[];
  onSelectBoard: (boardId: string) => void;
  onSelectTask: (taskId: string, boardId: string) => void;
  onSelectEpic: (epicId: string) => void;
}

function GlobalSearch({
  boards,
  tasks,
  epics,
  sections,
  onSelectBoard,
  onSelectTask,
  onSelectEpic,
}: GlobalSearchProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search boards
    boards.forEach((board) => {
      if (board.name.toLowerCase().includes(q) || board.description?.toLowerCase().includes(q)) {
        matches.push({
          type: 'board',
          id: board.id,
          title: board.name,
          subtitle: board.description || `${board.sectionOrder.length} sections`,
        });
      }
    });

    // Search tasks
    tasks.forEach((task) => {
      if (task.title.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q)) {
        const board = boards.find((b) => b.id === task.boardId);
        const section = sections.find((s) => s.id === task.sectionId);
        matches.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: `${board?.name || 'Unknown'} • ${section?.name || 'Unknown'}`,
          boardId: task.boardId,
        });
      }
    });

    // Search epics
    epics.forEach((epic) => {
      if (epic.name.toLowerCase().includes(q) || epic.description?.toLowerCase().includes(q)) {
        const board = boards.find((b) => b.id === epic.boardId);
        matches.push({
          type: 'epic',
          id: epic.id,
          title: epic.name,
          subtitle: board?.name || 'Unknown board',
        });
      }
    });

    return matches.slice(0, 10); // Limit to 10 results
  }, [query, boards, tasks, epics, sections]);

  const handleSelect = useCallback((result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    
    switch (result.type) {
      case 'board':
        onSelectBoard(result.id);
        break;
      case 'task':
        if (result.boardId) {
          onSelectTask(result.id, result.boardId);
        }
        break;
      case 'epic':
        onSelectEpic(result.id);
        break;
    }
  }, [onSelectBoard, onSelectTask, onSelectEpic]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'board': return '📋';
      case 'task': return '✓';
      case 'epic': return '🏷️';
      default: return '•';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'board': return 'blue.500';
      case 'task': return 'green.500';
      case 'epic': return 'purple.500';
      default: return 'gray.500';
    }
  };

  return (
    <Box position="relative" w={{ base: '200px', md: '300px' }}>
      <Box position="relative">
        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
          <Icon color="whiteAlpha.700" boxSize={4}>
            <SearchIcon />
          </Icon>
        </Box>
        <Input
          placeholder="Search boards, tasks, epics..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          pl={10}
          bg="whiteAlpha.200"
          border="none"
          color="white"
          _placeholder={{ color: 'whiteAlpha.600' }}
          _hover={{ bg: 'whiteAlpha.300' }}
          _focus={{ bg: 'whiteAlpha.300', outline: 'none' }}
          size="sm"
          borderRadius="md"
        />
      </Box>
      
      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={2}
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="md"
          boxShadow="lg"
          zIndex={100}
          maxH="300px"
          overflowY="auto"
        >
          {results.map((result) => (
            <Box
              key={`${result.type}-${result.id}`}
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
              onClick={() => handleSelect(result)}
            >
              <HStack gap={2}>
                <Text fontSize="sm">{getTypeIcon(result.type)}</Text>
                <VStack align="start" gap={0} flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="fg" lineClamp={1}>
                    {result.title}
                  </Text>
                  {result.subtitle && (
                    <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                      {result.subtitle}
                    </Text>
                  )}
                </VStack>
                <Badge colorPalette={result.type === 'board' ? 'blue' : result.type === 'task' ? 'green' : 'purple'} fontSize="2xs">
                  {result.type}
                </Badge>
              </HStack>
            </Box>
          ))}
        </Box>
      )}
      
      {/* No results message */}
      {isOpen && query.trim() && results.length === 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={2}
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="md"
          boxShadow="lg"
          zIndex={100}
          p={3}
        >
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            No results found for "{query}"
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * BoardCard - Individual board card component with stats and heatmap
 *
 * Requirements: 6.2, 6.3, 6.5, 6.6, 2.6
 */
function BoardCard({
  board,
  onPress,
  onEdit,
  onDelete,
  onHeatmapPress,
  stats,
  heatmap,
}: BoardCardProps): React.JSX.Element {
  const handlePress = useCallback(() => {
    onPress(board.id);
  }, [board.id, onPress]);

  return (
    <Menu.Root>
      <Menu.ContextTrigger asChild>
        <Box>
          <AppCard
            isHoverable
            onClick={handlePress}
            overflow="hidden"
            minH="180px"
            position="relative"
            aria-label={`Open board ${board.name}`}
          >
            {/* Color bar at top */}
            <Box h="6px" bg={board.color || 'brand.500'} />

            <AppCardBody p={3}>
              <VStack align="stretch" gap={2} h="full">
                {/* Board name */}
                <Text
                  fontWeight="semibold"
                  fontSize="sm"
                  lineClamp={1}
                  color="fg"
                >
                  {board.name}
                </Text>

                {/* Board description */}
                {board.description && (
                  <Text fontSize="xs" color="fg.muted" lineClamp={2}>
                    {board.description}
                  </Text>
                )}

                {/* Stats - Requirements: 6.3 */}
                {stats && (
                  <HStack gap={3}>
                    <VStack gap={0} align="center">
                      <Text fontWeight="bold" fontSize="md" color="brand.500">
                        {stats.openTasks}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted" textTransform="uppercase">
                        open
                      </Text>
                    </VStack>
                    <VStack gap={0} align="center">
                      <Text fontWeight="bold" fontSize="md" color="green.500">
                        {stats.completedTasks}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted" textTransform="uppercase">
                        done
                      </Text>
                    </VStack>
                    {stats.overdueTasks > 0 && (
                      <VStack gap={0} align="center">
                        <Text fontWeight="bold" fontSize="md" color="red.500">
                          {stats.overdueTasks}
                        </Text>
                        <Text fontSize="2xs" color="fg.muted" textTransform="uppercase">
                          overdue
                        </Text>
                      </VStack>
                    )}
                  </HStack>
                )}

                {/* Mini Heatmap - Requirements: 2.6 (activity icon) */}
                <Box
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHeatmapPress(board.id);
                  }}
                >
                  <HStack gap={2} align="center">
                    <MiniHeatmap data={heatmap || []} />
                    <HStack gap={1}>
                      <Icon color="fg.muted" boxSize={3}>
                        <ActivityIcon />
                      </Icon>
                      <Text fontSize="2xs" color="fg.muted" textTransform="uppercase">
                        Activity
                      </Text>
                    </HStack>
                  </HStack>
                </Box>

                {/* Sections count - Requirements: 2.6 (sections icon) */}
                <HStack gap={1} mt="auto">
                  <Icon color="fg.muted" boxSize={3}>
                    <LayersIcon />
                  </Icon>
                  <Text fontSize="xs" color="fg.muted">
                    {board.sectionOrder.length} sections
                  </Text>
                </HStack>
              </VStack>
            </AppCardBody>
          </AppCard>
        </Box>
      </Menu.ContextTrigger>

      {/* Context Menu for edit/delete - Requirements: 6.6 */}
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="edit" onClick={() => onEdit(board)}>
              <Icon mr={2}>
                <EditIcon />
              </Icon>
              Edit Board
            </Menu.Item>
            <Menu.Item value="delete" color="red.500" onClick={() => onDelete(board.id)}>
              <Icon mr={2}>
                <DeleteIcon />
              </Icon>
              Delete Board
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}


// ==================== CREATE BOARD MODAL ====================

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  isLoading: boolean;
}

/**
 * CreateBoardModal - Modal for creating a new board using Chakra UI
 */
function CreateBoardModal({
  open,
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

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [open]);

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Create New Board"
      primaryActionText="Create"
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={handleClose}
      isLoading={isLoading}
    >
      <VStack gap={4} align="stretch">
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Board Name <Text as="span" color="red.500">*</Text>
          </Text>
          <Input
            placeholder="Enter board name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            disabled={isLoading}
            autoFocus
          />
          {error && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {error}
            </Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Description (optional)
          </Text>
          <Textarea
            placeholder="Enter board description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </Box>
      </VStack>
    </AppModal>
  );
}

// ==================== CREATE NOTE MODAL ====================

interface CreateNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, color: string) => void;
  isLoading: boolean;
}

/**
 * CreateNoteModal - Modal for creating a new sticky note
 */
function CreateNoteModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: CreateNoteModalProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setContent('');
      setSelectedColor(NOTE_COLORS[0]);
      setError('');
    }
  }, [open]);

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

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="New Sticky Note"
      primaryActionText="Create"
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={onClose}
      isLoading={isLoading}
    >
      <VStack gap={4} align="stretch">
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Content <Text as="span" color="red.500">*</Text>
          </Text>
          <Textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError('');
            }}
            disabled={isLoading}
            rows={4}
            maxLength={500}
          />
          <Flex justify="space-between" mt={1}>
            {error && (
              <Text color="red.500" fontSize="sm">
                {error}
              </Text>
            )}
            <Text fontSize="xs" color="fg.muted" ml="auto">
              {content.length}/500
            </Text>
          </Flex>
        </Box>

        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Color
          </Text>
          <HStack gap={3} wrap="wrap">
            {NOTE_COLORS.map((color) => (
              <Box
                key={color}
                w="36px"
                h="36px"
                borderRadius="full"
                bg={color}
                cursor="pointer"
                borderWidth="2px"
                borderColor={selectedColor === color ? 'gray.800' : 'transparent'}
                onClick={() => setSelectedColor(color)}
                _hover={{ transform: 'scale(1.1)' }}
                transition="transform 0.2s"
              />
            ))}
          </HStack>
        </Box>
      </VStack>
    </AppModal>
  );
}


// ==================== CREATE FRIDGE TASK MODAL ====================

interface CreateFridgeTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, boardId: string, sectionId: string) => void;
  isLoading: boolean;
  boards: Board[];
  sections: Section[];
  initialTitle?: string;
}

/**
 * CreateFridgeTaskModal - Modal for creating a new task from the Fridge
 */
function CreateFridgeTaskModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  boards,
  sections,
  initialTitle = '',
}: CreateFridgeTaskModalProps): React.JSX.Element {
  const [title, setTitle] = useState(initialTitle);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [error, setError] = useState('');

  // Reset title when initialTitle changes (e.g., when creating from a note)
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
    }
  }, [open, initialTitle]);

  // Get sections for selected board
  const boardSections = useMemo(() => {
    if (!selectedBoardId) return [];
    return sections
      .filter((s) => s.boardId === selectedBoardId)
      .sort((a, b) => a.position - b.position);
  }, [selectedBoardId, sections]);

  // Auto-select first board and section
  useEffect(() => {
    if (open && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [open, boards, selectedBoardId]);

  useEffect(() => {
    if (boardSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(boardSections[0].id);
    } else if (
      boardSections.length > 0 &&
      !boardSections.find((s) => s.id === selectedSectionId)
    ) {
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
    <AppModal
      open={open}
      onClose={handleClose}
      title="New Task"
      primaryActionText="Create"
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={handleClose}
      isLoading={isLoading}
    >
      <VStack gap={4} align="stretch">
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Title <Text as="span" color="red.500">*</Text>
          </Text>
          <Input
            placeholder="Enter task title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
            disabled={isLoading}
            autoFocus
          />
          {error && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {error}
            </Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Board <Text as="span" color="red.500">*</Text>
          </Text>
          <HStack gap={2} wrap="wrap">
            {boards.map((board) => (
              <Badge
                key={board.id}
                px={3}
                py={2}
                borderRadius="md"
                cursor="pointer"
                variant={selectedBoardId === board.id ? 'solid' : 'outline'}
                colorPalette={selectedBoardId === board.id ? 'brand' : 'gray'}
                onClick={() => setSelectedBoardId(board.id)}
              >
                {board.name}
              </Badge>
            ))}
          </HStack>
        </Box>

        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Section <Text as="span" color="red.500">*</Text>
          </Text>
          <HStack gap={2} wrap="wrap">
            {boardSections.map((section) => (
              <Badge
                key={section.id}
                px={3}
                py={2}
                borderRadius="md"
                cursor="pointer"
                variant={selectedSectionId === section.id ? 'solid' : 'outline'}
                colorPalette={selectedSectionId === section.id ? 'brand' : 'gray'}
                onClick={() => setSelectedSectionId(section.id)}
              >
                {section.name}
              </Badge>
            ))}
          </HStack>
        </Box>
      </VStack>
    </AppModal>
  );
}

// ==================== STICKY NOTE CARD ====================

interface StickyNoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onToggleDone: (noteId: string, isDone: boolean) => void;
  onCreateTask: (note: Note) => void;
  drag?: () => void;
  isActive?: boolean;
}

function StickyNoteCard({ note, onEdit, onDelete, onToggleDone, onCreateTask, drag, isActive }: StickyNoteCardProps): React.JSX.Element {
  return (
    <Box
      w="140px"
      h="140px"
      p={3}
      borderRadius="sm"
      bg={note.color}
      boxShadow="md"
      transform={isActive ? 'rotate(-1deg) scale(1.05)' : 'rotate(-1deg)'}
      position="relative"
      cursor="pointer"
      onClick={() => onEdit(note)}
      _hover={{ transform: 'rotate(-1deg) scale(1.02)' }}
      transition="transform 0.2s"
      flexShrink={0}
      opacity={isActive ? 0.9 : (note.isDone ? 0.7 : 1)}
    >
      {/* Drag Handle */}
      <AppTooltip label="Drag to reorder" placement="top">
        <Box
          position="absolute"
          top={1}
          left={1}
          cursor="grab"
          px={1}
          borderRadius="sm"
          _hover={{ bg: 'blackAlpha.200' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.stopPropagation();
            drag?.();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            drag?.();
          }}
        >
          <Text fontSize="xs" color="gray.600" userSelect="none">⋮⋮</Text>
        </Box>
      </AppTooltip>

      {/* Top right actions: Done toggle and Delete */}
      <HStack position="absolute" top={1} right={1} gap={0}>
        {/* Done toggle */}
        <AppTooltip label={note.isDone ? 'Mark as not done' : 'Mark as done'} placement="top">
          <Box
            w="20px"
            h="20px"
            borderRadius="full"
            bg={note.isDone ? 'green.500' : 'blackAlpha.200'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone(note.id, !note.isDone);
            }}
            _hover={{ bg: note.isDone ? 'green.600' : 'blackAlpha.300' }}
          >
            <Icon boxSize={3} color={note.isDone ? 'white' : 'gray.600'}>
              <CheckIcon />
            </Icon>
          </Box>
        </AppTooltip>
        {/* Delete button - using pin emoji (same size as pinned tasks) */}
        <AppTooltip label="Delete note" placement="top">
          <Box
            cursor="pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            _hover={{ transform: 'scale(1.1)' }}
            transition="transform 0.2s"
          >
            <Text fontSize="sm">📌</Text>
          </Box>
        </AppTooltip>
      </HStack>

      {/* Note content */}
      <Text 
        fontSize="sm" 
        color="gray.800" 
        lineClamp={4} 
        lineHeight="short" 
        mt={3}
        textDecoration={note.isDone ? 'line-through' : 'none'}
      >
        {note.content}
      </Text>

      {/* Create task button */}
      <AppTooltip label="Create task from note" placement="bottom">
        <Box
          position="absolute"
          bottom={1}
          right={1}
          w="22px"
          h="22px"
          borderRadius="full"
          bg="blackAlpha.200"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            onCreateTask(note);
          }}
          _hover={{ bg: 'blackAlpha.300' }}
        >
          <Icon boxSize={3} color="gray.700">
            <AddIcon />
          </Icon>
        </Box>
      </AppTooltip>
    </Box>
  );
}


// ==================== PINNED TASK CARD ====================

interface PinnedTaskCardProps {
  task: Task;
  board: Board | undefined;
  section: Section | undefined;
  onPress: (taskId: string, boardId: string) => void;
  onUnpin: (taskId: string) => void;
  drag?: () => void;
  isActive?: boolean;
}

function PinnedTaskCard({
  task,
  board,
  section,
  onPress,
  onUnpin,
  drag,
  isActive,
}: PinnedTaskCardProps): React.JSX.Element {
  const priorityColors: Record<string, string> = {
    critical: 'red.500',
    high: 'orange.500',
    medium: 'yellow.500',
    low: 'green.500',
  };

  return (
    <AppCard
      isHoverable
      onClick={() => onPress(task.id, task.boardId)}
      w="160px"
      p={3}
      flexShrink={0}
      opacity={isActive ? 0.8 : 1}
      transform={isActive ? 'scale(1.05)' : undefined}
    >
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between">
          {/* Drag Handle */}
          <Box
            cursor="grab"
            px={1}
            py={0.5}
            borderRadius="sm"
            _hover={{ bg: 'blackAlpha.100' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.stopPropagation();
              drag?.();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              drag?.();
            }}
          >
            <Text fontSize="xs" color="fg.muted" userSelect="none">⋮⋮</Text>
          </Box>
          <HStack gap={1}>
            {task.priority && (
              <Box w="8px" h="8px" borderRadius="full" bg={priorityColors[task.priority]} />
            )}
            <Box
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation();
                onUnpin(task.id);
              }}
            >
              <Text fontSize="sm">📌</Text>
            </Box>
          </HStack>
        </HStack>
        <Text fontWeight="semibold" fontSize="sm" lineClamp={2} color="fg">
          {task.title}
        </Text>
        <Text fontSize="xs" color="fg.muted" lineClamp={1}>
          {board?.name || 'Unknown'} • {section?.name || 'Unknown'}
        </Text>
      </VStack>
    </AppCard>
  );
}

// ==================== EDIT NOTE MODAL ====================

interface EditNoteModalProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (content: string, color: string) => void;
}

function EditNoteModal({ note, open, onClose, onSave }: EditNoteModalProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note && open) {
      setContent(note.content);
      setSelectedColor(note.color);
      setError('');
    }
  }, [note, open]);

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
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Note"
      primaryActionText="Save"
      onPrimaryAction={handleSave}
      secondaryActionText="Cancel"
      onSecondaryAction={onClose}
    >
      <VStack gap={4} align="stretch">
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Content <Text as="span" color="red.500">*</Text>
          </Text>
          <Textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError('');
            }}
            rows={4}
            maxLength={500}
          />
          <Flex justify="space-between" mt={1}>
            {error && (
              <Text color="red.500" fontSize="sm">
                {error}
              </Text>
            )}
            <Text fontSize="xs" color="fg.muted" ml="auto">
              {content.length}/500
            </Text>
          </Flex>
        </Box>

        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Color
          </Text>
          <HStack gap={3} wrap="wrap">
            {NOTE_COLORS.map((color) => (
              <Box
                key={color}
                w="36px"
                h="36px"
                borderRadius="full"
                bg={color}
                cursor="pointer"
                borderWidth="2px"
                borderColor={selectedColor === color ? 'gray.800' : 'transparent'}
                onClick={() => setSelectedColor(color)}
                _hover={{ transform: 'scale(1.1)' }}
                transition="transform 0.2s"
              />
            ))}
          </HStack>
        </Box>
      </VStack>
    </AppModal>
  );
}

// ==================== LARGE HEATMAP ====================

interface LargeHeatmapProps {
  data: ActivityHeatmapEntry[];
  days: number;
}

function LargeHeatmap({ data, days }: LargeHeatmapProps): React.JSX.Element {
  const heatmapData = useMemo(() => {
    const result: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = data.find((d) => d.date === dateStr);
      result.push({ date: dateStr, count: entry?.count || 0 });
    }

    return result;
  }, [data, days]);

  const getHeatColor = (count: number): string => {
    if (count === 0) return 'gray.200';
    if (count <= 2) return 'green.200';
    if (count <= 5) return 'green.400';
    if (count <= 10) return 'green.500';
    return 'green.600';
  };

  return (
    <VStack gap={4}>
      <Flex wrap="wrap" gap="3px" justify="flex-start">
        {heatmapData.map((day) => (
          <Box
            key={day.date}
            w="12px"
            h="12px"
            borderRadius="2px"
            bg={getHeatColor(day.count)}
          />
        ))}
      </Flex>
      <HStack gap={1} justify="center">
        <Text fontSize="xs" color="fg.muted">
          Less
        </Text>
        <Box w="12px" h="12px" borderRadius="2px" bg="gray.200" />
        <Box w="12px" h="12px" borderRadius="2px" bg="green.200" />
        <Box w="12px" h="12px" borderRadius="2px" bg="green.400" />
        <Box w="12px" h="12px" borderRadius="2px" bg="green.500" />
        <Box w="12px" h="12px" borderRadius="2px" bg="green.600" />
        <Text fontSize="xs" color="fg.muted">
          More
        </Text>
      </HStack>
    </VStack>
  );
}

// ==================== HEATMAP MODAL ====================

interface HeatmapModalProps {
  open: boolean;
  onClose: () => void;
  board: Board | null;
  heatmapData: ActivityHeatmapEntry[];
  onTimeframeChange: (days: number) => void;
}

function HeatmapModal({
  open,
  onClose,
  board,
  heatmapData,
  onTimeframeChange,
}: HeatmapModalProps): React.JSX.Element {
  const [heatmapDays, setHeatmapDays] = useState(30);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleTimeframeChange = useCallback(
    (days: number) => {
      setHeatmapDays(days);
      setShowCustomInput(false);
      onTimeframeChange(days);
    },
    [onTimeframeChange]
  );

  const handleCustomDaysSubmit = useCallback(() => {
    const days = parseInt(customDaysInput, 10);
    if (days > 0 && days <= 365) {
      setHeatmapDays(days);
      onTimeframeChange(days);
    }
  }, [customDaysInput, onTimeframeChange]);

  return (
    <AppModal open={open} onClose={onClose} title="Activity Heatmap" size="lg">
      <VStack gap={4} align="stretch">
        {board && (
          <Text fontWeight="semibold" fontSize="md">
            {board.name}
          </Text>
        )}

        {/* Timeframe selector */}
        <HStack gap={2} wrap="wrap">
          {[30, 60, 90].map((days) => (
            <Badge
              key={days}
              px={3}
              py={2}
              borderRadius="md"
              cursor="pointer"
              variant={heatmapDays === days && !showCustomInput ? 'solid' : 'outline'}
              colorPalette={heatmapDays === days && !showCustomInput ? 'brand' : 'gray'}
              onClick={() => handleTimeframeChange(days)}
            >
              {days}d
            </Badge>
          ))}
          <Badge
            px={3}
            py={2}
            borderRadius="md"
            cursor="pointer"
            variant={showCustomInput ? 'solid' : 'outline'}
            colorPalette={showCustomInput ? 'brand' : 'gray'}
            onClick={() => setShowCustomInput(!showCustomInput)}
          >
            Custom
          </Badge>
        </HStack>

        {/* Custom days input */}
        {showCustomInput && (
          <HStack gap={2}>
            <Input
              placeholder="Days (1-365)"
              value={customDaysInput}
              onChange={(e) => setCustomDaysInput(e.target.value)}
              type="number"
              maxLength={3}
              w="120px"
            />
            <AppButton intent="primary" onClick={handleCustomDaysSubmit}>
              Apply
            </AppButton>
          </HStack>
        )}

        <Text fontSize="sm" color="fg.muted" textAlign="center">
          Showing last {heatmapDays} days
        </Text>

        {/* Large Heatmap */}
        <Box display="flex" justifyContent="center">
          <LargeHeatmap data={heatmapData} days={heatmapDays} />
        </Box>

        <Text fontSize="xs" color="fg.muted" textAlign="center">
          Activity includes: tasks created, status changes, comments, and attachments
        </Text>

        {/* Board Description */}
        {board?.description && (
          <Box borderTopWidth="1px" pt={4}>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={2}>
              Board Description
            </Text>
            <Text fontSize="sm">{board.description}</Text>
          </Box>
        )}
      </VStack>
    </AppModal>
  );
}


// ==================== ANALYTICS PREVIEW ====================

interface AnalyticsPreviewProps {
  heatmapData: ActivityHeatmapEntry[];
  tasks: Task[];
  sections: Section[];
  onViewMore: () => void;
  streak: {
    currentStreak: number;
    longestStreak: number;
    todayCheckedIn: boolean;
    totalCheckIns: number;
  } | null;
  onCheckIn: () => void;
  isCheckingIn: boolean;
}

/**
 * MiniPieChart - Simple pie chart showing task distribution by section
 */
function MiniPieChart({ tasks, sections }: { tasks: Task[]; sections: Section[] }): React.JSX.Element {
  // Group tasks by section
  const sectionCounts = useMemo(() => {
    const counts: Record<string, { name: string; count: number; color: string }> = {};
    const colors = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    // Count tasks per section
    tasks.forEach((task) => {
      const section = sections.find((s) => s.id === task.sectionId);
      const sectionName = section?.name || 'Other';
      if (!counts[sectionName]) {
        const colorIndex = Object.keys(counts).length % colors.length;
        counts[sectionName] = { name: sectionName, count: 0, color: colors[colorIndex] };
      }
      counts[sectionName].count++;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [tasks, sections]);

  const total = tasks.length;

  if (total === 0) {
    return (
      <VStack gap={2} align="center">
        <Text fontSize="sm" color="fg.muted">No tasks yet</Text>
      </VStack>
    );
  }

  // Calculate percentages for the pie chart segments
  let cumulativePercent = 0;
  const segments = sectionCounts.map((section) => {
    const percent = (section.count / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return { ...section, percent, startPercent };
  });

  // Create conic gradient for pie chart
  const gradientStops = segments.map((seg) => 
    `${seg.color} ${seg.startPercent}% ${seg.startPercent + seg.percent}%`
  ).join(', ');

  return (
    <HStack gap={4} align="flex-start">
      {/* Pie Chart */}
      <Box
        w="80px"
        h="80px"
        borderRadius="full"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      />
      
      {/* Legend */}
      <VStack gap={1} align="flex-start">
        {segments.slice(0, 4).map((seg) => (
          <HStack key={seg.name} gap={2}>
            <Box w="10px" h="10px" borderRadius="2px" bg={seg.color} />
            <Text fontSize="xs" color="fg.muted" lineClamp={1} maxW="80px">
              {seg.name}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="fg">
              {seg.count}
            </Text>
          </HStack>
        ))}
        {segments.length > 4 && (
          <Text fontSize="xs" color="fg.muted">
            +{segments.length - 4} more
          </Text>
        )}
      </VStack>
    </HStack>
  );
}

/**
 * MiniActivityHeatmap - Compact heatmap for analytics preview
 */
function MiniActivityHeatmap({ data }: { data: ActivityHeatmapEntry[] }): React.JSX.Element {
  // Show last 28 days in a 4x7 grid
  const last28Days = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = 27; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = data.find((d) => d.date === dateStr);
      days.push({ date: dateStr, count: entry?.count || 0 });
    }

    return days;
  }, [data]);

  const getHeatColor = (count: number): string => {
    if (count === 0) return 'gray.200';
    if (count <= 2) return 'green.200';
    if (count <= 5) return 'green.400';
    if (count <= 10) return 'green.500';
    return 'green.600';
  };

  const totalActivity = last28Days.reduce((sum, day) => sum + day.count, 0);

  return (
    <VStack gap={2} align="flex-start">
      <Flex wrap="wrap" gap="3px" w="100px">
        {last28Days.map((day) => (
          <Box
            key={day.date}
            w="10px"
            h="10px"
            borderRadius="2px"
            bg={getHeatColor(day.count)}
          />
        ))}
      </Flex>
      <Text fontSize="xs" color="fg.muted">
        {totalActivity} activities in 28 days
      </Text>
    </VStack>
  );
}

/**
 * StreakWidget - Displays current streak with motivational messaging
 */
function StreakWidget({ 
  streak, 
  onCheckIn, 
  isCheckingIn 
}: { 
  streak: { currentStreak: number; longestStreak: number; todayCheckedIn: boolean; totalCheckIns: number } | null;
  onCheckIn: () => void;
  isCheckingIn: boolean;
}): React.JSX.Element {
  // Motivational messages based on streak
  const getStreakMessage = (days: number, checkedIn: boolean): { emoji: string; message: string } => {
    if (!checkedIn) {
      if (days === 0) {
        return { emoji: '🌱', message: 'Start your streak today!' };
      }
      return { emoji: '⏰', message: 'Check in to keep your streak!' };
    }
    
    if (days === 0) return { emoji: '🌱', message: 'Start your journey!' };
    if (days === 1) return { emoji: '🔥', message: 'Day 1 - Great start!' };
    if (days < 3) return { emoji: '🔥', message: 'Building momentum!' };
    if (days < 7) return { emoji: '⚡', message: 'You\'re on fire!' };
    if (days < 14) return { emoji: '💪', message: 'Week warrior!' };
    if (days < 30) return { emoji: '🏆', message: 'Unstoppable!' };
    if (days < 50) return { emoji: '🌟', message: 'Legendary streak!' };
    if (days < 100) return { emoji: '💎', message: 'Diamond dedication!' };
    return { emoji: '👑', message: 'Absolute champion!' };
  };

  const currentStreak = streak?.currentStreak || 0;
  const todayCheckedIn = streak?.todayCheckedIn || false;
  const { emoji, message } = getStreakMessage(currentStreak, todayCheckedIn);

  return (
    <VStack gap={3} align="center" minW="140px">
      {/* Streak Counter */}
      <Box position="relative">
        <Box
          w="80px"
          h="80px"
          borderRadius="full"
          bg={todayCheckedIn ? 'orange.100' : 'gray.100'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderWidth="3px"
          borderColor={todayCheckedIn ? 'orange.400' : 'gray.300'}
          position="relative"
          overflow="hidden"
        >
          {/* Animated glow effect for active streaks */}
          {todayCheckedIn && currentStreak > 0 && (
            <Box
              position="absolute"
              inset={0}
              bg="orange.200"
              opacity={0.5}
              animation="pulse 2s infinite"
            />
          )}
          <VStack gap={0} position="relative">
            <Text fontSize="2xl" fontWeight="bold" color={todayCheckedIn ? 'orange.600' : 'gray.500'}>
              {currentStreak}
            </Text>
            <Text fontSize="xs" color={todayCheckedIn ? 'orange.500' : 'gray.400'} fontWeight="medium">
              {currentStreak === 1 ? 'day' : 'days'}
            </Text>
          </VStack>
        </Box>
        {/* Flame emoji for active streaks */}
        {currentStreak > 0 && todayCheckedIn && (
          <Box position="absolute" top="-8px" right="-8px">
            <Text fontSize="xl">🔥</Text>
          </Box>
        )}
      </Box>

      {/* Message */}
      <VStack gap={1}>
        <HStack gap={1}>
          <Text fontSize="lg">{emoji}</Text>
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            {message}
          </Text>
        </HStack>
        
        {/* Check-in button or status */}
        {!todayCheckedIn ? (
          <AppButton
            intent="primary"
            size="sm"
            onClick={onCheckIn}
            disabled={isCheckingIn}
          >
            {isCheckingIn ? 'Checking in...' : 'Check In'}
          </AppButton>
        ) : (
          <HStack gap={1}>
            <Icon boxSize={3} color="green.500">
              <CheckIcon />
            </Icon>
            <Text fontSize="xs" color="green.600" fontWeight="medium">
              Checked in today
            </Text>
          </HStack>
        )}
      </VStack>

      {/* Stats */}
      {streak && streak.longestStreak > 0 && (
        <HStack gap={3} fontSize="xs" color="fg.muted">
          <Text>Best: {streak.longestStreak} days</Text>
          <Text>•</Text>
          <Text>Total: {streak.totalCheckIns}</Text>
        </HStack>
      )}
    </VStack>
  );
}

/**
 * AnalyticsPreview - Preview widget for analytics on landing page
 */
function AnalyticsPreview({
  heatmapData,
  tasks,
  sections,
  onViewMore,
  streak,
  onCheckIn,
  isCheckingIn,
}: AnalyticsPreviewProps): React.JSX.Element {
  return (
    <AppCard p={4}>
      <VStack gap={4} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <Icon color="brand.500" boxSize={5}>
              <ActivityIcon />
            </Icon>
            <Text fontSize="lg" fontWeight="semibold">
              Analytics Overview
            </Text>
          </HStack>
          <AppButton
            intent="ghost"
            size="sm"
            onClick={onViewMore}
          >
            View More →
          </AppButton>
        </Flex>

        <Flex gap={6} wrap="wrap" justify="space-between" align="flex-start">
          {/* Streak Widget */}
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={2}>
              Daily Streak
            </Text>
            <StreakWidget streak={streak} onCheckIn={onCheckIn} isCheckingIn={isCheckingIn} />
          </Box>

          {/* Activity Heatmap */}
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={2}>
              Activity
            </Text>
            <MiniActivityHeatmap data={heatmapData} />
          </Box>

          {/* Task Distribution */}
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={2}>
              Task Distribution
            </Text>
            <MiniPieChart tasks={tasks} sections={sections} />
          </Box>
        </Flex>
      </VStack>
    </AppCard>
  );
}


// ==================== MAIN BOARD LIST SCREEN ====================

/**
 * BoardListScreen - Displays all user boards in a grid/list view.
 *
 * Requirements:
 * - 6.1: SimpleGrid for responsive board card layout
 * - 6.2: Card components for each board with hover effects
 * - 6.3: Stat components for board statistics
 * - 6.4: Button with AddIcon for "Create Board" action
 * - 6.5: Hover elevation change on board cards
 * - 6.6: Menu with edit and delete options
 * - 6.7: Skeleton components for loading state
 * - 2.6: Icons for sections count, task count, and activity
 * - 17.3: Responsive columns (1 mobile, 2 tablet, 3-4 desktop)
 */
export function BoardListScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BoardList'>>();
  const { colors } = useTheme();
  const toast = useAppToast();

  // Selectors
  const boards = useAppSelector(selectAllBoards);
  const user = useAppSelector(selectCurrentUser);
  const epics = useAppSelector(selectAllEpics);
  const allTasks = useAppSelector(selectAllTasks);
  const allSections = useAppSelector(selectAllSections);
  const pinnedTasks = useAppSelector(selectPinnedTasks);
  const notes = useAppSelector(selectAllNotes);
  const isLoading = useAppSelector((state) => state.boards.isLoading);
  const error = useAppSelector((state) => state.boards.error);
  const boardStats = useAppSelector((state) => state.boards.stats);
  const boardHeatmaps = useAppSelector((state) => state.boards.heatmaps);
  const streak = useAppSelector((state) => state.streak.streak);
  const pendingMilestone = useAppSelector((state) => state.streak.pendingMilestone);
  const isCheckingIn = useAppSelector((state) => state.streak.isLoading);

  // Modal states
  const createBoardModal = useDisclosure();
  const createNoteModal = useDisclosure();
  const createFridgeTaskModal = useDisclosure();
  const heatmapModal = useDisclosure();

  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingFridgeTask, setIsCreatingFridgeTask] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForTask, setNoteForTask] = useState<Note | null>(null); // Note to create task from
  const [selectedBoardForHeatmap, setSelectedBoardForHeatmap] = useState<string | null>(null);

  // Epic modal state
  const [epicModalVisible, setEpicModalVisible] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [isNewEpic, setIsNewEpic] = useState(false);
  const [isSavingEpic, setIsSavingEpic] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning',
  });

  // Pinned task preview modal state
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [previewSectionName, setPreviewSectionName] = useState('');

  // Get linked tasks for selected epic
  const linkedTasks = useMemo(() => {
    if (!selectedEpic) return [];
    return allTasks.filter((task) => task.epicIds?.includes(selectedEpic.id));
  }, [selectedEpic, allTasks]);

  // Get linked board IDs for selected epic
  const linkedBoardIds = useMemo(() => {
    if (!selectedEpic) return [];
    const boardIds = new Set(linkedTasks.map((t) => t.boardId));
    return Array.from(boardIds);
  }, [selectedEpic, linkedTasks]);

  // Get selected board for heatmap modal
  const selectedBoard = useMemo(() => {
    if (!selectedBoardForHeatmap) return null;
    return boards.find((b) => b.id === selectedBoardForHeatmap) || null;
  }, [selectedBoardForHeatmap, boards]);

  // Get task count per epic
  const epicTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    epics.forEach((epic) => {
      counts[epic.id] = allTasks.filter((t) => t.epicIds?.includes(epic.id)).length;
    });
    return counts;
  }, [epics, allTasks]);

  // Sort epics by due date
  const sortedEpics = useMemo(() => {
    return [...epics].sort((a, b) => {
      if (!a.endDate && !b.endDate) return a.name.localeCompare(b.name);
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });
  }, [epics]);

  // Combine heatmap data from all boards for analytics preview
  const combinedHeatmapData = useMemo(() => {
    const combined: Record<string, number> = {};
    Object.values(boardHeatmaps).forEach((heatmap) => {
      if (heatmap?.data) {
        heatmap.data.forEach((entry) => {
          combined[entry.date] = (combined[entry.date] || 0) + entry.count;
        });
      }
    });
    return Object.entries(combined).map(([date, count]) => ({ date, count }));
  }, [boardHeatmaps]);

  // Helper function to calculate time remaining
  const getTimeRemaining = useCallback(
    (endDate: string | null | undefined): { text: string; color: string } | null => {
      if (!endDate) return null;

      const end = new Date(endDate);
      const now = new Date();
      const diffMs = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)}d overdue`, color: 'red.500' };
      } else if (diffDays === 0) {
        return { text: 'Due today', color: 'orange.500' };
      } else if (diffDays === 1) {
        return { text: '1 day left', color: 'orange.500' };
      } else if (diffDays <= 7) {
        return { text: `${diffDays} days left`, color: 'yellow.500' };
      } else if (diffDays <= 30) {
        return { text: `${diffDays} days left`, color: 'green.500' };
      } else {
        const weeks = Math.floor(diffDays / 7);
        return { text: `${weeks}w left`, color: 'green.500' };
      }
    },
    []
  );

  /**
   * Fetch boards, epics, tasks, sections, notes, and streak on mount
   */
  useEffect(() => {
    dispatch(fetchBoards());
    dispatch(fetchAllEpics());
    dispatch(fetchAllTasks());
    dispatch(fetchAllSections());
    dispatch(fetchPinnedTasks());
    dispatch(fetchNotes());
    dispatch(fetchStreak());
  }, [dispatch]);

  /**
   * Fetch stats and heatmaps for all boards
   */
  useEffect(() => {
    boards.forEach((board) => {
      if (!boardStats[board.id]) {
        dispatch(fetchBoardStats(board.id));
      }
      if (!boardHeatmaps[board.id]) {
        dispatch(fetchActivityHeatmap({ boardId: board.id, days: 30 }));
      }
    });
  }, [dispatch, boards, boardStats, boardHeatmaps]);

  /**
   * Handle openEpicId route parameter
   */
  useEffect(() => {
    const openEpicId = route.params?.openEpicId;
    if (openEpicId && epics.length > 0) {
      const epicToOpen = epics.find((e) => e.id === openEpicId);
      if (epicToOpen) {
        navigation.setParams({ openEpicId: undefined });
        navigation.navigate('EpicDetail', { epicId: openEpicId });
      }
    }
  }, [route.params?.openEpicId, epics, navigation]);

  /**
   * Show achievement toast when there's a pending milestone
   */
  useEffect(() => {
    if (pendingMilestone) {
      toast.showSuccess(
        `${pendingMilestone.emoji} ${pendingMilestone.title}!`,
        pendingMilestone.message
      );
      dispatch(clearPendingMilestone());
    }
  }, [pendingMilestone, dispatch, toast]);

  // ==================== HANDLERS ====================

  /**
   * Handle daily check-in
   */
  const handleCheckIn = useCallback(async () => {
    try {
      const result = await dispatch(checkIn()).unwrap();
      if (result.streakBroken) {
        toast.showInfo('Streak Reset', 'Your streak was reset. Start fresh today!');
      } else if (result.isNewStreak && !result.milestone) {
        toast.showSuccess('Checked In!', 'Great start! Keep it going!');
      }
      // Milestone toast is handled by the useEffect above
    } catch {
      toast.showError('Error', 'Failed to check in. Please try again.');
    }
  }, [dispatch, toast]);

  const handleBoardPress = useCallback(
    (boardId: string) => {
      navigation.navigate('Board', { boardId });
    },
    [navigation]
  );

  const handleBoardEdit = useCallback((board: Board) => {
    // TODO: Implement board edit modal
    console.log('Edit board:', board.id);
  }, []);

  const handleBoardDelete = useCallback(
    (boardId: string) => {
      const board = boards.find((b) => b.id === boardId);
      if (!board) return;

      setConfirmDialog({
        open: true,
        title: 'Delete Board',
        message: `Are you sure you want to delete "${board.name}"? This action cannot be undone.`,
        variant: 'danger',
        onConfirm: async () => {
          // Store board data for potential undo - Requirements: 6.8
          const deletedBoardData = {
            name: board.name,
            description: board.description || undefined,
          };

          try {
            await dispatch(deleteBoard(boardId)).unwrap();
            // Requirements: 6.8 - Success toast with undo option
            toast.showSuccess('Board deleted', `"${board.name}" has been deleted`, {
              label: 'Undo',
              onClick: async () => {
                try {
                  await dispatch(createBoard(deletedBoardData)).unwrap();
                  toast.showSuccess('Board restored', `"${deletedBoardData.name}" has been restored`);
                } catch {
                  toast.showError('Error', 'Failed to restore board. Please try again.');
                }
              },
            });
          } catch {
            toast.showError('Error', 'Failed to delete board. Please try again.');
          }
        },
      });
    },
    [dispatch, boards, toast]
  );

  const handleCreateBoard = useCallback(
    async (name: string, description: string) => {
      setIsCreating(true);
      try {
        await dispatch(createBoard({ name, description: description || undefined })).unwrap();
        createBoardModal.onClose();
        toast.showSuccess('Board created', `"${name}" is ready to use`);
      } catch {
        toast.showError('Error', 'Failed to create board. Please try again.');
      } finally {
        setIsCreating(false);
      }
    },
    [dispatch, createBoardModal, toast]
  );

  const handleHeatmapPress = useCallback(
    (boardId: string) => {
      setSelectedBoardForHeatmap(boardId);
      dispatch(fetchActivityHeatmap({ boardId, days: 30 }));
      heatmapModal.onOpen();
    },
    [dispatch, heatmapModal]
  );

  const handleHeatmapTimeframeChange = useCallback(
    (days: number) => {
      if (selectedBoardForHeatmap) {
        dispatch(fetchActivityHeatmap({ boardId: selectedBoardForHeatmap, days }));
      }
    },
    [dispatch, selectedBoardForHeatmap]
  );

  const handleEpicPress = useCallback(
    (epic: Epic) => {
      navigation.navigate('EpicDetail', { epicId: epic.id });
    },
    [navigation]
  );

  const handleEpicPressById = useCallback(
    (epicId: string) => {
      navigation.navigate('EpicDetail', { epicId });
    },
    [navigation]
  );

  const handleEpicEdit = useCallback((epic: Epic) => {
    setSelectedEpic(epic);
    setIsNewEpic(false);
    setEpicModalVisible(true);
  }, []);

  const handleCreateEpicPress = useCallback(() => {
    setSelectedEpic(null);
    setIsNewEpic(true);
    setEpicModalVisible(true);
  }, []);

  const handleSaveEpic = useCallback(
    async (data: {
      name: string;
      description: string;
      color: string;
      endDate?: string;
      boardIds: string[];
    }) => {
      setIsSavingEpic(true);
      try {
        if (isNewEpic) {
          const boardId = data.boardIds[0] || boards[0]?.id;
          if (!boardId) {
            toast.showError('Error', 'Please create a board first');
            return;
          }
          await dispatch(
            createEpic({
              boardId,
              data: {
                name: data.name,
                description: data.description || undefined,
                color: data.color,
                endDate: data.endDate,
              },
            })
          ).unwrap();
          toast.showSuccess('Epic created', `"${data.name}" is ready`);
        } else if (selectedEpic) {
          await dispatch(
            updateEpic({
              id: selectedEpic.id,
              data: {
                name: data.name,
                description: data.description || undefined,
                color: data.color,
                endDate: data.endDate,
              },
            })
          ).unwrap();
          toast.showSuccess('Epic updated', 'Changes saved');
        }
        setEpicModalVisible(false);
        setSelectedEpic(null);
      } catch {
        toast.showError('Error', 'Failed to save epic');
      } finally {
        setIsSavingEpic(false);
      }
    },
    [dispatch, isNewEpic, selectedEpic, boards, toast]
  );

  const handleDeleteEpic = useCallback(() => {
    if (!selectedEpic) return;
    
    setConfirmDialog({
      open: true,
      title: 'Delete Epic',
      message: `Are you sure you want to delete "${selectedEpic.name}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: () => {
        dispatch(deleteEpic({ epicId: selectedEpic.id, boardId: selectedEpic.boardId }))
          .unwrap()
          .then(() => {
            setEpicModalVisible(false);
            setSelectedEpic(null);
            toast.showSuccess('Epic deleted');
          })
          .catch(() => {
            toast.showError('Error', 'Failed to delete epic');
          });
      },
    });
  }, [dispatch, selectedEpic, toast]);

  const handleTaskPress = useCallback(
    (taskId: string, boardId: string) => {
      setEpicModalVisible(false);
      navigation.navigate('TaskDetail', { taskId, boardId });
    },
    [navigation]
  );

  const handleLogout = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      variant: 'warning',
      onConfirm: () => {
        dispatch(logout());
      },
    });
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearBoardsError());
  }, [dispatch]);


  // ==================== FRIDGE HANDLERS ====================

  const handleCreateNote = useCallback(
    async (content: string, color: string) => {
      setIsCreatingNote(true);
      try {
        await dispatch(createNote({ content, color })).unwrap();
        createNoteModal.onClose();
        toast.showSuccess('Note created');
      } catch {
        toast.showError('Error', 'Failed to create note');
      } finally {
        setIsCreatingNote(false);
      }
    },
    [dispatch, createNoteModal, toast]
  );

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
  }, []);

  const handleSaveEditedNote = useCallback(
    async (content: string, color: string) => {
      if (!editingNote) return;
      try {
        await dispatch(updateNote({ id: editingNote.id, content, color })).unwrap();
        setEditingNote(null);
        toast.showSuccess('Note updated');
      } catch {
        toast.showError('Error', 'Failed to update note');
      }
    },
    [dispatch, editingNote, toast]
  );

  const handleToggleNoteDone = useCallback(
    async (noteId: string, isDone: boolean) => {
      try {
        await dispatch(updateNote({ id: noteId, isDone })).unwrap();
        toast.showSuccess(isDone ? 'Note marked as done' : 'Note marked as not done');
      } catch {
        toast.showError('Error', 'Failed to update note');
      }
    },
    [dispatch, toast]
  );

  const handleCreateTaskFromNote = useCallback((note: Note) => {
    setNoteForTask(note);
    createFridgeTaskModal.onOpen();
  }, [createFridgeTaskModal]);

  const handleNotesReorder = useCallback(
    async (data: Note[]) => {
      const noteIds = data.map((note) => note.id);
      try {
        await dispatch(reorderNotes(noteIds)).unwrap();
      } catch {
        toast.showError('Error', 'Failed to reorder notes');
      }
    },
    [dispatch, toast]
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      setConfirmDialog({
        open: true,
        title: 'Delete Note',
        message: 'Are you sure you want to delete this note?',
        variant: 'danger',
        onConfirm: async () => {
          try {
            await dispatch(deleteNote(noteId)).unwrap();
            toast.showInfo('Note deleted');
          } catch {
            toast.showError('Error', 'Failed to delete note');
          }
        },
      });
    },
    [dispatch, toast]
  );

  const handleCreateFridgeTask = useCallback(
    async (title: string, boardId: string, sectionId: string) => {
      setIsCreatingFridgeTask(true);
      try {
        const result = await dispatch(
          createTask({ boardId, data: { title, sectionId } })
        ).unwrap();
        await dispatch(toggleTaskPin(result.id)).unwrap();
        dispatch(fetchBoardStats(boardId));
        
        // If creating from a note, delete the note
        if (noteForTask) {
          await dispatch(deleteNote(noteForTask.id)).unwrap();
          setNoteForTask(null);
        }
        
        createFridgeTaskModal.onClose();
        toast.showSuccess('Task created and pinned');
      } catch {
        toast.showError('Error', 'Failed to create task');
      } finally {
        setIsCreatingFridgeTask(false);
      }
    },
    [dispatch, createFridgeTaskModal, toast, noteForTask]
  );

  // Handle closing the fridge task modal (reset noteForTask)
  const handleCloseFridgeTaskModal = useCallback(() => {
    setNoteForTask(null);
    createFridgeTaskModal.onClose();
  }, [createFridgeTaskModal]);

  const handleUnpinTask = useCallback(
    async (taskId: string) => {
      try {
        await dispatch(toggleTaskPin(taskId)).unwrap();
        toast.showInfo('Task unpinned');
      } catch {
        toast.showError('Error', 'Failed to unpin task');
      }
    },
    [dispatch, toast]
  );

  // Handle reordering pinned tasks via drag and drop
  const handlePinnedTasksReorder = useCallback(
    async (data: Task[]) => {
      const taskIds = data.map((task) => task.id);
      try {
        await dispatch(reorderPinnedTasks(taskIds)).unwrap();
      } catch {
        toast.showError('Error', 'Failed to reorder pinned tasks');
      }
    },
    [dispatch, toast]
  );

  const handlePinnedTaskPress = useCallback(
    (taskId: string, boardId: string) => {
      // Find the task and show preview modal
      const task = pinnedTasks.find((t) => t.id === taskId);
      if (task) {
        const section = allSections.find((s) => s.id === task.sectionId);
        setPreviewTask(task);
        setPreviewSectionName(section?.name || 'Unknown');
      }
    },
    [pinnedTasks, allSections]
  );

  // Handle view full details from pinned task preview
  const handleViewPinnedTaskDetails = useCallback(() => {
    if (previewTask) {
      navigation.navigate('TaskDetail', { taskId: previewTask.id, boardId: previewTask.boardId });
    }
    setPreviewTask(null);
  }, [previewTask, navigation]);

  // Handle epic press from pinned task preview
  const handlePreviewEpicPress = useCallback(
    (epicId: string) => {
      setPreviewTask(null);
      setTimeout(() => {
        navigation.navigate('EpicDetail', { epicId });
      }, 100);
    },
    [navigation]
  );

  // Handle task press from pinned task preview (for dependent tasks)
  const handlePreviewTaskPress = useCallback(
    (taskId: string) => {
      // Find the task to get its boardId
      const task = allTasks.find((t) => t.id === taskId);
      if (task) {
        setPreviewTask(null);
        setTimeout(() => {
          navigation.navigate('TaskDetail', { taskId, boardId: task.boardId });
        }, 100);
      }
    },
    [allTasks, navigation]
  );

  // ==================== RENDER ====================

  // Determine if we're in dark mode for logo color adjustment
  const { isDarkMode } = useTheme();

  return (
    <ThemedBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: '100%' }}>
        <Box minH="100vh">
        {/* Header */}
        <Flex
          as="header"
          justify="space-between"
          align="center"
          p={5}
          bg={colors.headerBackground}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Box>
            <Text 
              fontSize="2xl" 
              fontWeight="extrabold" 
              bgGradient="to-r" 
              gradientFrom={isDarkMode ? "cyan.400" : "yellow.300"}
              gradientTo={isDarkMode ? "purple.500" : "orange.400"}
              bgClip="text"
              letterSpacing="tight"
              css={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ✨ Pragma
            </Text>
            <Text fontSize="sm" color={colors.headerText} opacity={0.8}>
              Welcome, {user?.displayName || 'User'}
            </Text>
          </Box>
          <HStack gap={3}>
            <GlobalSearch
              boards={boards}
              tasks={allTasks}
              epics={epics}
              sections={allSections}
              onSelectBoard={handleBoardPress}
              onSelectTask={handlePinnedTaskPress}
              onSelectEpic={handleEpicPressById}
            />
            <DarkModeToggle />
            <ProfileAvatar displayName={user?.displayName || 'User'} onLogout={handleLogout} />
          </HStack>
        </Flex>

        {/* Error Banner */}
        {error && (
          <Box
            bg="red.50"
            _dark={{ bg: 'red.900' }}
            p={3}
            cursor="pointer"
            onClick={handleClearError}
          >
            <Text color="red.600" _dark={{ color: 'red.200' }} textAlign="center" fontSize="sm">
              {error}
            </Text>
            <Text color="fg.muted" textAlign="center" fontSize="xs">
              Tap to dismiss
            </Text>
          </Box>
        )}

        {/* Content */}
        <Container maxW="container.xl" py={6}>
          {/* Loading State - Requirements: 6.7 */}
          {isLoading && boards.length === 0 ? (
            <LoadingState variant="skeleton-card" count={6} label="Loading boards..." />
          ) : (
            <VStack gap={8} align="stretch">
              {/* Analytics Preview Section */}
              <AnalyticsPreview
                heatmapData={combinedHeatmapData}
                tasks={allTasks}
                sections={allSections}
                onViewMore={() => navigation.navigate('Analytics')}
                streak={streak}
                onCheckIn={handleCheckIn}
                isCheckingIn={isCheckingIn}
              />

              {/* Pin Board Section */}
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Icon color="brand.500" boxSize={5}>
                      <PinIcon />
                    </Icon>
                    <Text fontSize="lg" fontWeight="semibold">
                      Pin Board
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Text
                      color="brand.500"
                      fontWeight="semibold"
                      fontSize="sm"
                      cursor="pointer"
                      onClick={createNoteModal.onOpen}
                    >
                      + Note
                    </Text>
                    <Text
                      color="brand.500"
                      fontWeight="semibold"
                      fontSize="sm"
                      cursor="pointer"
                      onClick={createFridgeTaskModal.onOpen}
                    >
                      + Task
                    </Text>
                  </HStack>
                </Flex>

                {pinnedTasks.length === 0 && notes.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted" fontStyle="italic">
                    Your pin board is empty. Pin tasks or add sticky notes to keep important items
                    visible.
                  </Text>
                ) : (
                  <VStack gap={4} align="stretch">
                    {/* Sticky Notes */}
                    {notes.length > 0 && (
                      <Box>
                        <HStack gap={1} mb={2}>
                          <Icon color="fg.muted" boxSize={3}>
                            <FiFileText />
                          </Icon>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="fg.muted"
                            textTransform="uppercase"
                          >
                            Notes
                          </Text>
                        </HStack>
                        <View style={{ height: 150 }}>
                          <DraggableFlatList
                            data={notes}
                            keyExtractor={(item) => item.id}
                            horizontal
                            onDragEnd={({ data }) => handleNotesReorder(data)}
                            renderItem={({ item, drag, isActive }: RenderItemParams<Note>) => (
                              <ScaleDecorator>
                                <View style={{ marginRight: 12 }}>
                                  <StickyNoteCard
                                    note={item}
                                    onEdit={handleEditNote}
                                    onDelete={handleDeleteNote}
                                    onToggleDone={handleToggleNoteDone}
                                    onCreateTask={handleCreateTaskFromNote}
                                    drag={drag}
                                    isActive={isActive}
                                  />
                                </View>
                              </ScaleDecorator>
                            )}
                            contentContainerStyle={{ paddingBottom: 8 }}
                          />
                        </View>
                      </Box>
                    )}

                    {/* Pinned Tasks */}
                    {pinnedTasks.length > 0 && (
                      <Box>
                        <HStack gap={1} mb={2}>
                          <Icon color="fg.muted" boxSize={3}>
                            <PinIcon />
                          </Icon>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="fg.muted"
                            textTransform="uppercase"
                          >
                            Pinned Tasks
                          </Text>
                        </HStack>
                        <View style={{ height: 140 }}>
                          <DraggableFlatList
                            data={pinnedTasks}
                            keyExtractor={(item) => item.id}
                            horizontal
                            onDragEnd={({ data }) => handlePinnedTasksReorder(data)}
                            renderItem={({ item, drag, isActive }: RenderItemParams<Task>) => {
                              const board = boards.find((b) => b.id === item.boardId);
                              const section = allSections.find((s) => s.id === item.sectionId);
                              return (
                                <ScaleDecorator>
                                  <View style={{ marginRight: 12 }}>
                                    <PinnedTaskCard
                                      task={item}
                                      board={board}
                                      section={section}
                                      onPress={handlePinnedTaskPress}
                                      onUnpin={handleUnpinTask}
                                      drag={drag}
                                      isActive={isActive}
                                    />
                                  </View>
                                </ScaleDecorator>
                              );
                            }}
                            contentContainerStyle={{ paddingBottom: 8 }}
                          />
                        </View>
                      </Box>
                    )}
                  </VStack>
                )}
              </Box>


              {/* Boards Section - Requirements: 6.1, 6.4, 17.3 */}
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Icon color="brand.500" boxSize={5}>
                      <HiOutlineClipboardList />
                    </Icon>
                    <Text fontSize="lg" fontWeight="semibold">
                      Boards
                    </Text>
                  </HStack>
                  {/* Requirements: 6.4 - Consistent "+ New" text link pattern */}
                  <Text
                    color="brand.500"
                    fontWeight="semibold"
                    fontSize="sm"
                    cursor="pointer"
                    onClick={createBoardModal.onOpen}
                  >
                    + New
                  </Text>
                </Flex>

                {boards.length === 0 ? (
                  /* Empty State - Requirements: 16.6 */
                  <EmptyState
                    icon={<ListIcon />}
                    title="No boards yet"
                    description="Create your first board to start organizing your tasks"
                    actionText="Create your first board"
                    actionIcon={<AddIcon />}
                    onAction={createBoardModal.onOpen}
                  />
                ) : (
                  /* Board Grid - Requirements: 6.1, 17.3 */
                  <SimpleGrid
                    columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                    gap={4}
                  >
                    {boards.map((board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        onPress={handleBoardPress}
                        onEdit={handleBoardEdit}
                        onDelete={handleBoardDelete}
                        onHeatmapPress={handleHeatmapPress}
                        stats={boardStats[board.id]}
                        heatmap={boardHeatmaps[board.id]?.data}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Box>

              {/* Epics Section */}
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Icon color="brand.500" boxSize={5}>
                      <TagIcon />
                    </Icon>
                    <Text fontSize="lg" fontWeight="semibold">
                      Epics
                    </Text>
                  </HStack>
                  <Text
                    color="brand.500"
                    fontWeight="semibold"
                    fontSize="sm"
                    cursor="pointer"
                    onClick={handleCreateEpicPress}
                  >
                    + New
                  </Text>
                </Flex>

                {sortedEpics.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted" fontStyle="italic">
                    No epics yet. Create one to group related tasks.
                  </Text>
                ) : (
                  <HStack gap={3} overflowX="auto" pb={2}>
                    {sortedEpics.map((epic) => {
                      const timeRemaining = getTimeRemaining(epic.endDate);
                      return (
                        <AppCard
                          key={epic.id}
                          isHoverable
                          onClick={() => handleEpicPress(epic)}
                          w="140px"
                          flexShrink={0}
                          p={3}
                        >
                          <VStack align="stretch" gap={2}>
                            <Flex justify="space-between" align="center">
                              <Box w="24px" h="4px" borderRadius="2px" bg={epic.color} />
                              <Box
                                cursor="pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEpicEdit(epic);
                                }}
                              >
                                <Icon color="fg.muted" boxSize={3}>
                                  <EditIcon />
                                </Icon>
                              </Box>
                            </Flex>
                            <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                              {epic.name}
                            </Text>
                            <Text fontSize="xs" color="fg.muted">
                              {epicTaskCounts[epic.id] || 0} tasks
                            </Text>
                            {timeRemaining && (
                              <Badge
                                colorPalette={
                                  timeRemaining.color.includes('red')
                                    ? 'red'
                                    : timeRemaining.color.includes('orange')
                                    ? 'orange'
                                    : timeRemaining.color.includes('yellow')
                                    ? 'yellow'
                                    : 'green'
                                }
                                fontSize="2xs"
                                alignSelf="flex-start"
                              >
                                {timeRemaining.text}
                              </Badge>
                            )}
                          </VStack>
                        </AppCard>
                      );
                    })}
                  </HStack>
                )}
              </Box>
            </VStack>
          )}
        </Container>

        {/* Modals */}
        <CreateBoardModal
          open={createBoardModal.open}
          onClose={createBoardModal.onClose}
          onSubmit={handleCreateBoard}
          isLoading={isCreating}
        />

        <CreateNoteModal
          open={createNoteModal.open}
          onClose={createNoteModal.onClose}
          onSubmit={handleCreateNote}
          isLoading={isCreatingNote}
        />

        <CreateFridgeTaskModal
          open={createFridgeTaskModal.open}
          onClose={handleCloseFridgeTaskModal}
          onSubmit={handleCreateFridgeTask}
          isLoading={isCreatingFridgeTask}
          boards={boards}
          sections={allSections}
          initialTitle={noteForTask?.content || ''}
        />

        <EditNoteModal
          note={editingNote}
          open={!!editingNote}
          onClose={() => setEditingNote(null)}
          onSave={handleSaveEditedNote}
        />

        <HeatmapModal
          open={heatmapModal.open}
          onClose={heatmapModal.onClose}
          board={selectedBoard}
          heatmapData={
            selectedBoardForHeatmap && boardHeatmaps[selectedBoardForHeatmap]
              ? boardHeatmaps[selectedBoardForHeatmap].data
              : []
          }
          onTimeframeChange={handleHeatmapTimeframeChange}
        />

        {/* Epic Modal */}
        <EpicModal
          visible={epicModalVisible}
          epic={selectedEpic}
          linkedTasks={linkedTasks}
          allBoards={boards}
          allSections={allSections}
          linkedBoardIds={linkedBoardIds}
          onClose={() => {
            setEpicModalVisible(false);
            setSelectedEpic(null);
          }}
          onSave={handleSaveEpic}
          onDelete={selectedEpic ? handleDeleteEpic : undefined}
          onTaskPress={handleTaskPress}
          isLoading={isSavingEpic}
          isNew={isNewEpic}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmText={confirmDialog.variant === 'danger' ? 'Delete' : 'Confirm'}
        />

        {/* Pinned Task Preview Modal */}
        <TaskPreviewModal
          visible={!!previewTask}
          task={previewTask}
          epics={epics}
          allTasks={allTasks}
          sectionName={previewSectionName}
          onClose={() => setPreviewTask(null)}
          onViewDetails={handleViewPinnedTaskDetails}
          onEpicPress={handlePreviewEpicPress}
          onTaskPress={handlePreviewTaskPress}
        />
        </Box>
      </ScrollView>
    </ThemedBackground>
  );
}

export default BoardListScreen;
