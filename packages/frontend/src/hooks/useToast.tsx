/**
 * Custom useAppToast hook for toast notifications
 *
 * Provides a convenient API for displaying toast notifications using Chakra UI v3's
 * toaster system. Includes convenience methods for common toast types and supports
 * action buttons for undo operations.
 *
 * Features:
 * - Bottom-right positioning by default
 * - 5-second auto-dismiss with manual dismiss option
 * - Convenience methods: showSuccess, showError, showWarning, showInfo
 * - Support for action buttons (e.g., undo operations)
 * - Appropriate color schemes for each toast type
 *
 * Usage:
 * 1. Render the Toaster component once at the app root level
 * 2. Use the useAppToast hook in any component to show toasts
 *
 * @example
 * ```tsx
 * // In App.tsx or root component
 * import { Toaster } from '@/hooks/useToast';
 *
 * function App() {
 *   return (
 *     <>
 *       <Toaster />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 *
 * @see Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from '@chakra-ui/react';
import React, { useCallback, useMemo } from 'react';

/** Default toast duration in milliseconds (5 seconds) */
const DEFAULT_DURATION = 5000;

/** Toast status types */
export type ToastStatus = 'success' | 'error' | 'warning' | 'info' | 'loading';

/** Toast placement options */
export type ToastPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end';

/** Action button configuration for toasts */
export interface ToastAction {
  /** Label text for the action button */
  label: string;
  /** Callback function when action is clicked */
  onClick: () => void;
}

/** Options for creating a toast notification */
export interface ToastOptions {
  /** Toast title (required) */
  title: string;
  /** Optional description text */
  description?: string;
  /** Toast status/type - determines color scheme */
  status?: ToastStatus;
  /** Duration in milliseconds before auto-dismiss (default: 5000ms) */
  duration?: number;
  /** Whether the toast can be manually dismissed (default: true) */
  closable?: boolean;
  /** Optional action button configuration */
  action?: ToastAction;
}

