/**
 * ResponsiveContainer Component
 *
 * A responsive layout container that wraps content with viewport-aware max-width
 * and padding settings. Uses Chakra UI's responsive array syntax for breakpoint-specific styling.
 *
 * Breakpoint behavior:
 * - Mobile (base): Full width with minimal padding
 * - Tablet (md): Constrained width with moderate padding
 * - Desktop (lg/xl): Maximum constrained width with comfortable padding
 *
 * @see Requirements: 17.1
 */

import React from 'react';
import { Container } from '@chakra-ui/react';
import type { ContainerProps } from '@chakra-ui/react';

export interface ResponsiveContainerProps extends ContainerProps {
  /** Children content to wrap */
  children: React.ReactNode;
  /** Whether to use fluid (full-width) container on all breakpoints */
  fluid?: boolean;
  /** Custom max-width values for each breakpoint [base, sm, md, lg, xl] */
  customMaxW?: (string | undefined)[];
  /** Custom padding values for each breakpoint [base, sm, md, lg, xl] */
  customPadding?: (string | number | undefined)[];
}

/**
 * ResponsiveContainer - Responsive layout wrapper with breakpoint-aware sizing
 *
 * Features:
 * - Responsive max-width using Chakra UI array syntax
 * - Responsive padding that adjusts to viewport size
 * - Full width on mobile, constrained on tablet/desktop
 * - Supports fluid mode for full-width layouts
 * - Passes through all standard Chakra Container props
 *
 * Default breakpoint values:
 * - base (0px+): 100% width, 16px padding
 * - sm (480px+): 100% width, 16px padding
 * - md (768px+): container.md max-width, 24px padding
 * - lg (992px+): container.lg max-width, 32px padding
 * - xl (1280px+): container.xl max-width, 32px padding
 *
 * @example
 * // Basic responsive container
 * <ResponsiveContainer>
 *   <YourContent />
 * </ResponsiveContainer>
 *
 * @example
 * // Fluid container (full width on all breakpoints)
 * <ResponsiveContainer fluid>
 *   <FullWidthContent />
 * </ResponsiveContainer>
 *
 * @example
 * // Custom max-width values
 * <ResponsiveContainer customMaxW={['100%', '100%', '600px', '800px', '1000px']}>
 *   <CustomContent />
 * </ResponsiveContainer>
 */
export function ResponsiveContainer({
  children,
  fluid = false,
  customMaxW,
  customPadding,
  ...rest
}: ResponsiveContainerProps): React.JSX.Element {
  // Default responsive max-width values using Chakra UI array syntax
  // [base, sm, md, lg, xl]
  const defaultMaxW = fluid
    ? '100%'
    : ['100%', '100%', 'container.md', 'container.lg', 'container.xl'];

  // Default responsive padding values using Chakra UI array syntax
  // [base, sm, md, lg, xl]
  const defaultPadding = [4, 4, 6, 8, 8]; // 16px, 16px, 24px, 32px, 32px

  const maxW = customMaxW ?? defaultMaxW;
  const padding = customPadding ?? defaultPadding;

  return (
    <Container
      maxW={maxW}
      px={padding}
      py={[4, 4, 6, 8, 8]} // Vertical padding also responsive
      centerContent={false}
      {...rest}
    >
      {children}
    </Container>
  );
}

export default ResponsiveContainer;
