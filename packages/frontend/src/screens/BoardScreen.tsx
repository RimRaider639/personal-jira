/**
 * BoardScreen - Displays a single board with sections and tasks.
 *
 * Migrated to Chakra UI with:
 * - Flex with horizontal scroll for section columns (Req 7.1)
 * - Card components for section headers with task count Badge (Req 7.2)
 * - IconButton for section actions with tooltips (Req 7.3, 7.6)
 * - InputGroup with search icon for search bar (Req 7.4)
 * - Badge for active filter count (Req 7.5)
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Badge,
  Input,
  Textarea,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchBoard,
  fetchSections,
  fetchTasks,
  fetchEpics,
  createSection,
  createTask,
  updateBoard,
  setCurrentBoard,
  moveTask,
  reorderTasksInSection,
  setSectionOrder,
  reorderSections,
  assignEpicToTask,
  removeEpicFromTask,
  toggleEpicFilter,
  togglePriorityFilter,
  setDueDateFilter,
  clearFilters,
  startSprint,
  fetchArchivedTasks,
  unarchiveTask,
  logout,
  toggleTaskPin,
  cloneTask,
} from '@/store/slices';
import {
  selectBoardById,
  selectSectionsByBoardId,
  selectFilteredTasksBySectionId,
  selectEpicsByBoardId,
  selectHasActiveFilters,
  selectFilteredTaskCount,
  selectTotalTaskCount,
  selectSyncStatus,
  selectFiltersByBoardId,
  selectTaskById,
  selectCurrentUser,
} from '@/store/selectors';
import { DraggableSectionList, ThemedBackground, BoardThemeSelector, DarkModeToggle, DatePicker, FilterPanel, TaskPreviewModal, ProfileAvatar } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
import {
  AppCard,
  AppCardBody,
  AppButton,
  AppIconButton,
  AppModal,
  AppTooltip,
  AppInput,
  ConfirmDialog,
} from '@/components/chakra';
import { useAppToast } from '@/hooks/useToast';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  SearchIcon,
  FilterIcon,
  HomeIcon,
  CloseIcon,
  RefreshIcon,
} from '@/theme/icons';
import { HiOutlineArchive } from 'react-icons/hi';
import type { Task, Priority, DueDateFilter } from '@kanban/shared';

interface BoardScreenProps {
  boardId: string;
  onBack?: () => void;
  onTaskPress?: (taskId: string) => void;
  onEpicPress?: (epicId: string) => void;
}

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical' | null;
  storyPoints?: number;
  endDate?: string;
}

interface CreateTaskModalProps {
  visible: boolean;
  sectionId: string | null;
  sectionName: string;
  onClose: () => void;
  onSubmit: (data: CreateTaskData, sectionId: string) => void;
  isLoading: boolean;
}

interface CreateSectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

const BOARD_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const PRIORITIES = [
  { value: 'critical' as const, label: 'Critical', color: '#dc2626' },
  { value: 'high' as const, label: 'High', color: '#f97316' },
  { value: 'medium' as const, label: 'Medium', color: '#eab308' },
  { value: 'low' as const, label: 'Low', color: '#22c55e' },
];


/**
 * CreateSectionModal - Modal for creating a new section using Chakra UI
 */
function CreateSectionModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: CreateSectionModalProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError('Section name is required');
      return;
    }
    onSubmit(name.trim());
    setName('');
    setError('');
  }, [name, onSubmit]);

  const handleClose = useCallback(() => {
    setName('');
    setError('');
    onClose();
  }, [onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setName('');
      setError('');
    }
  }, [visible]);

  return (
    <AppModal
      open={visible}
      onClose={handleClose}
      title="Add Section"
      primaryActionText="Add Section"
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={handleClose}
      isLoading={isLoading}
    >
      <VStack gap={4} align="stretch">
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Section Name <Text as="span" color="red.500">*</Text>
          </Text>
          <Input
            placeholder="Enter section name"
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
      </VStack>
    </AppModal>
  );
}

interface EditBoardModalProps {
  visible: boolean;
  boardName: string;
  boardDescription: string;
  boardColor: string;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string) => void;
  isLoading: boolean;
}

/**
 * EditBoardModal - Modal for editing board details using Chakra UI
 */