/** Return type for the useAppToast hook */
export interface UseAppToastReturn {
  /** Show a toast with full configuration options */
  showToast: (options: ToastOptions) => string;
  /** Show a success toast (green color scheme) */
  showSuccess: (title: string, description?: string, action?: ToastAction) => string;
  /** Show an error toast (red color scheme) */
  showError: (title: string, description?: string, action?: ToastAction) => string;
  /** Show a warning toast (yellow/orange color scheme) */
  showWarning: (title: string, description?: string, action?: ToastAction) => string;
  /** Show an info toast (blue color scheme) */
  showInfo: (title: string, description?: string, action?: ToastAction) => string;
  /** Dismiss a specific toast by ID */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

/**
 * Create the toaster instance with default configuration
 *
 * Configuration:
 * - placement: bottom-end (bottom-right corner)
 * - max: 5 toasts visible at once
 * - pauseOnPageIdle: true (pause timers when page is hidden)
 */
export const toaster = createToaster({
  placement: 'bottom-end',
  max: 5,
  pauseOnPageIdle: true,
});

/**
 * Toaster component that renders the toast container with aria-live regions
 *
 * This component must be rendered once at the app root level for toasts to appear.
 * It uses the toaster instance created above with bottom-right positioning.
 *
 * The component renders each toast with:
 * - Appropriate color scheme based on toast type (success=green, error=red, warning=yellow, info=blue)
 * - Title and optional description
 * - Close button for manual dismissal
 * - Optional action button for undo operations
 * - Loading spinner for loading type toasts
 * - Aria-live regions for screen reader announcements (Requirement 18.5)
 *
 * Accessibility:
 * - Uses aria-live="polite" for non-urgent notifications (success, info)
 * - Uses aria-live="assertive" for urgent notifications (error, warning)
 * - Includes role="status" for screen reader compatibility
 * - Toast content is announced to assistive technologies automatically
 *
 * @example
 * ```tsx
 * // In App.tsx
 * import { Toaster } from '@/hooks/useToast';
 *
 * function App() {
 *   return (
 *     <>
 *       <Toaster />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 *
 * @see Requirements: 11.1, 18.5
 */
export function Toaster(): React.JSX.Element {
  return (
    <Portal>
      {/* Aria-live region container for screen reader announcements */}
      <ChakraToaster toaster={toaster}>
        {(toast) => {
          // Determine aria-live politeness based on toast type
          // Error and warning toasts use "assertive" for immediate announcement
          // Success and info toasts use "polite" to not interrupt
          const ariaLive = toast.type === 'error' || toast.type === 'warning' 
            ? 'assertive' 
            : 'polite';
          
          return (
            <Toast.Root
              aria-live={ariaLive}
              role="status"
              aria-atomic="true"
            >
              {toast.type === 'loading' ? (
                <Spinner size="sm" color="blue.solid" />
              ) : (
                <Toast.Indicator />
              )}
              <Stack gap="1" flex="1" maxWidth="100%">
                {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                {toast.description && (
                  <Toast.Description>{toast.description}</Toast.Description>
                )}
              </Stack>
              {toast.action && (
                <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
              )}
              {toast.meta?.closable && <Toast.CloseTrigger />}
            </Toast.Root>
          );
        }}
      </ChakraToaster>
    </Portal>
  );
}

/**
 * Custom hook for displaying toast notifications
 *
 * Provides a convenient API for showing toast notifications with:
 * - Convenience methods for common toast types (success, error, warning, info)
 * - Default configuration for position (bottom-right) and duration (5 seconds)
 * - Support for action buttons within toasts for undo operations
 * - Manual dismiss capability
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const toast = useAppToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       toast.showSuccess('Saved!', 'Your changes have been saved.');
 *     } catch (error) {
 *       toast.showError('Save failed', error.message);
 *     }
 *   };
 *
 *   const handleDelete = () => {
 *     deleteItem();
 *     toast.showInfo('Item deleted', 'The item has been removed.', {
 *       label: 'Undo',
 *       onClick: () => restoreItem(),
 *     });
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 *
 * @returns Object containing toast display and control functions
 */
export function useAppToast(): UseAppToastReturn {
  /**
   * Show a toast with full configuration options
   */
  const showToast = useCallback((options: ToastOptions): string => {
    const {
      title,
      description,
      status = 'info',
      duration = DEFAULT_DURATION,
      closable = true,
      action,
    } = options;

    const toastOptions: Parameters<typeof toaster.create>[0] = {
      title,
      description,
      type: status,
      duration,
      closable,
    };

    // Add action button if provided
    if (action) {
      toastOptions.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }

    return toaster.create(toastOptions);
  }, []);

  /**
   * Show a success toast with green color scheme
   * Used for successful operations (create, update, save)
   */
  const showSuccess = useCallback(
    (title: string, description?: string, action?: ToastAction): string => {
      return showToast({
        title,
        description,
        status: 'success',
        action,
      });
    },
    [showToast]
  );

  /**
   * Show an error toast with red color scheme
   * Used for failed operations and error messages
   */
  const showError = useCallback(
    (title: string, description?: string, action?: ToastAction): string => {
      return showToast({
        title,
        description,
        status: 'error',
        action,
      });
    },
    [showToast]
  );

  /**
   * Show a warning toast with yellow/orange color scheme
   * Used for potentially destructive actions or important notices
   */
  const showWarning = useCallback(
    (title: string, description?: string, action?: ToastAction): string => {
      return showToast({
        title,
        description,
        status: 'warning',
        action,
      });
    },
    [showToast]
  );

  /**
   * Show an info toast with blue color scheme
   * Used for informational messages (delete confirmations, status updates)
   */
  const showInfo = useCallback(
    (title: string, description?: string, action?: ToastAction): string => {
      return showToast({
        title,
        description,
        status: 'info',
        action,
      });
    },
    [showToast]
  );

  /**
   * Dismiss a specific toast by its ID
   */
  const dismiss = useCallback((id: string): void => {
    toaster.dismiss(id);
  }, []);

  /**
   * Dismiss all visible toasts
   */
  const dismissAll = useCallback((): void => {
    toaster.dismiss();
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  const returnValue = useMemo<UseAppToastReturn>(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      dismiss,
      dismissAll,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo, dismiss, dismissAll]
  );

  return returnValue;
}

export default useAppToast;
