/**
 * FilterPanel - Side panel with epic, priority, and due date filters
 *
 * Migrated to Chakra UI with:
 * - Drawer component for responsive filter panel (Req 7.7, 17.7)
 * - VStack/HStack for layout
 * - Box for filter options with hover effects
 *
 * Requirements:
 * - 7.7: Use Chakra UI Drawer component for filter panel on mobile
 * - 17.7: Display as Drawer from the right side
 * - 9.2, 9.4, 9.5: Epic filter with multi-select
 * - 10.2: Priority filter with priority level options
 * - 11.2: Due date filter with preset options
 */

import React, { useCallback, memo, useMemo } from 'react';
import {
  Box,
  Drawer,
  Portal,
  Text,
  VStack,
  HStack,
  Flex,
} from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import type { Epic, Priority, DueDateFilter } from '@kanban/shared';
import { AppButton, AppIconButton } from './chakra';
import { CloseIcon } from '@/theme/icons';
import { useColorModeValue } from '@/hooks/useColorMode';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  // Epic filter
  epics: Epic[];
  selectedEpicIds: string[];
  onToggleEpic: (epicId: string) => void;
  // Priority filter
  selectedPriorities: Priority[];
  onTogglePriority: (priority: Priority) => void;
  // Due date filter
  selectedDueDateFilter: DueDateFilter | null;
  onSetDueDateFilter: (filter: DueDateFilter | null) => void;
  // Clear all
  onClearAll: () => void;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#22c55e' },
];

const DUE_DATE_OPTIONS: { value: DueDateFilter | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: '7days', label: 'Next 7 Days' },
  { value: 'overdue', label: 'Overdue' },
];

/**
 * FilterOption - Reusable filter option component
 */
interface FilterOptionProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accessibilityRole?: 'checkbox' | 'radio';
}

function FilterOption({
  isSelected,
  onClick,
  children,
  accessibilityRole = 'checkbox',
}: FilterOptionProps): React.JSX.Element {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const selectedBorder = useColorModeValue('brand.500', 'brand.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box
      as="button"
      w="full"
      p={3}
      borderRadius="md"
      borderWidth="1px"
      borderColor={isSelected ? selectedBorder : borderColor}
      bg={isSelected ? selectedBg : bgColor}
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: isSelected ? selectedBg : hoverBg }}
      transition="all 0.2s"
      role={accessibilityRole}
      aria-checked={isSelected}
    >
      <Flex align="center" justify="space-between">
        {children}
        {isSelected && (
          <Box as={FiCheck} color="brand.500" boxSize={4} />
        )}
      </Flex>
    </Box>
  );
}

/**
 * FilterPanel - Side panel with epic, priority, and due date filters
 * Memoized for performance optimization.
 *
 * Requirements:
 * - 7.7: Use Chakra UI Drawer component for filter panel on mobile
 * - 17.7: Display as Drawer from the right side
 */