function EditBoardModal({
  visible,
  boardName,
  boardDescription,
  boardColor,
  onClose,
  onSubmit,
  isLoading,
}: EditBoardModalProps): React.JSX.Element {
  const [name, setName] = useState(boardName);
  const [description, setDescription] = useState(boardDescription);
  const [color, setColor] = useState(boardColor);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(boardName);
    setDescription(boardDescription);
    setColor(boardColor);
    setError('');
  }, [boardName, boardDescription, boardColor, visible]);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }
    onSubmit(name.trim(), description.trim(), color);
  }, [name, description, color, onSubmit]);

  return (
    <AppModal
      open={visible}
      onClose={onClose}
      title="Edit Board"
      primaryActionText="Save"
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={onClose}
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
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </Box>

        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Color
          </Text>
          <HStack gap={2} wrap="wrap">
            {BOARD_COLORS.map((c) => (
              <Box
                key={c}
                w="32px"
                h="32px"
                borderRadius="full"
                bg={c}
                cursor="pointer"
                borderWidth={color === c ? '3px' : '0'}
                borderColor="white"
                boxShadow={color === c ? 'md' : 'none'}
                onClick={() => setColor(c)}
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


/**
 * CreateTaskModal - Modal for creating a new task with all fields using Chakra UI
 */
function CreateTaskModal({
  visible,
  sectionId,
  sectionName,
  onClose,
  onSubmit,
  isLoading,
}: CreateTaskModalProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical' | null>(null);
  const [storyPoints, setStoryPoints] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (sectionId) {
      const data: CreateTaskData = {
        title: title.trim(),
      };
      if (description.trim()) {
        data.description = description.trim();
      }
      if (priority) {
        data.priority = priority;
      }
      if (storyPoints && !isNaN(parseInt(storyPoints, 10))) {
        data.storyPoints = parseInt(storyPoints, 10);
      }
      if (endDate) {
        data.endDate = endDate;
      }
      onSubmit(data, sectionId);
    }
  }, [title, description, priority, storyPoints, endDate, sectionId, onSubmit]);

  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setPriority(null);
    setStoryPoints('');
    setEndDate('');
    setError('');
    onClose();
  }, [onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setPriority(null);
      setStoryPoints('');
      setEndDate('');
      setError('');
    }
  }, [visible]);

  return (
    <AppModal
      open={visible}
      onClose={handleClose}
      title={`Add Task to ${sectionName}`}
      primaryActionText="Add Task"
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={handleClose}
      isLoading={isLoading}
      size="lg"
    >
      <VStack gap={4} align="stretch">
        {/* Title */}
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Task Title <Text as="span" color="red.500">*</Text>
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

        {/* Description */}
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Description (optional)
          </Text>
          <Textarea
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </Box>

        {/* Priority */}
        <Box>
          <Text fontWeight="semibold" mb={2} fontSize="sm">
            Priority
          </Text>
          <HStack gap={2} wrap="wrap">
            {PRIORITIES.map((p) => (
              <Badge
                key={p.value}
                px={3}
                py={2}
                borderRadius="md"
                cursor="pointer"
                variant={priority === p.value ? 'solid' : 'outline'}
                bg={priority === p.value ? `${p.color}20` : 'transparent'}
                borderColor={priority === p.value ? p.color : 'gray.300'}
                borderWidth="1px"
                onClick={() => setPriority(priority === p.value ? null : p.value)}
              >
                <HStack gap={1}>
                  <Box w="8px" h="8px" borderRadius="full" bg={p.color} />
                  <Text fontSize="sm" color={priority === p.value ? p.color : 'fg'}>
                    {p.label}
                  </Text>
                </HStack>
              </Badge>
            ))}
          </HStack>
        </Box>

        {/* Story Points and Due Date Row */}
        <Flex gap={4}>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="sm">
              Story Points
            </Text>
            <Input
              placeholder="0"
              value={storyPoints}
              onChange={(e) => setStoryPoints(e.target.value)}
              type="number"
              disabled={isLoading}
            />
          </Box>
          <Box flex={1}>
            <Text fontWeight="semibold" mb={2} fontSize="sm">
              Due Date
            </Text>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="Select date"
            />
          </Box>
        </Flex>
      </VStack>
    </AppModal>
  );
}


/**
 * ArchivedTasksModal - Modal for viewing and restoring archived tasks using Chakra UI
 */
