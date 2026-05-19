/**
 * Modal Component Slot Recipe Configuration (Chakra UI v3)
 * 
 * Defines custom modal styles with slot-based styling for overlay, content, header, body, footer.
 * Includes responsive sizing and focus trapping support.
 * 
 * Note: In Chakra UI v3, multi-part components use slot recipes.
 */

import { defineSlotRecipe } from '@chakra-ui/react';

/**
 * Custom modal slot recipe
 * 
 * Slots:
 * - overlay: The backdrop overlay
 * - positioner: Container for positioning
 * - content: The modal content container
 * - header: Modal header section
 * - closeTrigger: Close button
 * - body: Modal body/content section
 * - footer: Modal footer section
 * 
 * Usage:
 * - Small dialogs: size="sm"
 * - Default: size="md"
 * - Large content: size="lg", "xl", "2xl"
 * - Full screen: size="full"
 */
export const modalSlotRecipe = defineSlotRecipe({
  className: 'kanban-modal',
  slots: ['overlay', 'positioner', 'content', 'header', 'closeTrigger', 'body', 'footer'],
  base: {
    overlay: {
      bg: 'blackAlpha.600',
      position: 'fixed',
      inset: '0',
      zIndex: 'modal',
    },
    positioner: {
      display: 'flex',
      position: 'fixed',
      inset: '0',
      zIndex: 'modal',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'auto',
      overscrollBehaviorY: 'none',
    },
    content: {
      borderRadius: 'lg',
      bg: 'bg.panel',
      color: 'fg',
      my: 'auto',
      mx: { base: '4', md: 'auto' },
      zIndex: 'modal',
      maxH: { base: 'calc(100vh - 2rem)', md: 'calc(100vh - 7.5rem)' },
      boxShadow: 'xl',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      width: '100%',
    },
    header: {
      px: '6',
      py: '4',
      fontSize: 'xl',
      fontWeight: 'semibold',
      borderBottomWidth: '1px',
      borderColor: 'border',
    },
    closeTrigger: {
      position: 'absolute',
      top: '3',
      right: '3',
      borderRadius: 'md',
      _focusVisible: {
        boxShadow: 'outline',
      },
    },
    body: {
      px: '6',
      py: '4',
      flex: '1',
      overflow: 'auto',
    },
    footer: {
      px: '6',
      py: '4',
      borderTopWidth: '1px',
      borderColor: 'border',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '3',
    },
  },
  variants: {
    // Size variants
    size: {
      xs: {
        content: {
          maxW: 'xs',
        },
      },
      sm: {
        content: {
          maxW: 'sm',
        },
      },
      md: {
        content: {
          maxW: 'md',
        },
      },
      lg: {
        content: {
          maxW: 'lg',
        },
      },
      xl: {
        content: {
          maxW: 'xl',
        },
      },
      '2xl': {
        content: {
          maxW: '2xl',
        },
      },
      '3xl': {
        content: {
          maxW: '3xl',
        },
      },
      '4xl': {
        content: {
          maxW: '4xl',
        },
      },
      '5xl': {
        content: {
          maxW: '5xl',
        },
      },
      full: {
        content: {
          maxW: '100vw',
          minH: '100vh',
          my: '0',
          borderRadius: '0',
        },
      },
    },
    // Centered variant
    centered: {
      true: {
        positioner: {
          alignItems: 'center',
        },
        content: {
          my: 'auto',
        },
      },
      false: {
        positioner: {
          alignItems: 'flex-start',
        },
        content: {
          my: '16',
        },
      },
    },
    // Scrollable behavior
    scrollBehavior: {
      inside: {
        content: {
          maxH: 'calc(100vh - 7.5rem)',
        },
        body: {
          overflow: 'auto',
        },
      },
      outside: {
        positioner: {
          overflow: 'auto',
        },
        content: {
          maxH: 'none',
        },
        body: {
          overflow: 'visible',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
    centered: true,
    scrollBehavior: 'inside',
  },
});

export default modalSlotRecipe;
