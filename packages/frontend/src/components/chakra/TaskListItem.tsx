/**
 * TaskListItem - Reusable component for displaying tasks in lists
 * 
 * Used in:
 * - TaskDetailScreen (dependent tasks)
 * - EpicDetailScreen (linked tasks)
 * - TaskPreviewModal
 * - Any other place where tasks need to be displayed in a list format
 * 
 * Features:
 * - Consistent styling across the app
 * - Color-coded status badges (using centralized semantic colors)
 * - Simple dropdown for status changes
 * - Priority indicator
 * - Deadline display with urgency colors
 */

import React, { useCallback, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Icon,
} from '@chakra-ui/react';
import { Menu, Portal } from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorMode';
import type { Task, Section } from '@kanban/shared';
import { CheckIcon, ChevronDownIcon } from '@/theme/icons';

// Import from centralized semantic colors
import {
  getStatusColor as getStatusColorFromTheme,
  getPriorityColor as getPriorityColorFromTheme,
  getDeadlineInfo as getDeadlineInfoFromTheme,
  statusColors,
  priorityColors,
  deadlineColors,
} from '@/theme/semanticColors';

/**
 * Get Chakra color token for a section/status based on its name
 * Maps semantic colors to Chakra color tokens for component styling
 */
export function getStatusColor(sectionName: string | undefined): string {
  if (!sectionName) return 'gray.500';
  const name = sectionName.toLowerCase();
  
  // Done/Complete - Green
  if (name.includes('done') || name.includes('complete') || name.includes('finished') || name.includes('closed')) {
    return 'green.500';
  }
  // In Progress/Doing - Orange
  if (name.includes('progress') || name.includes('doing') || name.includes('working') || name.includes('active')) {
    return 'orange.500';
  }
  // Review/Testing - Purple
  if (name.includes('review') || name.includes('test') || name.includes('qa') || name.includes('verify')) {
    return 'purple.500';
  }
  // Blocked/On Hold - Red
  if (name.includes('block') || name.includes('hold') || name.includes('stuck') || name.includes('wait')) {
    return 'red.500';
  }
  // To Do/Backlog - Blue
  if (name.includes('todo') || name.includes('to do') || name.includes('backlog') || name.includes('new') || name.includes('open')) {
    return 'blue.500';
  }
  
  return 'gray.500';
}

/**
 * Get Chakra color token for priority
 */
export function getPriorityColor(priority: string | null | undefined): string {
  switch (priority) {
    case 'critical': return 'red.500';
    case 'high': return 'orange.500';
    case 'medium': return 'yellow.500';
    case 'low': return 'green.500';
    default: return 'gray.400';
  }
}

/**
 * Calculate deadline info with Chakra color tokens
 */
export function getDeadlineInfo(endDate: string | null | undefined): {
  text: string;
  color: string;
  isOverdue: boolean;
  isUrgent: boolean;
} | null {
  if (!endDate) return null;
  
  const deadline = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 2;
  
  let text: string;
  let color: string;
  
  if (isOverdue) {
    text = `${Math.abs(diffDays)}d overdue`;
    color = 'red.500';
  } else if (diffDays === 0) {
    text = 'Today';
    color = 'orange.500';
  } else if (diffDays === 1) {
    text = '1d left';
    color = 'orange.500';
  } else if (diffDays <= 7) {
    text = `${diffDays}d left`;
    color = 'yellow.600';
  } else {
    text = `${diffDays}d left`;
    color = 'green.500';
  }
  
  return { text, color, isOverdue, isUrgent };
}

// Re-export semantic color utilities for components that need raw hex values
export { statusColors, priorityColors, deadlineColors };
export { getStatusColorFromTheme, getPriorityColorFromTheme, getDeadlineInfoFromTheme };

interface TaskListItemProps {
  /** The task to display */
  task: Task;
  /** Current section the task is in */
  section: Section | undefined;
  /** Available sections for status change (if provided, enables status dropdown) */
  availableSections?: Section[];
  /** Callback when task is clicked */
  onPress?: (taskId: string, boardId: string) => void;
  /** Callback when status is changed */
  onStatusChange?: (taskId: string, newSectionId: string, oldSectionId: string) => Promise<void>;
  /** Callback when remove button is clicked (for dependent tasks) */
  onRemove?: (taskId: string) => void;
  /** Whether status change is in progress */
  isChangingStatus?: boolean;
  /** Show board name (useful when displaying tasks from multiple boards) */
  showBoardName?: boolean;
  /** Board name to display */
  boardName?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * TaskListItem - Reusable task display component with status dropdown
 */
export function TaskListItem({
  task,
  section,
  availableSections,
  onPress,
  onStatusChange,
  onRemove,
  isChangingStatus = false,
  showBoardName = false,
  boardName,
  compact = false,
}: TaskListItemProps): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  const statusColor = getStatusColor(section?.name);
  const priorityColor = getPriorityColor(task.priority);
  const deadlineInfo = getDeadlineInfo(task.endDate);
  