interface ArchivedTasksModalProps {
  visible: boolean;
  tasks: Task[];
  onClose: () => void;
  onUnarchive: (taskId: string) => void;
}

function ArchivedTasksModal({
  visible,
  tasks,
  onClose,
  onUnarchive,
}: ArchivedTasksModalProps): React.JSX.Element {
  return (
    <AppModal
      open={visible}
      onClose={onClose}
      title={`Archived Tasks (${tasks.length})`}
      size="lg"
    >
      <Box maxH="60vh" overflowY="auto">
        {tasks.length === 0 ? (
          <VStack py={10} gap={4}>
            <Icon boxSize={12} color="fg.muted">
              <HiOutlineArchive />
            </Icon>
            <Text fontWeight="semibold" color="fg">
              No archived tasks
            </Text>
            <Text fontSize="sm" color="fg.muted" textAlign="center">
              Tasks in "Done" sections will be archived when you start a new sprint
            </Text>
          </VStack>
        ) : (
          <VStack gap={3} align="stretch">
            {tasks.map((task) => (
              <AppCard key={task.id} variant="outline" p={4}>
                <Flex justify="space-between" align="center" gap={3}>
                  <Box flex={1}>
                    <Text fontWeight="semibold" fontSize="sm" lineClamp={2} color="fg">
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text fontSize="xs" color="fg.muted" lineClamp={1} mt={1}>
                        {task.description}
                      </Text>
                    )}
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      Archived: {new Date(task.updatedAt).toLocaleDateString()}
                    </Text>
                  </Box>
                  <AppButton
                    intent="primary"
                    size="sm"
                    onClick={() => onUnarchive(task.id)}
                  >
                    Restore
                  </AppButton>
                </Flex>
              </AppCard>
            ))}
          </VStack>
        )}
      </Box>
    </AppModal>
  );
}

/**
 * SearchBar - Search input with Chakra UI InputGroup and search icon
 * Requirements: 7.4
 */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchBar({ value, onChange, placeholder = 'Search tasks...' }: SearchBarProps): React.JSX.Element {
  return (
    <Box position="relative" w="full" maxW="300px">
      <Box
        position="absolute"
        left={3}
        top="50%"
        transform="translateY(-50%)"
        zIndex={1}
        color="fg.muted"
      >
        <Icon boxSize={4}>
          <SearchIcon />
        </Icon>
      </Box>
      <Input
        pl={10}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        bg="bg"
        borderRadius="md"
        size="sm"
      />
    </Box>
  );
}

/**
 * FilterCountBadge - Badge showing active filter count
 * Requirements: 7.5
 */
interface FilterCountBadgeProps {
  filteredCount: number;
  totalCount: number;
  onClear: () => void;
}

function FilterCountBadge({ filteredCount, totalCount, onClear }: FilterCountBadgeProps): React.JSX.Element {
  return (
    <Flex
      align="center"
      justify="space-between"
      px={4}
      py={2}
      bg="brand.50"
      borderRadius="md"
    >
      <HStack gap={2}>
        <Badge colorPalette="brand" variant="solid">
          {filteredCount} of {totalCount}
        </Badge>
        <Text fontSize="sm" color="brand.700">
          tasks shown
        </Text>
      </HStack>
      <AppButton
        intent="ghost"
        size="sm"
        onClick={onClear}
        tooltip="Clear all filters"
      >
        Clear
      </AppButton>
    </Flex>
  );
}


/**
 * BoardHeader - Header component with Chakra UI styling
 * Requirements: 7.3, 7.5, 7.6
 */
interface BoardHeaderProps {
  board: { name: string; color?: string | null };
  user: { displayName?: string } | null;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  archivedTasksCount: number;
  isStartingSprint: boolean;
  onBack?: () => void;
  onEditBoard: () => void;
  onShowArchived: () => void;
  onStartSprint: () => void;
  onOpenFilters: () => void;
  onLogout: () => void;
  boardId: string;
}

