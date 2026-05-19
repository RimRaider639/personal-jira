/**
 * Card Component Slot Recipe Configuration (Chakra UI v3)
 * 
 * Defines custom card styles with slot-based styling for root, header, body, footer.
 * Supports elevated, outline, and filled variants with hover effects.
 * 
 * Note: In Chakra UI v3, multi-part components use slot recipes.
 */

import { defineSlotRecipe } from '@chakra-ui/react';

/**
 * Custom card slot recipe
 * 
 * Slots:
 * - root: The card container
 * - header: Card header section
 * - body: Card body/content section
 * - footer: Card footer section
 * 
 * Usage:
 * - Elevated cards: variant="elevated" (default) - with shadow
 * - Outline cards: variant="outline" - with border
 * - Filled cards: variant="filled" - with background
 */
export const cardSlotRecipe = defineSlotRecipe({
  className: 'kanban-card',
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      borderRadius: 'lg',
      overflow: 'hidden',
      transition: 'all 0.2s ease-in-out',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      px: '4',
      py: '3',
      fontWeight: 'semibold',
    },
    body: {
      px: '4',
      py: '3',
      flex: '1',
    },
    footer: {
      px: '4',
      py: '3',
    },
  },
  variants: {
    // Visual variants
    variant: {
      // Elevated card with shadow
      elevated: {
        root: {
          bg: 'bg.panel',
          boxShadow: 'card',
          _hover: {
            boxShadow: 'cardHover',
            transform: 'translateY(-2px)',
          },
        },
      },
      // Outline card with border
      outline: {
        root: {
          bg: 'transparent',
          borderWidth: '1px',
          borderColor: 'border',
          _hover: {
            borderColor: 'brand.300',
          },
        },
      },
      // Filled card with background
      filled: {
        root: {
          bg: 'bg.subtle',
          _hover: {
            bg: 'bg.muted',
          },
        },
      },
      // Unstyled card
      unstyled: {
        root: {
          bg: 'transparent',
          boxShadow: 'none',
        },
        header: {
          p: '0',
        },
        body: {
          p: '0',
        },
        footer: {
          p: '0',
        },
      },
    },
    // Size variants
    size: {
      sm: {
        root: {
          borderRadius: 'md',
        },
        header: {
          px: '3',
          py: '2',
          fontSize: 'sm',
        },
        body: {
          px: '3',
          py: '2',
          fontSize: 'sm',
        },
        footer: {
          px: '3',
          py: '2',
          fontSize: 'sm',
        },
      },
      md: {
        root: {
          borderRadius: 'lg',
        },
        header: {
          px: '4',
          py: '3',
        },
        body: {
          px: '4',
          py: '3',
        },
        footer: {
          px: '4',
          py: '3',
        },
      },
      lg: {
        root: {
          borderRadius: 'xl',
        },
        header: {
          px: '6',
          py: '4',
          fontSize: 'lg',
        },
        body: {
          px: '6',
          py: '4',
        },
        footer: {
          px: '6',
          py: '4',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'elevated',
    size: 'md',
  },
});

export default cardSlotRecipe;
