/**
 * Button Component Recipe Configuration (Chakra UI v3)
 * 
 * Defines custom button variants extending the default Chakra button recipe.
 * Supports primary, secondary, danger, and ghost variants.
 * 
 * Note: In Chakra UI v3, component styles are defined as recipes.
 * This file exports recipe configuration that can be merged with the theme.
 */

import { defineRecipe } from '@chakra-ui/react';

/**
 * Custom button recipe extending Chakra defaults
 * 
 * Usage:
 * - Primary actions: variant="solid" (default)
 * - Secondary actions: variant="outline"
 * - Tertiary actions: variant="ghost"
 * - Destructive actions: variant="danger" (custom)
 */
export const buttonRecipe = defineRecipe({
  className: 'kanban-button',
  base: {
    fontWeight: 'semibold',
    borderRadius: 'md',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    _focusVisible: {
      boxShadow: 'outline',
      outline: 'none',
    },
    _disabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
  variants: {
    // Visual variants
    variant: {
      // Primary action button (solid brand color)
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
        _active: {
          bg: 'brand.700',
        },
      },
      // Secondary action button (outline)
      outline: {
        bg: 'transparent',
        color: 'brand.500',
        borderWidth: '1px',
        borderColor: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
        _active: {
          bg: 'brand.100',
        },
      },
      // Tertiary action button (ghost)
      ghost: {
        bg: 'transparent',
        color: 'brand.500',
        _hover: {
          bg: 'brand.50',
        },
        _active: {
          bg: 'brand.100',
        },
      },
      // Destructive action button (danger)
      danger: {
        bg: 'red.500',
        color: 'white',
        _hover: {
          bg: 'red.600',
        },
        _active: {
          bg: 'red.700',
        },
      },
      // Link-style button
      link: {
        color: 'brand.500',
        textDecoration: 'none',
        _hover: {
          textDecoration: 'underline',
        },
        _active: {
          color: 'brand.700',
        },
      },
    },
    // Size variants
    size: {
      xs: {
        fontSize: 'xs',
        px: '2',
        py: '1',
        h: '6',
        minW: '6',
      },
      sm: {
        fontSize: 'sm',
        px: '3',
        py: '1.5',
        h: '8',
        minW: '8',
      },
      md: {
        fontSize: 'md',
        px: '4',
        py: '2',
        h: '10',
        minW: '10',
      },
      lg: {
        fontSize: 'lg',
        px: '6',
        py: '3',
        h: '12',
        minW: '12',
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
});

export default buttonRecipe;