function BoardHeader({
  board,
  user,
  hasActiveFilters,
  filteredCount,
  totalCount,
  archivedTasksCount,
  isStartingSprint,
  onBack,
  onEditBoard,
  onShowArchived,
  onStartSprint,
  onOpenFilters,
  onLogout,
  boardId,
}: BoardHeaderProps): React.JSX.Element {
  return (
    <Flex
      align="center"
      justify="space-between"
      p={4}
      bg={board.color || 'brand.500'}
    >
      {/* Left side - Back button and board name */}
      <HStack gap={3} flex={1}>
        {onBack && (
          <AppTooltip label="Go to home" placement="bottom">
            <AppIconButton
              intent="ghost"
              aria-label="Go to home"
              onClick={onBack}
              bg="whiteAlpha.200"
              color="white"
              _hover={{ bg: 'whiteAlpha.300' }}
            >
              <HomeIcon />
            </AppIconButton>
          </AppTooltip>
        )}
        <Box cursor="pointer" onClick={onEditBoard}>
          <Text fontSize="xl" fontWeight="bold" color="white" lineClamp={1}>
            {board.name}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700">
            Tap to edit
          </Text>
        </Box>
      </HStack>

      {/* Right side - Actions */}
      <HStack gap={2}>
        {/* Archived tasks button - Requirement 7.3 */}
        <AppTooltip label="View archived tasks" placement="bottom">
          <Box position="relative">
            <AppIconButton
              intent="ghost"
              aria-label="View archived tasks"
              onClick={onShowArchived}
              bg="whiteAlpha.200"
              color="white"
              _hover={{ bg: 'whiteAlpha.300' }}
            >
              <HiOutlineArchive />
            </AppIconButton>
            {archivedTasksCount > 0 && (
              <Badge
                position="absolute"
                top={-1}
                right={-1}
                colorPalette="orange"
                variant="solid"
                borderRadius="full"
                fontSize="xs"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {archivedTasksCount > 99 ? '99+' : archivedTasksCount}
              </Badge>
            )}
          </Box>
        </AppTooltip>

        {/* Start Sprint button - Requirement 7.3 */}
        <AppTooltip label="Start new sprint" placement="bottom">
          <AppButton
            intent="ghost"
            size="sm"
            onClick={onStartSprint}
            loading={isStartingSprint}
            bg="whiteAlpha.200"
            color="white"
            _hover={{ bg: 'whiteAlpha.300' }}
            leftIcon={<RefreshIcon />}
          >
            Sprint
          </AppButton>
        </AppTooltip>

        {/* Filter button with active indicator - Requirements 7.3, 7.5, 7.6 */}
        <AppTooltip
          label={hasActiveFilters ? `Filters active: ${filteredCount} of ${totalCount} tasks` : 'Open filters'}
          placement="bottom"
        >
          <Box position="relative">
            <AppIconButton
              intent="ghost"
              aria-label={hasActiveFilters ? `Filters active, ${filteredCount} of ${totalCount} tasks` : 'Open filters'}
              onClick={onOpenFilters}
              bg={hasActiveFilters ? 'whiteAlpha.400' : 'whiteAlpha.200'}
              color="white"
              _hover={{ bg: 'whiteAlpha.300' }}
            >
              <FilterIcon />
            </AppIconButton>
            {hasActiveFilters && (
              <Box
                position="absolute"
                top={1}
                right={1}
                w="8px"
                h="8px"
                borderRadius="full"
                bg="red.500"
              />
            )}
          </Box>
        </AppTooltip>

        <DarkModeToggle />
        <BoardThemeSelector boardId={boardId} />
        <ProfileAvatar
          displayName={user?.displayName || 'User'}
          onLogout={onLogout}
        />
      </HStack>
    </Flex>
  );
}


/**
 * BoardScreen - Displays a single board with sections and tasks.
 * Supports drag-and-drop for task reordering and section reordering.
 *
 * Migrated to Chakra UI with:
 * - Flex with horizontal scroll for section columns (Req 7.1)
 * - Card components for section headers with task count Badge (Req 7.2)
 * - IconButton for section actions with tooltips (Req 7.3, 7.6)
 * - InputGroup with search icon for search bar (Req 7.4)
 * - Badge for active filter count (Req 7.5)
 *
 * Requirements:
 * - 7.1: Flex with horizontal scroll for section columns
 * - 7.2: Card components for section headers with task count badge
 * - 7.3: IconButton for section actions
 * - 7.4: InputGroup with search icon for search bar
 * - 7.5: Badge for active filter count
 * - 7.6: Tooltips on section action buttons
 * - 2.6: Enable section reordering via drag
 * - 2.7: Display sections as columns in the board view
 * - 4.3: Handle task reordering within section
 * - 4.4: Handle task movement between sections
 * - 4.5: Provide visual feedback during drag
 * - 15.9: Show sync status indicator
 */
