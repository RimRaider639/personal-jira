/**
 * AppCard Component
 *
 * A styled Card wrapper component that extends Chakra UI Card with:
 * - accentColor: Left border color for visual categorization (e.g., priority indication)
 * - isHoverable: Enable hover elevation effect
 * - variant: Card style variant (elevated, outline, filled)
 * - onClick: Click handler for interactive cards
 *
 * @see Requirements: 6.2, 6.5, 8.1, 8.7
 */

import React from 'react';
import { Card } from '@chakra-ui/react';
import type { CardRootProps } from '@chakra-ui/react';

export interface AppCardProps extends CardRootProps {
  /** Left border color for visual categorization (e.g., priority colors) */
  accentColor?: string;
  /** Enable hover elevation effect */
  isHoverable?: boolean;
  /** Card variant: elevated, outline, filled */
  variant?: 'elevated' | 'outline' | 'subtle';
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Children content */
  children: React.ReactNode;
}

/**
 * AppCard - Styled Card wrapper with accent color and hover effects
 *
 * Features:
 * - Configurable left border accent color for priority/category indication
 * - Hover elevation effect for interactive cards
 * - Multiple variants: elevated (shadow), outline (border), subtle (filled background)
 * - Click handler support for navigation/selection
 * - Passes through all standard Chakra Card props
 *
 * @example
 * // Basic card
 * <AppCard>Content</AppCard>
 *
 * @example
 * // Card with priority accent color
 * <AppCard accentColor="#dc2626">Critical Task</AppCard>
 *
 * @example
 * // Hoverable clickable card
 * <AppCard isHoverable onClick={() => navigate('/task/1')}>
 *   Click me
 * </AppCard>
 */
export function AppCard({
  accentColor,
  isHoverable = false,
  variant = 'elevated',
  onClick,
  children,
  ...rest
}: AppCardProps): React.JSX.Element {
  // Build dynamic styles based on props
  const accentStyles = accentColor
    ? {
        borderLeftWidth: '4px',
        borderLeftColor: accentColor,
        borderLeftStyle: 'solid' as const,
      }
    : {};

  const hoverStyles = isHoverable
    ? {
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        _hover: {
          shadow: 'lg',
          transform: 'translateY(-2px)',
        },
      }
    : {};

  const clickableProps = onClick
    ? {
        onClick,
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <Card.Root
      variant={variant}
      borderRadius="lg"
      overflow="hidden"
      {...accentStyles}
      {...hoverStyles}
      {...clickableProps}
      {...rest}
    >
      {children}
    </Card.Root>
  );
}

/**
 * Re-export Card sub-components for convenience
 * These can be used with AppCard for structured content
 */
export const AppCardHeader = Card.Header;
export const AppCardBody = Card.Body;
export const AppCardFooter = Card.Footer;
export const AppCardTitle = Card.Title;
export const AppCardDescription = Card.Description;

export default AppCard;
