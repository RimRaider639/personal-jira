import React, { useCallback, useMemo, memo } from 'react';
import {
  Box,
  Card,
  Text,
  HStack,
  Badge,
  Tag,
  Menu,
  Portal,
  Image,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiMessageCircle,
  FiPaperclip,
  FiFlag,
  FiMoreVertical,
  FiArrowRight,
  FiTag,
  FiFile,
} from 'react-icons/fi';
import { HiOutlineBookmark } from 'react-icons/hi';
import type { Task, Epic, Section } from '@kanban/shared';
import { AppTooltip } from './chakra';

interface TaskCardProps {
  task: Task;
  epics: Epic[];
  sections: Section[];
  onPress: (taskId: string) => void;
  onMove?: (taskId: string, newSectionId: string) => void;
  onToggleEpic?: (taskId: string, epicId: string) => void;
  onTogglePin?: (taskId: string) => void;
  onEpicPress?: (epicId: string) => void;
  isDragging?: boolean;
}

/**
 * TaskCard - Individual task card component with Chakra UI
 * Memoized for performance optimization.
 *
 * Requirements:
 * - 8.1: Use Chakra UI Card component with configurable border-left color based on priority
 * - 8.2: Use Chakra UI Text component with proper typography for task title
 * - 8.3: Use Chakra UI Tag components for epic badges with epic colors
 * - 8.4: Use Chakra UI HStack for metadata row containing due date, comments count, and attachments count with icons
 * - 8.5: Display overdue dates in red color scheme
 * - 8.6: Use Chakra UI Badge for story points display
 * - 8.7: Display a subtle shadow increase on hover
 * - 8.8: Use Chakra UI Menu triggered by IconButton for quick actions (move, pin, assign epic)
 * - 2.3: Show icons for due date (calendar), comments (chat), attachments (paperclip), priority (flag)
 */