  const handlePress = useCallback(() => {
    onPress?.(task.id, task.boardId);
  }, [onPress, task.id, task.boardId]);
  
  const handleStatusChange = useCallback(async (newSectionId: string) => {
    if (newSectionId !== task.sectionId && onStatusChange) {
      await onStatusChange(task.id, newSectionId, task.sectionId);
    }
    setIsMenuOpen(false);
  }, [onStatusChange, task.id, task.sectionId]);
  
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(task.id);
  }, [onRemove, task.id]);

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="md"
      p={compact ? 2 : 3}
      cursor={onPress ? 'pointer' : 'default'}
      onClick={handlePress}
      _hover={onPress ? { bg: hoverBg } : undefined}
      transition="background 0.2s"
    >
      <Flex justify="space-between" align="flex-start" gap={2}>
        {/* Task Info */}
        <VStack align="stretch" gap={1} flex={1} minW={0}>
          {/* Title */}
          <Text
            fontWeight="medium"
            fontSize={compact ? 'sm' : 'md'}
            color={textColor}
            lineClamp={1}
          >
            {task.title}
          </Text>
          
          {/* Meta row: Status, Board, Deadline */}
          <HStack gap={2} wrap="wrap">
            {/* Status Badge with Dropdown */}
            {availableSections && availableSections.length > 0 ? (
              <Menu.Root
                open={isMenuOpen}
                onOpenChange={(details) => setIsMenuOpen(details.open)}
              >
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
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    _hover={{ opacity: 0.8 }}
                    opacity={isChangingStatus ? 0.6 : 1}
                  >
                    <Text fontSize="xs" fontWeight="medium" color={statusColor}>
                      {section?.name || 'Unknown'}
                    </Text>
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
                      {availableSections.map((s) => {
                        const sectionStatusColor = getStatusColor(s.name);
                        const isSelected = s.id === task.sectionId;
                        return (
                          <Menu.Item
                            key={s.id}
                            value={s.id}
                            onClick={() => handleStatusChange(s.id)}
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
                                <Text
                                  fontSize="sm"
                                  fontWeight={isSelected ? 'semibold' : 'normal'}
                                  color={isSelected ? sectionStatusColor : textColor}
                                >
                                  {s.name}
                                </Text>
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
            ) : (
              /* Static Status Badge (no dropdown) */
              <Box
                px={2}
                py={0.5}
                borderRadius="md"
                bg={`${statusColor}20`}
                borderWidth="1px"
                borderColor={statusColor}
              >
                <Text fontSize="xs" fontWeight="medium" color={statusColor}>
                  {section?.name || 'Unknown'}
                </Text>
              </Box>
            )}
            
            {/* Board Name */}
            {showBoardName && boardName && (
              <Text fontSize="xs" color={mutedColor}>
                {boardName}
              </Text>
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
                <Text
                  fontSize="xs"
                  fontWeight="medium"
                  color={deadlineInfo.color}
                >
                  {deadlineInfo.text}
                </Text>
              </Box>
            )}
          </HStack>
        </VStack>
        
        {/* Right side: Priority + Remove button */}
        <HStack gap={2}>
          {/* Priority Indicator */}
          {task.priority && (
            <Box
              px={2}
              py={0.5}
              borderRadius="md"
              bg={`${priorityColor}20`}
            >
              <Text fontSize="xs" fontWeight="medium" color={priorityColor} textTransform="capitalize">
                {task.priority}
              </Text>
            </Box>
          )}
          
          {/* Remove Button */}
          {onRemove && (
            <Box
              as="button"
              w="24px"
              h="24px"
              borderRadius="full"
              bg="red.100"
              _dark={{ bg: 'red.900' }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={handleRemove}
              _hover={{ bg: 'red.200', _dark: { bg: 'red.800' } }}
            >
              <Text fontSize="sm" color="red.500" fontWeight="bold">×</Text>
            </Box>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}

export default TaskListItem;
