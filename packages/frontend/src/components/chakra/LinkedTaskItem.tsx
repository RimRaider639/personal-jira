/**
 * LinkedTaskItem - Reusable component for displaying linked/dependent tasks
 * 
 * Used in both EpicDetailScreen and TaskDetailScreen for consistent task display
 * with inline status change dropdown.
 */

import React from 'react';
import {
  Box,
  HStack,
  Text as ChakraText,
  Icon,
} from '@chakra-ui/react';
import { Menu, Portal } from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorMode';
import { getStatusColor, getPriorityColor, getDeadlineInfo } from './index';
import { CheckIcon, ChevronDownIcon } from '@/theme/icons';
import type { Task, Section } from '@kanban/shared';

interface LinkedTaskItemProps {
  task: Task;
  section: Section | undefined;
  sections: Section[];
  onTaskPress?: (taskId: string, boardId: string) => void;
  onStatusChange?: (taskId: string, newSectionId: string, oldSectionId: string) => void;
  onRemove?: (taskId: string) => void;
  isChangingStatus?: boolean;
  showRemoveButton?: boolean;
}

/**
 * LinkedTaskItem - Displays a task with title, priority, deadline, and status dropdown
 * 
 * Layout: Title | Priority | Deadline | Status | (Remove button)
 */
export function LinkedTaskItem({
  task,
  section,
  sections,
  onTaskPress,
  onStatusChange,
  onRemove,
  isChangingStatus = false,
  showRemoveButton = false,
}: LinkedTaskItemProps): React.JSX.Element {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  const statusColor = getStatusColor(section?.name);
  const priorityColor = getPriorityColor(task.priority);
  const deadlineInfo = getDeadlineInfo(task.endDate);

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="md"
      p={3}
      w="full"
    >
      {/* Single row layout: Title | Priority | Deadline | Status | Remove */}
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
          onClick={() => onTaskPress?.(task.id, task.boardId)}
        >
          {task.title}
        </ChakraText>
        
        {/* Right side: Priority, Deadline, Status, Remove */}
        <HStack gap={2} flexShrink={0}>
          {/* Priority Badge */}
          {task.priority && (
            <Box
              px={2}
              py={0.5}
              borderRadius="md"
              bg={`${priorityColor}20`}
              minW="70px"
              textAlign="center"
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
              minW="80px"
              textAlign="center"
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
                justifyContent="center"
                gap={1}
                cursor={isChangingStatus ? 'not-allowed' : 'pointer'}
                _hover={{ opacity: 0.8 }}
                opacity={isChangingStatus ? 0.6 : 1}
                minW="100px"
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
                  {sections.map((s) => {
                    const sectionStatusColor = getStatusColor(s.name);
                    const isSelected = s.id === task.sectionId;
                    return (
                      <Menu.Item
                        key={s.id}
                        value={s.id}
                        onClick={() => onStatusChange?.(task.id, s.id, task.sectionId)}
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

          {/* Remove Button */}
          {showRemoveButton && onRemove && (
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
              onClick={() => onRemove(task.id)}
              _hover={{ bg: 'red.200', _dark: { bg: 'red.800' } }}
            >
              <ChakraText fontSize="sm" color="red.500" fontWeight="bold">×</ChakraText>
            </Box>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}

export default LinkedTaskItem;
