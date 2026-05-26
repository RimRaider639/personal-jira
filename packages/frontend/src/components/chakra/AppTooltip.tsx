/**
 * AppTooltip Component
 *
 * A wrapper around Chakra UI v3 Tooltip component with:
 * - Default 300ms open delay to avoid flickering
 * - Configurable placement (top, bottom, left, right)
 * - Support for label prop for tooltip content
 * - Pass-through of all standard Tooltip props
 * - Only renders tooltip wrapper when label is provided
 * - Theme-aware styling (dark bg in light mode, light bg in dark mode)
 *
 * @see Requirements 12.6, 12.7
 */

import {
  Tooltip as ChakraTooltip,
  Portal,
} from '@chakra-ui/react';
import * as React from 'react';
import { useColorModeValue } from '@/hooks/useColorMode';

/**
 * Placement options for the tooltip
 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Props for the AppTooltip component
 */
export interface AppTooltipProps extends Omit<ChakraTooltip.RootProps, 'children'> {
  /** The tooltip content/label to display */
  label?: React.ReactNode;
  /** Placement of the tooltip relative to the trigger element */
  placement?: TooltipPlacement;
  /** Whether to show an arrow pointing to the trigger (default: true) */
  hasArrow?: boolean;
  /** Whether to render the tooltip in a portal */
  portalled?: boolean;
  /** Reference to the portal container */
  portalRef?: React.RefObject<HTMLElement | null>;
  /** Additional props for the tooltip content */
  contentProps?: ChakraTooltip.ContentProps;
  /** The trigger element(s) */
  children: React.ReactNode;
}

/**
 * Default open delay in milliseconds to avoid flickering
 * @see Requirement 12.7
 */
const DEFAULT_OPEN_DELAY = 300;

/**
 * AppTooltip - A styled tooltip wrapper with sensible defaults
 *
 * Features:
 * - 300ms delay before appearing to avoid flickering (Requirement 12.7)
 * - Configurable placement: top, bottom, left, right (Requirement 12.6)
 * - Only renders tooltip when label is provided
 * - Arrow display enabled by default (hasArrow defaults to true)
 * - Portal support for proper z-index handling
 * - Theme-aware: dark background in light mode, light background in dark mode
 *
 * @example
 * // Basic usage
 * <AppTooltip label="Delete item">
 *   <IconButton aria-label="Delete" icon={<DeleteIcon />} />
 * </AppTooltip>
 *
 * @example
 * // With placement
 * <AppTooltip label="Settings" placement="right">
 *   <Button>Settings</Button>
 * </AppTooltip>
 *
 * @example
 * // Without arrow
 * <AppTooltip label="More info" hasArrow={false}>
 *   <InfoIcon />
 * </AppTooltip>
 */
export const AppTooltip = React.forwardRef<HTMLDivElement, AppTooltipProps>(
  function AppTooltip(props, ref) {
    const {
      label,
      placement = 'top',
      hasArrow = true,
      portalled = true,
      portalRef,
      contentProps,
      children,
      openDelay = DEFAULT_OPEN_DELAY,
      ...rest
    } = props;

    // Theme-aware colors: dark bg in light mode, light bg in dark mode
    const bg = useColorModeValue('gray.800', 'gray.100');
    const color = useColorModeValue('white', 'gray.800');

    // If no label is provided, just render children without tooltip wrapper
    if (!label) {
      return <>{children}</>;
    }

    return (
      <ChakraTooltip.Root
        openDelay={openDelay}
        positioning={{ placement }}
        {...rest}
      >
        <ChakraTooltip.Trigger asChild>
          {children}
        </ChakraTooltip.Trigger>
        <Portal disabled={!portalled} container={portalRef}>
          <ChakraTooltip.Positioner>
            <ChakraTooltip.Content 
              ref={ref} 
              bg={bg}
              color={color}
              px={2}
              py={1}
              borderRadius="md"
              fontSize="sm"
              fontWeight="medium"
              boxShadow="md"
              {...contentProps}
            >
              {hasArrow && (
                <ChakraTooltip.Arrow>
                  <ChakraTooltip.ArrowTip />
                </ChakraTooltip.Arrow>
              )}
              {label}
            </ChakraTooltip.Content>
          </ChakraTooltip.Positioner>
        </Portal>
      </ChakraTooltip.Root>
    );
  }
);

AppTooltip.displayName = 'AppTooltip';

export default AppTooltip;
