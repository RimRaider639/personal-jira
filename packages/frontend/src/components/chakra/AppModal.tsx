/**
 * AppModal Component
 *
 * A styled Modal wrapper component using Chakra UI v3 Dialog component.
 * Provides consistent modal dialogs with:
 * - Title header with close button
 * - Primary and secondary action buttons
 * - Loading state support
 * - Multiple size options
 * - Built-in focus trapping for accessibility
 *
 * @see Requirements: 10.1, 10.2, 10.6, 10.7, 18.4
 */

import React from 'react';
import {
  Dialog,
  Button,
  Spinner,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import type { DialogRootProps } from '@chakra-ui/react';

/** Modal size options */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Props for the AppModal component */
export interface AppModalProps extends Omit<DialogRootProps, 'size'> {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title displayed in the header */
  title: string;
  /** Primary action button text */
  primaryActionText?: string;
  /** Primary action handler */
  onPrimaryAction?: () => void;
  /** Secondary action button text */
  secondaryActionText?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Loading state for primary action button */
  isLoading?: boolean;
  /** Modal size: sm, md, lg, xl, full */
  size?: ModalSize;
  /** Children content for the modal body */
  children: React.ReactNode;
}

/** Chakra UI Dialog size type */
type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'cover';

/**
 * Maps size prop to Chakra UI Dialog size values
 */
function getDialogSize(size: ModalSize): DialogSize {
  switch (size) {
    case 'sm':
      return 'sm';
    case 'md':
      return 'md';
    case 'lg':
      return 'lg';
    case 'xl':
      return 'xl';
    case 'full':
      return 'full';
    default:
      return 'md';
  }
}

/**
 * AppModal - A styled modal dialog with consistent structure
 *
 * Features:
 * - Chakra UI v3 Dialog component (Modal renamed to Dialog in v3)
 * - Dialog.Backdrop for overlay
 * - Dialog.Content with header, body, and footer
 * - Dialog.CloseTrigger for dismissal
 * - Primary and secondary action buttons
 * - Loading spinner on primary button when isLoading is true
 * - Multiple size options
 * - Built-in focus trapping for accessibility (provided by Chakra Dialog)
 *
 * @example
 * // Basic modal
 * <AppModal
 *   open={isOpen}
 *   onClose={onClose}
 *   title="Create Board"
 *   primaryActionText="Create"
 *   onPrimaryAction={handleCreate}
 *   secondaryActionText="Cancel"
 *   onSecondaryAction={onClose}
 * >
 *   <FormControl>
 *     <FormLabel>Board Name</FormLabel>
 *     <Input value={name} onChange={(e) => setName(e.target.value)} />
 *   </FormControl>
 * </AppModal>
 *
 * @example
 * // Modal with loading state
 * <AppModal
 *   open={isOpen}
 *   onClose={onClose}
 *   title="Delete Task"
 *   primaryActionText="Delete"
 *   onPrimaryAction={handleDelete}
 *   isLoading={isDeleting}
 *   size="sm"
 * >
 *   Are you sure you want to delete this task?
 * </AppModal>
 */
export function AppModal({
  open,
  onClose,
  title,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  isLoading = false,
  size = 'md',
  children,
  ...rest
}: AppModalProps): React.JSX.Element {
  const dialogSize = getDialogSize(size);

  // Handle secondary action - defaults to onClose if not provided
  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      size={dialogSize}
      {...rest}
    >
      <Portal>
        <Dialog.Backdrop
          bg="blackAlpha.600"
          backdropFilter="blur(2px)"
        />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="lg"
            shadow="xl"
            maxH={size === 'full' ? '100vh' : '85vh'}
            overflow="hidden"
          >
            {/* Header */}
            <Dialog.Header
              borderBottomWidth="1px"
              borderBottomColor="gray.200"
              _dark={{ borderBottomColor: 'gray.700' }}
              px={6}
              py={4}
            >
              <Dialog.Title fontWeight="semibold" fontSize="lg">
                {title}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  position="absolute"
                  right={4}
                  top={4}
                  aria-label="Close modal"
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            {/* Body */}
            <Dialog.Body
              px={6}
              py={4}
              overflowY="auto"
            >
              {children}
            </Dialog.Body>

            {/* Footer - only render if there are action buttons */}
            {(primaryActionText || secondaryActionText) && (
              <Dialog.Footer
                borderTopWidth="1px"
                borderTopColor="gray.200"
                _dark={{ borderTopColor: 'gray.700' }}
                px={6}
                py={4}
                gap={3}
              >
                {secondaryActionText && (
                  <Button
                    variant="outline"
                    onClick={handleSecondaryAction}
                    disabled={isLoading}
                  >
                    {secondaryActionText}
                  </Button>
                )}
                {primaryActionText && (
                  <Button
                    colorPalette="brand"
                    onClick={onPrimaryAction}
                    disabled={isLoading}
                    minW="80px"
                  >
                    {isLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      primaryActionText
                    )}
                  </Button>
                )}
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default AppModal;
