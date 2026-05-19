/**
 * AppButton Component
 *
 * A styled button wrapper that provides intent-based variants for consistent
 * button styling throughout the application. Supports icons, loading states,
 * and tooltips for enhanced UX.
 *
 * Intent Mapping:
 * - primary: solid variant with brand colorPalette (default)
 * - secondary: outline variant
 * - danger: solid variant with red colorPalette
 * - ghost: ghost variant
 *
 * @see Requirements: 2.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8
 */

import React from 'react';
import {
  Button,
  IconButton,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import type { ButtonProps, IconButtonProps } from '@chakra-ui/react';

/** Button intent types for semantic styling */
export type ButtonIntent = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Chakra UI v3 button variant types */
type ChakraButtonVariant = 'solid' | 'outline' | 'ghost' | 'subtle' | 'surface' | 'plain';

/** Props for the AppButton component */
export interface AppButtonProps extends Omit<ButtonProps, 'variant' | 'colorPalette'> {
  /** Button intent: primary, secondary, danger, ghost */
  intent?: ButtonIntent;
  /** Left icon component */
  leftIcon?: React.ReactElement;
  /** Right icon component */
  rightIcon?: React.ReactElement;
  /** Tooltip text - required for icon-only buttons for accessibility */
  tooltip?: string;
  /** Tooltip placement */
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  /** Children content */
  children?: React.ReactNode;
}

/** Props for icon-only buttons */
export interface AppIconButtonProps extends Omit<IconButtonProps, 'variant' | 'colorPalette'> {
  /** Button intent: primary, secondary, danger, ghost */
  intent?: ButtonIntent;
  /** Tooltip text - required for accessibility */
  tooltip?: string;
  /** Tooltip placement */
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  /** Aria label - required for accessibility */
  'aria-label': string;
}

/**
 * Maps intent to Chakra UI v3 variant and colorPalette
 */
function getButtonStyles(intent: ButtonIntent): { variant: ChakraButtonVariant; colorPalette: string } {
  switch (intent) {
    case 'primary':
      return { variant: 'solid', colorPalette: 'brand' };
    case 'secondary':
      return { variant: 'outline', colorPalette: 'brand' };
    case 'danger':
      return { variant: 'solid', colorPalette: 'red' };
    case 'ghost':
      return { variant: 'ghost', colorPalette: 'brand' };
    default:
      return { variant: 'solid', colorPalette: 'brand' };
  }
}

/**
 * AppButton - A styled button with intent-based variants
 *
 * @example
 * ```tsx
 * // Primary button
 * <AppButton intent="primary" onClick={handleSave}>
 *   Save
 * </AppButton>
 *
 * // Button with icons
 * <AppButton
 *   intent="primary"
 *   leftIcon={<AddIcon />}
 *   onClick={handleCreate}
 * >
 *   Create Board
 * </AppButton>
 *
 * // Loading button
 * <AppButton intent="primary" loading loadingText="Saving...">
 *   Save
 * </AppButton>
 *
 * // Danger button with tooltip
 * <AppButton intent="danger" tooltip="Delete this item permanently">
 *   Delete
 * </AppButton>
 * ```
 */
export function AppButton({
  intent = 'primary',
  leftIcon,
  rightIcon,
  loading,
  loadingText,
  tooltip,
  tooltipPlacement = 'top',
  children,
  disabled,
  ...rest
}: AppButtonProps): React.JSX.Element {
  const { variant, colorPalette } = getButtonStyles(intent);

  // Build the button element
  const buttonElement = (
    <Button
      variant={variant}
      colorPalette={colorPalette}
      disabled={disabled || loading}
      loading={loading}
      loadingText={loadingText}
      {...rest}
    >
      {!loading && leftIcon && (
        <span style={{ marginRight: children ? '0.5rem' : 0, display: 'inline-flex' }}>
          {leftIcon}
        </span>
      )}
      {children}
      {!loading && rightIcon && (
        <span style={{ marginLeft: children ? '0.5rem' : 0, display: 'inline-flex' }}>
          {rightIcon}
        </span>
      )}
    </Button>
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <Tooltip.Root openDelay={300} positioning={{ placement: tooltipPlacement }}>
        <Tooltip.Trigger asChild>
          {buttonElement}
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>
            {tooltip}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    );
  }

  return buttonElement;
}

/**
 * AppIconButton - An icon-only button with required aria-label
 *
 * Icon-only buttons MUST have an aria-label for accessibility.
 * A tooltip is strongly recommended to help sighted users understand the action.
 *
 * @example
 * ```tsx
 * // Icon button with tooltip
 * <AppIconButton
 *   intent="primary"
 *   aria-label="Add new task"
 *   tooltip="Add new task"
 *   onClick={handleAddTask}
 * >
 *   <AddIcon />
 * </AppIconButton>
 *
 * // Danger icon button
 * <AppIconButton
 *   intent="danger"
 *   aria-label="Delete item"
 *   tooltip="Delete item"
 *   onClick={handleDelete}
 * >
 *   <DeleteIcon />
 * </AppIconButton>
 * ```
 */
export function AppIconButton({
  intent = 'primary',
  loading,
  tooltip,
  tooltipPlacement = 'top',
  'aria-label': ariaLabel,
  disabled,
  children,
  ...rest
}: AppIconButtonProps): React.JSX.Element {
  const { variant, colorPalette } = getButtonStyles(intent);

  // Build the icon button element
  const iconButtonElement = (
    <IconButton
      variant={variant}
      colorPalette={colorPalette}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : children}
    </IconButton>
  );

  // Icon buttons should always have a tooltip for better UX
  // Use the tooltip prop or fall back to aria-label
  const tooltipContent = tooltip || ariaLabel;

  return (
    <Tooltip.Root openDelay={300} positioning={{ placement: tooltipPlacement }}>
      <Tooltip.Trigger asChild>
        {iconButtonElement}
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>
          {tooltipContent}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

export default AppButton;