export function BoardScreen({
  boardId,
  onBack,
  onTaskPress,
  onEpicPress,
}: BoardScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors, getEffectiveTheme, getBoardTheme } = useTheme();
  const toast = useAppToast();

  // Get board-specific theme if set
  const boardTheme = boardId ? getEffectiveTheme(boardId) : null;
  const effectiveColors = boardTheme?.colors || colors;

  const board = useAppSelector((state) => boardId ? selectBoardById(state, boardId) : null);
  const user = useAppSelector(selectCurrentUser);
  const sections = useAppSelector((state) => boardId ? selectSectionsByBoardId(state, boardId) : []);
  const epics = useAppSelector((state) => boardId ? selectEpicsByBoardId(state, boardId) : []);
  const syncStatus = useAppSelector(selectSyncStatus);
  const hasActiveFilters = useAppSelector((state) => boardId ? selectHasActiveFilters(state, boardId) : false);
  const filteredCount = useAppSelector((state) => boardId ? selectFilteredTaskCount(state, boardId) : 0);
  const totalCount = useAppSelector((state) => boardId ? selectTotalTaskCount(state, boardId) : 0);
  const filters = useAppSelector((state) => boardId ? selectFiltersByBoardId(state, boardId) : { epicIds: [], priorities: [], dueDateFilter: null, searchQuery: '' });

  const isLoading = useAppSelector((state) => state.boards.isLoading || state.sections.isLoading || state.tasks.isLoading);

  // Build tasks by section ID map
  const tasksBySectionId = useAppSelector((state) => {
    if (!boardId) return {};
    const result: Record<string, Task[]> = {};
    sections.forEach((section) => {
      if (section?.id) {
        result[section.id] = selectFilteredTasksBySectionId(state, section.id, boardId);
      }
    });
    return result;
  });

  const [createTaskModal, setCreateTaskModal] = useState<{
    visible: boolean;
    sectionId: string | null;
    sectionName: string;
  }>({ visible: false, sectionId: null, sectionName: '' });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createSectionModalVisible, setCreateSectionModalVisible] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  
  // Edit board modal state
  const [editBoardModalVisible, setEditBoardModalVisible] = useState(false);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);
  
  // Filter panel state
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  
  // Task preview modal state
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [previewSectionName, setPreviewSectionName] = useState('');

  // Get all tasks as a flat array for dependent tasks lookup
  const allBoardTasks = useMemo(() => {
    return Object.values(tasksBySectionId).flat();
  }, [tasksBySectionId]);
  // Sprint management state
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [isStartingSprint, setIsStartingSprint] = useState(false);
  const [showSprintConfirm, setShowSprintConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const archivedTasks = useAppSelector((state) => boardId ? state.boards.archivedTasks[boardId] || [] : []);

  /**
   * Fetch board data on mount
   */
  useEffect(() => {
    if (!boardId) {
      return;
    }
    dispatch(setCurrentBoard(boardId));
    dispatch(fetchBoard(boardId));
    dispatch(fetchSections(boardId));
    dispatch(fetchTasks(boardId));
    dispatch(fetchEpics(boardId));

    return () => {
      dispatch(setCurrentBoard(null));
    };
  }, [dispatch, boardId]);

  /**
   * Handle task press - show preview modal first
   */
  const handleTaskPress = useCallback(
    (taskId: string) => {
      // Find the task and its section
      for (const [sectionId, tasks] of Object.entries(tasksBySectionId)) {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          const section = sections.find((s) => s.id === sectionId);
          setPreviewTask(task);
          setPreviewSectionName(section?.name || 'Unknown');
          return;
        }
      }
    },
    [tasksBySectionId, sections]
  );

  /**
   * Handle view full details from preview
   */
  const handleViewFullDetails = useCallback(() => {
    if (previewTask && onTaskPress) {
      onTaskPress(previewTask.id);
    }
    setPreviewTask(null);
  }, [previewTask, onTaskPress]);

  /**
   * Handle task reorder within a section (optimistic update)
   */
  const handleTaskReorder = useCallback(
    (sectionId: string, taskIds: string[]) => {
      dispatch(reorderTasksInSection({ sectionId, taskIds }));

      const tasks = tasksBySectionId[sectionId] || [];
      const oldTaskIds = tasks.map((t) => t.id);

      for (let i = 0; i < taskIds.length; i++) {
        if (taskIds[i] !== oldTaskIds[i]) {
          const movedTaskId = taskIds[i];
          const task = tasks.find((t) => t.id === movedTaskId);
          if (task) {
            dispatch(
              moveTask({
                taskId: movedTaskId,
                oldSectionId: sectionId,
                data: { sectionId, position: i },
              })
            );
          }
          break;
        }
      }
    },
    [dispatch, tasksBySectionId]
  );

  /**
   * Handle moving task to a different section via quick menu
   */
  const handleMoveTask = useCallback(
    (taskId: string, newSectionId: string) => {
      let oldSectionId: string | null = null;
      for (const [sectionId, tasks] of Object.entries(tasksBySectionId)) {
        if (tasks.some((t) => t.id === taskId)) {
          oldSectionId = sectionId;
          break;
        }
      }

      if (oldSectionId && oldSectionId !== newSectionId) {
        dispatch(
          moveTask({
            taskId,
            oldSectionId,
            data: { sectionId: newSectionId, position: 0 },
          })
        );
        toast.showInfo('Task moved', 'Task has been moved to the new section');
      }
    },
    [dispatch, tasksBySectionId, toast]
  );

  /**
   * Handle toggling epic on a task
   */
  const handleToggleEpic = useCallback(
    async (taskId: string, epicId: string) => {
      // Find the task to check if epic is already assigned
      let task: Task | undefined;
      for (const tasks of Object.values(tasksBySectionId)) {
        task = tasks.find((t) => t.id === taskId);
        if (task) break;
      }

      if (!task) return;

      try {
        if (task.epicIds.includes(epicId)) {
          await dispatch(removeEpicFromTask({ taskId, epicId })).unwrap();
        } else {
          await dispatch(assignEpicToTask({ taskId, epicId })).unwrap();
        }
      } catch {
        toast.showError('Error', 'Failed to update epic assignment');
      }
    },
    [dispatch, tasksBySectionId, toast]
  );

  /**
   * Handle section reorder (optimistic update)
   */
  const handleSectionReorder = useCallback(
    (sectionIds: string[]) => {
      dispatch(setSectionOrder({ boardId, sectionOrder: sectionIds }));
      dispatch(reorderSections({ boardId, sectionOrder: sectionIds }));
    },
    [dispatch, boardId]
  );

  /**
   * Handle add task button press
   */
  const handleAddTask = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      setCreateTaskModal({
        visible: true,
        sectionId,
        sectionName: section?.name || 'Section',
      });
    },
    [sections]
  );

  /**
   * Handle create task
   */
  const handleCreateTask = useCallback(
    async (data: CreateTaskData, sectionId: string) => {
      setIsCreatingTask(true);
      try {
        await dispatch(createTask({ 
          boardId, 
          data: { 
            title: data.title,
            sectionId,
            description: data.description,
            priority: data.priority ?? undefined,
            storyPoints: data.storyPoints,
            endDate: data.endDate,
          } 
        })).unwrap();
        setCreateTaskModal({ visible: false, sectionId: null, sectionName: '' });
        toast.showSuccess('Task created', 'Your new task has been added');
      } catch {
        toast.showError('Error', 'Failed to create task. Please try again.');
      } finally {
        setIsCreatingTask(false);
      }
    },
    [dispatch, boardId, toast]
  );

  /**
   * Handle add section
   */
  const handleAddSection = useCallback(() => {
    setCreateSectionModalVisible(true);
  }, []);

  /**
   * Handle create section
   */
  const handleCreateSection = useCallback(
    async (name: string) => {
      setIsCreatingSection(true);
      try {
        await dispatch(createSection({ boardId, name })).unwrap();
        setCreateSectionModalVisible(false);
        toast.showSuccess('Section created', 'Your new section has been added');
      } catch {
        toast.showError('Error', 'Failed to create section. Please try again.');
      } finally {
        setIsCreatingSection(false);
      }
    },
    [dispatch, boardId, toast]
  );

  /**
   * Handle update board
   */
  const handleUpdateBoard = useCallback(
    async (name: string, description: string, color: string) => {
      setIsUpdatingBoard(true);
      try {
        await dispatch(updateBoard({ id: boardId, data: { name, description: description || undefined, color } })).unwrap();
        setEditBoardModalVisible(false);
        toast.showSuccess('Board updated', 'Your board has been updated');
      } catch {
        toast.showError('Error', 'Failed to update board. Please try again.');
      } finally {
        setIsUpdatingBoard(false);
      }
    },
    [dispatch, boardId, toast]
  );


  /**
   * Filter handlers
   */
  const handleToggleEpicFilter = useCallback(
    (epicId: string) => {
      dispatch(toggleEpicFilter({ boardId, epicId }));
    },
    [dispatch, boardId]
  );

  const handleTogglePriorityFilter = useCallback(
    (priority: Priority) => {
      dispatch(togglePriorityFilter({ boardId, priority }));
    },
    [dispatch, boardId]
  );

  const handleSetDueDateFilter = useCallback(
    (dueDateFilter: DueDateFilter | null) => {
      dispatch(setDueDateFilter({ boardId, dueDateFilter }));
    },
    [dispatch, boardId]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters(boardId));
  }, [dispatch, boardId]);

  /**
   * Handle starting a new sprint
   */
  const handleStartSprint = useCallback(async () => {
    setShowSprintConfirm(true);
  }, []);

  /**
   * Confirm and execute sprint start
   */
  const confirmStartSprint = useCallback(async () => {
    setShowSprintConfirm(false);
    setIsStartingSprint(true);
    try {
      const result = await dispatch(startSprint(boardId)).unwrap();
      toast.showSuccess('Sprint Started', `${result.archivedCount} tasks have been archived.`);
      // Refresh tasks to reflect changes
      dispatch(fetchTasks(boardId));
    } catch (error) {
      console.error('Sprint start error:', error);
      toast.showError('Error', 'Failed to start sprint. Please try again.');
    } finally {
      setIsStartingSprint(false);
    }
  }, [dispatch, boardId, toast]);

  /**
   * Handle opening archived tasks modal
   */
  const handleShowArchived = useCallback(() => {
    dispatch(fetchArchivedTasks(boardId));
    setShowArchivedModal(true);
  }, [dispatch, boardId]);

  /**
   * Handle unarchiving a task
   */
  const handleUnarchiveTask = useCallback(async (taskId: string) => {
    try {
      await dispatch(unarchiveTask({ boardId, taskId })).unwrap();
      // Refresh tasks to show the restored task
      dispatch(fetchTasks(boardId));
      toast.showSuccess('Task restored', 'The task has been restored');
    } catch {
      toast.showError('Error', 'Failed to restore task. Please try again.');
    }
  }, [dispatch, boardId, toast]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  /**
   * Confirm and execute logout
   */
  const confirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    dispatch(logout());
  }, [dispatch]);

  /**
   * Handle toggling pin status on a task
   */
  const handleTogglePin = useCallback(
    async (taskId: string) => {
      try {
        await dispatch(toggleTaskPin(taskId)).unwrap();
      } catch {
        toast.showError('Error', 'Failed to update pin status');
      }
    },
    [dispatch, toast]
  );

  /**
   * Handle cloning a task
   */
  const handleCloneTask = useCallback(
    async (taskId: string) => {
      try {
        await dispatch(cloneTask(taskId)).unwrap();
        toast.showSuccess('Task cloned', 'A copy of the task has been created');
      } catch {
        toast.showError('Error', 'Failed to clone task');
      }
    },
    [dispatch, toast]
  );

  // Loading state
  if (!boardId || !board) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: effectiveColors.background }}>
        <Flex flex={1} align="center" justify="center" direction="column" gap={4}>
          <Spinner size="lg" color="brand.500" />
          <Text color="fg.muted">Loading board...</Text>
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <ThemedBackground boardId={boardId}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - Requirements 7.3, 7.5, 7.6 */}
        <BoardHeader
          board={board}
          user={user}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredCount}
          totalCount={totalCount}
          archivedTasksCount={archivedTasks.length}
          isStartingSprint={isStartingSprint}
          onBack={onBack}
          onEditBoard={() => setEditBoardModalVisible(true)}
          onShowArchived={handleShowArchived}
          onStartSprint={handleStartSprint}
          onOpenFilters={() => setFilterPanelVisible(true)}
          onLogout={handleLogout}
          boardId={boardId}
        />

        {/* Filter count indicator - Requirement 7.5 */}
        {hasActiveFilters && (
          <FilterCountBadge
            filteredCount={filteredCount}
            totalCount={totalCount}
            onClear={handleClearFilters}
          />
        )}

        {/* Board content - Requirement 7.1: Flex with horizontal scroll */}
        {isLoading && sections.length === 0 ? (
          <Flex flex={1} align="center" justify="center" direction="column" gap={4}>
            <Spinner size="lg" color="brand.500" />
            <Text color="fg.muted">Loading sections...</Text>
          </Flex>
        ) : (
          <Box flex={1}>
            {/* DraggableSectionList provides horizontal scroll for sections - Requirement 7.1 */}
            <DraggableSectionList
              sections={sections}
              tasksBySectionId={tasksBySectionId}
              epics={epics}
              onTaskPress={handleTaskPress}
              onTaskReorder={handleTaskReorder}
              onMoveTask={handleMoveTask}
              onToggleEpic={handleToggleEpic}
              onTogglePin={handleTogglePin}
              onEpicPress={onEpicPress}
              onClone={handleCloneTask}
              onSectionReorder={handleSectionReorder}
              onAddTask={handleAddTask}
              onAddSection={handleAddSection}
            />
          </Box>
        )}

        {/* Task Preview Modal */}
        <TaskPreviewModal
          visible={previewTask !== null}
          task={previewTask}
          epics={epics}
          allTasks={allBoardTasks}
          sectionName={previewSectionName}
          onClose={() => setPreviewTask(null)}
          onViewDetails={handleViewFullDetails}
          onEpicPress={onEpicPress}
          onTaskPress={onTaskPress}
        />

        {/* Filter Panel */}
        <FilterPanel
          visible={filterPanelVisible}
          onClose={() => setFilterPanelVisible(false)}
          epics={epics}
          selectedEpicIds={filters.epicIds}
          onToggleEpic={handleToggleEpicFilter}
          selectedPriorities={filters.priorities}
          onTogglePriority={handleTogglePriorityFilter}
          selectedDueDateFilter={filters.dueDateFilter}
          onSetDueDateFilter={handleSetDueDateFilter}
          onClearAll={handleClearFilters}
        />

        {/* Create Task Modal */}
        <CreateTaskModal
          visible={createTaskModal.visible}
          sectionId={createTaskModal.sectionId}
          sectionName={createTaskModal.sectionName}
          onClose={() => setCreateTaskModal({ visible: false, sectionId: null, sectionName: '' })}
          onSubmit={handleCreateTask}
          isLoading={isCreatingTask}
        />

        {/* Create Section Modal */}
        <CreateSectionModal
          visible={createSectionModalVisible}
          onClose={() => setCreateSectionModalVisible(false)}
          onSubmit={handleCreateSection}
          isLoading={isCreatingSection}
        />

        {/* Edit Board Modal */}
        <EditBoardModal
          visible={editBoardModalVisible}
          boardName={board.name}
          boardDescription={board.description || ''}
          boardColor={board.color || '#6366f1'}
          onClose={() => setEditBoardModalVisible(false)}
          onSubmit={handleUpdateBoard}
          isLoading={isUpdatingBoard}
        />

        {/* Archived Tasks Modal */}
        <ArchivedTasksModal
          visible={showArchivedModal}
          tasks={archivedTasks}
          onClose={() => setShowArchivedModal(false)}
          onUnarchive={handleUnarchiveTask}
        />

        {/* Sprint Confirmation Dialog */}
        <ConfirmDialog
          open={showSprintConfirm}
          onClose={() => setShowSprintConfirm(false)}
          onConfirm={confirmStartSprint}
          title="Start New Sprint"
          message="This will archive all tasks in 'Done' sections. Are you sure you want to start a new sprint?"
          confirmText="Start Sprint"
          variant="warning"
          isLoading={isStartingSprint}
        />

        {/* Logout Confirmation Dialog */}
        <ConfirmDialog
          open={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
          title="Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
          variant="danger"
        />
      </SafeAreaView>
    </ThemedBackground>
  );
}

export default BoardScreen;