function FilterPanelComponent({
  visible,
  onClose,
  epics,
  selectedEpicIds,
  onToggleEpic,
  selectedPriorities,
  onTogglePriority,
  selectedDueDateFilter,
  onSetDueDateFilter,
  onClearAll,
}: FilterPanelProps): React.JSX.Element {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const hasActiveFilters = useMemo(
    () =>
      selectedEpicIds.length > 0 ||
      selectedPriorities.length > 0 ||
      selectedDueDateFilter !== null,
    [selectedEpicIds.length, selectedPriorities.length, selectedDueDateFilter]
  );

  const handleClearAll = useCallback(() => {
    onClearAll();
  }, [onClearAll]);

  return (
    <Drawer.Root
      open={visible}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      placement="end"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg={bgColor} maxW="320px" w="85vw">
            {/* Header */}
            <Drawer.Header
              borderBottomWidth="1px"
              borderBottomColor={borderColor}
            >
              <Flex align="center" justify="space-between" w="full">
                <Drawer.Title fontSize="lg" fontWeight="bold">
                  Filters
                </Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <AppIconButton
                    intent="ghost"
                    aria-label="Close filters"
                    size="sm"
                  >
                    <CloseIcon />
                  </AppIconButton>
                </Drawer.CloseTrigger>
              </Flex>
            </Drawer.Header>

            {/* Content */}
            <Drawer.Body py={4} overflowY="auto">
              <VStack gap={6} align="stretch">
                {/* Epic Filter */}
                <Box>
                  <Flex align="center" justify="space-between" mb={1}>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                    >
                      Epics
                    </Text>
                    {selectedEpicIds.length > 0 && (
                      <Text fontSize="xs" color="brand.500" fontWeight="medium">
                        {selectedEpicIds.length} selected
                      </Text>
                    )}
                  </Flex>
                  <Text fontSize="xs" color="fg.muted" mb={3}>
                    Tasks must have ALL selected epics
                  </Text>
                  <VStack gap={2} align="stretch">
                    {epics.length > 0 ? (
                      epics.map((epic) => (
                        <FilterOption
                          key={epic.id}
                          isSelected={selectedEpicIds.includes(epic.id)}
                          onClick={() => onToggleEpic(epic.id)}
                        >
                          <HStack gap={2}>
                            <Box
                              w="10px"
                              h="10px"
                              borderRadius="full"
                              bg={epic.color}
                            />
                            <Text fontSize="sm">{epic.name}</Text>
                          </HStack>
                        </FilterOption>
                      ))
                    ) : (
                      <Text
                        fontSize="sm"
                        color="fg.muted"
                        fontStyle="italic"
                        textAlign="center"
                        py={4}
                      >
                        No epics available
                      </Text>
                    )}
                  </VStack>
                </Box>

                {/* Priority Filter */}
                <Box>
                  <Flex align="center" justify="space-between" mb={1}>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="fg.muted"
                      textTransform="uppercase"
                    >
                      Priority
                    </Text>
                    {selectedPriorities.length > 0 && (
                      <Text fontSize="xs" color="brand.500" fontWeight="medium">
                        {selectedPriorities.length} selected
                      </Text>
                    )}
                  </Flex>
                  <Text fontSize="xs" color="fg.muted" mb={3}>
                    Tasks with ANY selected priority
                  </Text>
                  <VStack gap={2} align="stretch">
                    {PRIORITIES.map((priority) => (
                      <FilterOption
                        key={priority.value}
                        isSelected={selectedPriorities.includes(priority.value)}
                        onClick={() => onTogglePriority(priority.value)}
                      >
                        <HStack gap={2}>
                          <Box
                            w="10px"
                            h="10px"
                            borderRadius="full"
                            bg={priority.color}
                          />
                          <Text fontSize="sm">{priority.label}</Text>
                        </HStack>
                      </FilterOption>
                    ))}
                  </VStack>
                </Box>

                {/* Due Date Filter */}
                <Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={3}
                  >
                    Due Date
                  </Text>
                  <VStack gap={2} align="stretch">
                    {DUE_DATE_OPTIONS.map((option) => (
                      <FilterOption
                        key={option.value || 'all'}
                        isSelected={selectedDueDateFilter === option.value}
                        onClick={() => onSetDueDateFilter(option.value)}
                        accessibilityRole="radio"
                      >
                        <Text fontSize="sm">{option.label}</Text>
                      </FilterOption>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Drawer.Body>

            {/* Footer */}
            <Drawer.Footer
              borderTopWidth="1px"
              borderTopColor={borderColor}
            >
              <VStack gap={2} w="full">
                {hasActiveFilters && (
                  <AppButton
                    intent="danger"
                    w="full"
                    onClick={handleClearAll}
                  >
                    Clear All Filters
                  </AppButton>
                )}
                <AppButton intent="primary" w="full" onClick={onClose}>
                  Done
                </AppButton>
              </VStack>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

export const FilterPanel = memo(FilterPanelComponent);

export default FilterPanel;