function TaskCardComponent({
  task,
  epics,
  sections,
  onPress,
  onMove,
  onToggleEpic,
  onTogglePin,
  onEpicPress,
  isDragging = false,
}: TaskCardProps): React.JSX.Element {
  const handlePress = useCallback(() => {
    onPress(task.id);
  }, [task.id, onPress]);

  const handleMove = useCallback(
    (sectionId: string) => {
      if (sectionId !== task.sectionId) {
        onMove?.(task.id, sectionId);
      }
    },
    [task.id, task.sectionId, onMove]
  );

  const handleToggleEpic = useCallback(
    (epicId: string) => {
      onToggleEpic?.(task.id, epicId);
    },
    [task.id, onToggleEpic]
  );

  const handleTogglePin = useCallback(() => {
    onTogglePin?.(task.id);
  }, [task.id, onTogglePin]);

  const handleEpicPress = useCallback(
    (epicId: string) => {
      onEpicPress?.(epicId);
    },
    [onEpicPress]
  );

  const taskEpics = useMemo(
    () => epics.filter((epic) => task.epicIds.includes(epic.id)),
    [epics, task.epicIds]
  );

  // Priority color mapping for border-left (Requirement 8.1)
  const priorityColor = useMemo(() => {
    switch (task.priority) {
      case 'critical':
        return 'red.500';
      case 'high':
        return 'orange.500';
      case 'medium':
        return 'yellow.500';
      case 'low':
        return 'green.500';
      default:
        return 'transparent';
    }
  }, [task.priority]);

  // Priority label for tooltip (Requirement 12.3)
  const priorityLabel = useMemo(() => {
    switch (task.priority) {
      case 'critical':
        return 'Critical Priority';
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return null;
    }
  }, [task.priority]);

  // Check if task is overdue (Requirement 8.5)
  const isOverdue = useMemo(() => {
    if (!task.endDate) return false;
    return new Date(task.endDate) < new Date();
  }, [task.endDate]);

  const formattedDate = useMemo(() => {
    if (!task.endDate) return null;
    return new Date(task.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [task.endDate]);

  const otherSections = useMemo(
    () => sections.filter((s) => s.id !== task.sectionId),
    [sections, task.sectionId]
  );

  const hasMenuActions = onMove || onToggleEpic || onTogglePin;

  return (
    <Card.Root
      variant="elevated"
      borderRadius="lg"
      overflow="hidden"
      mb={2}
      borderLeftWidth={task.priority ? '4px' : '0'}
      borderLeftColor={priorityColor}
      borderLeftStyle="solid"
      cursor="pointer"
      transition="all 0.2s ease-in-out"
      // Hover shadow effect (Requirement 8.7)
      _hover={{
        shadow: 'lg',
        transform: isDragging ? 'scale(1.02)' : 'translateY(-2px)',
      }}
      // Dragging state
      shadow={isDragging ? 'xl' : 'sm'}
      transform={isDragging ? 'scale(1.02)' : 'none'}
      onClick={handlePress}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePress();
        }
      }}
      aria-label={`Task: ${task.title}`}
    >
      <Card.Body p={3}>
        {/* Header with title and menu */}
        <Flex justify="space-between" align="flex-start" mb={2}>
          {/* Task title (Requirement 8.2) */}
          <Text
            fontSize="sm"
            fontWeight="medium"
            lineHeight="tall"
            lineClamp={2}
            flex={1}
            mr={2}
          >
            {task.title}
          </Text>

          {/* Quick actions menu (Requirement 8.8) */}
          {hasMenuActions && sections.length > 0 && (
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  aria-label="Task menu"
                  variant="ghost"
                  size="xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiMoreVertical />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content minW="200px">
                    {/* Pin/Unpin action */}
                    {onTogglePin && (
                      <Menu.Item
                        value="pin"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin();
                        }}
                      >
                        <HiOutlineBookmark />
                        <Box ml={2}>
                          {task.isPinned ? 'Unpin from Board' : 'Pin to Board'}
                        </Box>
                      </Menu.Item>
                    )}

                    {/* Move to section submenu */}
                    {onMove && otherSections.length > 0 && (
                      <Menu.Root>
                        <Menu.TriggerItem>
                          <FiArrowRight />
                          <Box ml={2}>Move to Section</Box>
                        </Menu.TriggerItem>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content>
                              {otherSections.map((section) => (
                                <Menu.Item
                                  key={section.id}
                                  value={section.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMove(section.id);
                                  }}
                                >
                                  {section.name}
                                </Menu.Item>
                              ))}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    )}

                    {/* Assign epic submenu */}
                    {onToggleEpic && epics.length > 0 && (
                      <Menu.Root>
                        <Menu.TriggerItem>
                          <FiTag />
                          <Box ml={2}>Assign Epic</Box>
                        </Menu.TriggerItem>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content>
                              {epics.map((epic) => {
                                const isAssigned = task.epicIds.includes(epic.id);
                                return (
                                  <Menu.Item
                                    key={epic.id}
                                    value={epic.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleEpic(epic.id);
                                    }}
                                  >
                                    <Box
                                      w={3}
                                      h={3}
                                      borderRadius="full"
                                      bg={epic.color}
                                      mr={2}
                                    />
                                    <Box flex={1}>{epic.name}</Box>
                                    {isAssigned && (
                                      <Text color="green.500" fontWeight="bold">
                                        ✓
                                      </Text>
                                    )}
                                  </Menu.Item>
                                );
                              })}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    )}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          )}
        </Flex>

        {/* Epic badges (Requirement 8.3) */}
        {taskEpics.length > 0 && (
          <HStack gap={1} flexWrap="wrap" mb={2}>
            {taskEpics.slice(0, 2).map((epic) => (
              <AppTooltip key={epic.id} label={epic.name} placement="top">
                <Tag.Root
                  size="sm"
                  variant="subtle"
                  bg={`${epic.color}20`}
                  color={epic.color}
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEpicPress(epic.id);
                  }}
                >
                  <Tag.Label
                    fontSize="xs"
                    fontWeight="semibold"
                    maxW="100px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {epic.name}
                  </Tag.Label>
                </Tag.Root>
              </AppTooltip>
            ))}
            {taskEpics.length > 2 && (
              <Text fontSize="xs" color="gray.500">
                +{taskEpics.length - 2}
              </Text>
            )}
          </HStack>
        )}

        {/* Attachment previews */}
        {task.attachments.length > 0 && (
          <HStack gap={1} mb={2}>
            {task.attachments.slice(0, 3).map((attachment) => {
              const isImage = attachment.mimeType.startsWith('image/');
              const previewUrl =
                attachment.thumbnailUrl || (isImage ? attachment.cloudinaryUrl : null);
              return previewUrl ? (
                <Image
                  key={attachment.id}
                  src={previewUrl}
                  alt={attachment.filename}
                  boxSize="40px"
                  borderRadius="md"
                  objectFit="cover"
                />
              ) : (
                <Flex
                  key={attachment.id}
                  boxSize="40px"
                  borderRadius="md"
                  bg="gray.100"
                  align="center"
                  justify="center"
                >
                  <Box as={FiFile} color="gray.500" boxSize={5} />
                </Flex>
              );
            })}
            {task.attachments.length > 3 && (
              <Flex
                boxSize="40px"
                borderRadius="md"
                bg="gray.100"
                align="center"
                justify="center"
              >
                <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                  +{task.attachments.length - 3}
                </Text>
              </Flex>
            )}
          </HStack>
        )}

        {/* Metadata row with icons (Requirement 8.4, 2.3) */}
        <HStack gap={3} flexWrap="wrap" mt="auto">
          {/* Priority indicator with icon (Requirement 2.3) */}
          {task.priority && priorityLabel && (
            <AppTooltip label={priorityLabel} placement="top">
              <HStack gap={1}>
                <Box as={FiFlag} color={priorityColor} boxSize={3} />
              </HStack>
            </AppTooltip>
          )}

          {/* Due date with calendar icon (Requirement 8.4, 8.5, 2.3) */}
          {formattedDate && (
            <HStack gap={1}>
              <Box
                as={FiCalendar}
                color={isOverdue ? 'red.500' : 'gray.500'}
                boxSize={3}
              />
              <Text
                fontSize="xs"
                color={isOverdue ? 'red.500' : 'gray.500'}
                fontWeight={isOverdue ? 'semibold' : 'normal'}
              >
                {formattedDate}
              </Text>
            </HStack>
          )}

          {/* Story points badge (Requirement 8.6) */}
          {task.storyPoints !== null && task.storyPoints !== undefined && (
            <Badge
              colorPalette="blue"
              variant="subtle"
              borderRadius="full"
              px={2}
              fontSize="xs"
            >
              {task.storyPoints}
            </Badge>
          )}

          {/* Comments count with chat icon (Requirement 8.4, 2.3) */}
          {task.comments.length > 0 && (
            <HStack gap={1}>
              <Box as={FiMessageCircle} color="gray.500" boxSize={3} />
              <Text fontSize="xs" color="gray.500">
                {task.comments.length}
              </Text>
            </HStack>
          )}

          {/* Attachments count with paperclip icon (Requirement 8.4, 2.3) */}
          {task.attachments.length > 0 && (
            <HStack gap={1}>
              <Box as={FiPaperclip} color="gray.500" boxSize={3} />
              <Text fontSize="xs" color="gray.500">
                {task.attachments.length}
              </Text>
            </HStack>
          )}
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: TaskCardProps, nextProps: TaskCardProps): boolean {
  if (prevProps.isDragging !== nextProps.isDragging) return false;
  if (prevProps.task.id !== nextProps.task.id) return false;
  if (prevProps.task.title !== nextProps.task.title) return false;
  if (prevProps.task.priority !== nextProps.task.priority) return false;
  if (prevProps.task.endDate !== nextProps.task.endDate) return false;
  if (prevProps.task.storyPoints !== nextProps.task.storyPoints) return false;
  if (prevProps.task.sectionId !== nextProps.task.sectionId) return false;
  if (prevProps.task.isPinned !== nextProps.task.isPinned) return false;
  if (prevProps.task.comments.length !== nextProps.task.comments.length) return false;
  if (prevProps.task.attachments.length !== nextProps.task.attachments.length)
    return false;
  if (prevProps.task.epicIds.length !== nextProps.task.epicIds.length) return false;

  for (let i = 0; i < prevProps.task.epicIds.length; i++) {
    if (prevProps.task.epicIds[i] !== nextProps.task.epicIds[i]) return false;
  }

  if (prevProps.sections.length !== nextProps.sections.length) return false;
  if (prevProps.epics !== nextProps.epics) {
    const prevRelevantEpics = prevProps.epics.filter((e) =>
      prevProps.task.epicIds.includes(e.id)
    );
    const nextRelevantEpics = nextProps.epics.filter((e) =>
      nextProps.task.epicIds.includes(e.id)
    );
    if (prevRelevantEpics.length !== nextRelevantEpics.length) return false;
  }

  if (prevProps.onPress !== nextProps.onPress) return false;
  if (prevProps.onMove !== nextProps.onMove) return false;
  if (prevProps.onToggleEpic !== nextProps.onToggleEpic) return false;
  if (prevProps.onTogglePin !== nextProps.onTogglePin) return false;
  if (prevProps.onEpicPress !== nextProps.onEpicPress) return false;

  return true;
}

export const TaskCard = memo(TaskCardComponent, arePropsEqual);

export default TaskCard;
