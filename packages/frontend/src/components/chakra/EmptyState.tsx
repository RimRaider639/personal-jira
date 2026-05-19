/**
 * EmptyState Component
 *
 * A component for displaying empty state UI when lists or content areas have no data.
 * Uses Chakra UI Center and VStack for centered layout with:
 * - Icon at the top for visual context
 * - Heading/title text
 * - Optional description text
 * - Optional call-to-action button
 *
 * @see Requirements: 16.2, 16.5, 16.6
 */

import React from 'react';
import { Center, VStack, Text, Icon, Box } from '@chakra-ui/react';
import type { CenterProps } from '@chakra-ui/react';
import { AppButton } from './AppButton';
import type { ButtonIntent } from './AppButton';

export interface EmptyStateProps extends Omit<CenterProps, 'children'> {
  /** Icon to display at the top (React element, e.g., from react-icons) */
  icon?: React.ReactElement;
  /** Main heading/title text */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional CTA button text */
  actionText?: string;
  /** Optional CTA button click handler */
  onAction?: () => void;
  /** Optional CTA button intent (defaults to 'primary') */
  actionIntent?: ButtonIntent;
  /** Optional left icon for the CTA button */
  actionIcon?: React.ReactElement;
  /** Minimum height for the empty state container */
  minHeight?: string | number;
}

/**
 * EmptyState - Display a centered empty state with icon, text, and optional CTA
 *
 * Features:
 * - Centered layout using Chakra UI Center and VStack
 * - Customizable icon for visual context
 * - Title and optional description text
 * - Optional call-to-action button with configurable intent
 * - Responsive and accessible design
 *
 * @example
 * // Basic empty state
 * <EmptyState
 *   icon={<FiInbox />}
 *   title="No tasks yet"
 * />
 *
 * @example
 * // Empty state with description and CTA
 * <EmptyState
 *   icon={<FiClipboard />}
 *   title="No tasks yet"
 *   description="Get started by creating your first task"
 *   actionText="Create your first task"
 *   onAction={() => openCreateTaskModal()}
 * />
 *
 * @example
 * // Empty state with custom action button
 * <EmptyState
 *   icon={<FiFolder />}
 *   title="No boards found"
 *   description="Create a board to organize your tasks"
 *   actionText="Create Board"
 *   actionIcon={<FiPlus />}
 *   actionIntent="primary"
 *   onAction={handleCreateBoard}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIntent = 'primary',
  actionIcon,
  minHeight = '200px',
  ...rest
}: EmptyStateProps): React.JSX.Element {
  return (
    <Center minH={minHeight} py={8} {...rest}>
      <VStack gap={4} textAlign="center" maxW="sm" px={4}>
        {/* Icon */}
        {icon && (
          <Box
            color="gray.400"
            _dark={{ color: 'gray.500' }}
          >
            <Icon asChild boxSize={12}>
              {icon}
            </Icon>
          </Box>
        )}

        {/* Title */}
        <Text
          fontSize="lg"
          fontWeight="semibold"
          color="gray.700"
          _dark={{ color: 'gray.200' }}
        >
          {title}
        </Text>

        {/* Description */}
        {description && (
          <Text
            fontSize="sm"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
          >
            {description}
          </Text>
        )}

        {/* CTA Button */}
        {actionText && onAction && (
          <AppButton
            intent={actionIntent}
            onClick={onAction}
            leftIcon={actionIcon}
            mt={2}
          >
            {actionText}
          </AppButton>
        )}
      </VStack>
    </Center>
  );
}

export default EmptyState;
