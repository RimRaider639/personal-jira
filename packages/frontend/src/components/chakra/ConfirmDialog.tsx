/**
 * ConfirmDialog - Reusable confirmation dialog component
 * 
 * Replaces browser's window.confirm() with a styled Chakra UI dialog
 */

import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiInfo, FiTrash2 } from 'react-icons/fi';
import { AppModal } from './AppModal';
import { AppButton } from './AppButton';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<ConfirmDialogVariant, { icon: React.ElementType; color: string }> = {
  danger: { icon: FiTrash2, color: 'red.500' },
  warning: { icon: FiAlertTriangle, color: 'orange.500' },
  info: { icon: FiInfo, color: 'blue.500' },
};

/**
 * ConfirmDialog - A styled confirmation dialog
 * 
 * Usage:
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Board"
 *   message="Are you sure you want to delete this board? This action cannot be undone."
 *   variant="danger"
 *   confirmText="Delete"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmDialogProps): React.JSX.Element {
  const config = variantConfig[variant];

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <VStack gap={4} align="stretch">
        <HStack gap={3} align="flex-start">
          <Box
            p={2}
            borderRadius="full"
            bg={`${config.color.replace('.500', '.100')}`}
          >
            <Icon as={config.icon} color={config.color} boxSize={5} />
          </Box>
          <Text color="fg" flex={1}>
            {message}
          </Text>
        </HStack>

        <HStack gap={3} justify="flex-end" pt={2}>
          <AppButton
            intent="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </AppButton>
          <AppButton
            intent={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={isLoading}
          >
            {confirmText}
          </AppButton>
        </HStack>
      </VStack>
    </AppModal>
  );
}

export default ConfirmDialog;
