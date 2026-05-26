/**
 * Chakra UI Component Library
 *
 * Barrel export for all custom Chakra UI wrapper components.
 * These components provide consistent styling and behavior across the application.
 *
 * @see Requirements: 1.4
 */

// Button components
export {
  AppButton,
  AppIconButton,
  type AppButtonProps,
  type AppIconButtonProps,
  type ButtonIntent,
} from './AppButton';

// Card components
export {
  AppCard,
  AppCardHeader,
  AppCardBody,
  AppCardFooter,
  AppCardTitle,
  AppCardDescription,
  type AppCardProps,
} from './AppCard';

// Input components
export { AppInput, type AppInputProps } from './AppInput';

// Tooltip components
export {
  AppTooltip,
  type AppTooltipProps,
  type TooltipPlacement,
} from './AppTooltip';

// Modal components
export {
  AppModal,
  type AppModalProps,
  type ModalSize,
} from './AppModal';

// Confirm dialog components
export {
  ConfirmDialog,
  type ConfirmDialogVariant,
} from './ConfirmDialog';

// State components
export { ErrorState, type ErrorStateProps } from './ErrorState';

// Loading state components
export {
  LoadingState,
  type LoadingStateProps,
  type LoadingStateVariant,
} from './LoadingState';

// Empty state components
export { EmptyState, type EmptyStateProps } from './EmptyState';

// Toast provider
export { ToastProvider, type ToastProviderProps } from './ToastProvider';

// Navigation components
export { NavBar, type NavBarProps } from './NavBar';

// Layout components
export {
  ResponsiveContainer,
  type ResponsiveContainerProps,
} from './ResponsiveContainer';

// Task list item component
export {
  TaskListItem,
  getStatusColor,
  getPriorityColor,
  getDeadlineInfo,
} from './TaskListItem';
