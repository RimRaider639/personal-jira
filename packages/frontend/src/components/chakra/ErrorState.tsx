/**
 * ErrorState Component
 *
 * A component for displaying error states with Chakra UI Alert.
 * Features:
 * - Error status Alert with red color scheme
 * - Error title display
 * - Optional error description/message
 * - Optional retry button
 * - Centered content vertically and horizontally
 *
 * @see Requirements: 16.3
 */

import React from 'react';
import { Alert, Box, Button, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export interface ErrorStateProps {
  /** Error title to display */
  title: string;
  /** Optional error description/message */
  description?: string;
  /** Optional retry handler - when provided, shows a retry button */
  onRetry?: () => void;
  /** Optional retry button text (defaults to "Try Again") */
  retryText?: string;
  /** Optional minimum height for the container */
  minHeight?: string | number;
}

/**
 * ErrorState - Displays an error state with optional retry functionality
 *
 * Uses Chakra UI Alert component with error status and red color scheme.
 * Content is centered both vertically and horizontally.
 *
 * @example
 * // Basic error state
 * <ErrorState title="Something went wrong" />
 *
 * @example
 * // Error with description
 * <ErrorState
 *   title="Failed to load boards"
 *   description="Please check your internet connection and try again."
 * />
 *
 * @example
 * // Error with retry button
 * <ErrorState
 *   title="Failed to load data"
 *   description="An error occurred while fetching your data."
 *   onRetry={() => refetch()}
 * />
 *
 * @example
 * // Custom retry text
 * <ErrorState
 *   title="Connection lost"
 *   onRetry={handleReconnect}
 *   retryText="Reconnect"
 * />
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryText = 'Try Again',
  minHeight = '200px',
}: ErrorStateProps): React.JSX.Element {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight={minHeight}
      width="100%"
      padding={4}
    >
      <Alert.Root
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="lg"
        padding={6}
        maxWidth="md"
        width="100%"
      >
        <Alert.Indicator asChild>
          <FiAlertTriangle size={40} />
        </Alert.Indicator>

        <VStack gap={2} marginTop={4}>
          <Alert.Title fontSize="lg" fontWeight="semibold">
            {title}
          </Alert.Title>

          {description && (
            <Alert.Description maxWidth="sm">
              <Text color="fg.muted">{description}</Text>
            </Alert.Description>
          )}

          {onRetry && (
            <Button
              marginTop={4}
              colorPalette="red"
              variant="outline"
              onClick={onRetry}
              aria-label={retryText}
            >
              <FiRefreshCw style={{ marginRight: '0.5rem' }} />
              {retryText}
            </Button>
          )}
        </VStack>
      </Alert.Root>
    </Box>
  );
}

export default ErrorState;
