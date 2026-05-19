/**
 * LoadingState Component
 *
 * A versatile loading state component that provides different loading patterns:
 * - spinner: Centered spinner for inline or full-page loading
 * - skeleton-card: Grid of skeleton cards for board/epic list loading
 * - skeleton-list: List of skeleton items for task list loading
 * - skeleton-detail: Skeleton layout for detail view loading (title, description, metadata)
 *
 * @see Requirements: 16.1, 16.4
 */

import React from 'react';
import {
  Box,
  Center,
  Flex,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Spinner,
  Stack,
  VStack,
} from '@chakra-ui/react';

/** Loading state variant types */
export type LoadingStateVariant =
  | 'spinner'
  | 'skeleton-card'
  | 'skeleton-list'
  | 'skeleton-detail';

/** Props for the LoadingState component */
export interface LoadingStateProps {
  /** Loading state variant */
  variant?: LoadingStateVariant;
  /** Number of skeleton items to display (for skeleton-card and skeleton-list variants) */
  count?: number;
  /** Spinner size (for spinner variant) */
  spinnerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to display full height (100vh) */
  fullHeight?: boolean;
  /** Custom height for the loading container */
  height?: string | number;
  /** Accessible label for the loading state */
  label?: string;
}

/**
 * SkeletonCard - A single skeleton card for grid layouts
 */
function SkeletonCard(): React.JSX.Element {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bg="bg"
      shadow="sm"
    >
      {/* Card header with title */}
      <Skeleton height="20px" width="70%" mb={3} />
      
      {/* Card description */}
      <SkeletonText noOfLines={2} gap={2} mb={4} />
      
      {/* Card footer with stats */}
      <Flex justify="space-between" align="center">
        <Skeleton height="16px" width="60px" />
        <Skeleton height="16px" width="40px" />
        <Skeleton height="16px" width="50px" />
      </Flex>
    </Box>
  );
}

/**
 * SkeletonListItem - A single skeleton list item for task lists
 */
function SkeletonListItem(): React.JSX.Element {
  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      bg="bg"
    >
      <Flex align="center" gap={3}>
        {/* Priority indicator */}
        <Skeleton height="100%" width="4px" minH="40px" borderRadius="full" />
        
        {/* Task content */}
        <Box flex={1}>
          {/* Task title */}
          <Skeleton height="18px" width="80%" mb={2} />
          
          {/* Task metadata row */}
          <Flex gap={3} align="center">
            <Skeleton height="14px" width="80px" />
            <Skeleton height="14px" width="60px" />
            <Skeleton height="20px" width="50px" borderRadius="full" />
          </Flex>
        </Box>
        
        {/* Action button placeholder */}
        <SkeletonCircle size="8" />
      </Flex>
    </Box>
  );
}

/**
 * SkeletonDetail - Skeleton layout for detail views (task, epic, board detail)
 */
function SkeletonDetail(): React.JSX.Element {
  return (
    <Box p={4}>
      {/* Title */}
      <Skeleton height="32px" width="60%" mb={4} />
      
      {/* Metadata row */}
      <Flex gap={4} mb={6} wrap="wrap">
        <Skeleton height="24px" width="100px" borderRadius="md" />
        <Skeleton height="24px" width="120px" borderRadius="md" />
        <Skeleton height="24px" width="80px" borderRadius="md" />
      </Flex>
      
      {/* Description section */}
      <Box mb={6}>
        <Skeleton height="16px" width="100px" mb={2} />
        <SkeletonText noOfLines={4} gap={3} />
      </Box>
      
      {/* Additional metadata section */}
      <Flex gap={6} mb={6}>
        <Box flex={1}>
          <Skeleton height="14px" width="80px" mb={2} />
          <Skeleton height="20px" width="120px" />
        </Box>
        <Box flex={1}>
          <Skeleton height="14px" width="80px" mb={2} />
          <Skeleton height="20px" width="100px" />
        </Box>
      </Flex>
      
      {/* Tabs/sections placeholder */}
      <Flex gap={4} borderBottomWidth="1px" pb={2} mb={4}>
        <Skeleton height="20px" width="80px" />
        <Skeleton height="20px" width="100px" />
        <Skeleton height="20px" width="90px" />
      </Flex>
      
      {/* Content area */}
      <VStack gap={3} align="stretch">
        <SkeletonListItem />
        <SkeletonListItem />
      </VStack>
    </Box>
  );
}

/**
 * LoadingState - Versatile loading state component
 *
 * Provides different loading patterns for various UI contexts:
 * - Use 'spinner' for inline loading or simple loading states
 * - Use 'skeleton-card' for grid layouts like board list or epic list
 * - Use 'skeleton-list' for list layouts like task lists
 * - Use 'skeleton-detail' for detail views like task detail or epic detail
 *
 * @example
 * // Centered spinner
 * <LoadingState variant="spinner" />
 *
 * @example
 * // Full-height spinner for page loading
 * <LoadingState variant="spinner" fullHeight />
 *
 * @example
 * // Grid of skeleton cards for board list
 * <LoadingState variant="skeleton-card" count={6} />
 *
 * @example
 * // List of skeleton items for task list
 * <LoadingState variant="skeleton-list" count={5} />
 *
 * @example
 * // Skeleton for detail view
 * <LoadingState variant="skeleton-detail" />
 */
export function LoadingState({
  variant = 'spinner',
  count = 3,
  spinnerSize = 'lg',
  fullHeight = false,
  height,
  label = 'Loading...',
}: LoadingStateProps): React.JSX.Element {
  // Calculate container height
  const containerHeight = fullHeight ? '100vh' : height;

  // Render spinner variant
  if (variant === 'spinner') {
    return (
      <Center
        h={containerHeight}
        minH={containerHeight ? undefined : '200px'}
        role="status"
        aria-label={label}
      >
        <VStack gap={4}>
          <Spinner
            size={spinnerSize}
            color="brand.500"
            borderWidth="3px"
          />
          <Box color="fg.muted" fontSize="sm">
            {label}
          </Box>
        </VStack>
      </Center>
    );
  }

  // Render skeleton-card variant (grid layout for boards/epics)
  if (variant === 'skeleton-card') {
    return (
      <Box role="status" aria-label={label}>
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
          gap={4}
        >
          {Array.from({ length: count }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  // Render skeleton-list variant (list layout for tasks)
  if (variant === 'skeleton-list') {
    return (
      <Box role="status" aria-label={label}>
        <Stack gap={3}>
          {Array.from({ length: count }).map((_, index) => (
            <SkeletonListItem key={index} />
          ))}
        </Stack>
      </Box>
    );
  }

  // Render skeleton-detail variant (detail view layout)
  if (variant === 'skeleton-detail') {
    return (
      <Box role="status" aria-label={label}>
        <SkeletonDetail />
      </Box>
    );
  }

  // Fallback to spinner
  return (
    <Center h={containerHeight} minH="200px" role="status" aria-label={label}>
      <Spinner size={spinnerSize} color="brand.500" />
    </Center>
  );
}

export default LoadingState;
