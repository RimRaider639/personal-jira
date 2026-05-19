/**
 * Input Component Slot Recipe Configuration (Chakra UI v3)
 * 
 * Defines custom input styles with slot-based styling for field, addon, element.
 * Includes focus ring styling and error states.
 * 
 * Note: In Chakra UI v3, multi-part components use slot recipes.
 */

import { defineSlotRecipe } from '@chakra-ui/react';

/**
 * Custom input slot recipe
 * 
 * Slots:
 * - field: The input field itself
 * - addon: Left/right addons
 * - element: Left/right elements (icons, buttons)
 * 
 * Usage:
 * - Default: variant="outline"
 * - Filled background: variant="filled"
 * - Underline only: variant="flushed"
 */
export const inputSlotRecipe = defineSlotRecipe({
  className: 'kanban-input',
  slots: ['field', 'addon', 'element'],
  base: {
    field: {
      width: '100%',
      minWidth: '0',
      outline: '0',
      position: 'relative',
      appearance: 'none',
      transition: 'all 0.2s ease-in-out',
      _disabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
      },
      _placeholder: {
        color: 'fg.subtle',
      },
    },
    addon: {
      height: 'auto',
      display: 'flex',
      alignItems: 'center',
    },
    element: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  variants: {
    // Visual variants
    variant: {
      // Outline variant (default)
      outline: {
        field: {
          border: '1px solid',
          borderColor: 'border',
          bg: 'bg.panel',
          _hover: {
            borderColor: 'border.emphasized',
          },
          _focusVisible: {
            zIndex: 1,
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px {colors.brand.500}',
          },
          _invalid: {
            borderColor: 'red.500',
            boxShadow: '0 0 0 1px {colors.red.500}',
          },
        },
        addon: {
          border: '1px solid',
          borderColor: 'border',
          bg: 'bg.subtle',
        },
      },
      // Filled variant
      filled: {
        field: {
          border: '2px solid',
          borderColor: 'transparent',
          bg: 'bg.subtle',
          _hover: {
            bg: 'bg.muted',
          },
          _focusVisible: {
            bg: 'transparent',
            borderColor: 'brand.500',
          },
          _invalid: {
            borderColor: 'red.500',
          },
        },
        addon: {
          border: '2px solid',
          borderColor: 'transparent',
          bg: 'bg.subtle',
        },
      },
      // Flushed variant (underline only)
      flushed: {
        field: {
          borderBottom: '1px solid',
          borderColor: 'border',
          borderRadius: '0',
          px: '0',
          bg: 'transparent',
          _focusVisible: {
            borderColor: 'brand.500',
            boxShadow: '0 1px 0 0 {colors.brand.500}',
          },
          _invalid: {
            borderColor: 'red.500',
            boxShadow: '0 1px 0 0 {colors.red.500}',
          },
        },
        addon: {
          borderBottom: '1px solid',
          borderColor: 'border',
          borderRadius: '0',
          px: '0',
          bg: 'transparent',
        },
      },
    },
    // Size variants
    size: {
      xs: {
        field: {
          fontSize: 'xs',
          px: '2',
          h: '6',
          borderRadius: 'sm',
        },
        addon: {
          fontSize: 'xs',
          px: '2',
          h: '6',
          borderRadius: 'sm',
        },
        element: {
          w: '6',
          fontSize: 'xs',
        },
      },
      sm: {
        field: {
          fontSize: 'sm',
          px: '3',
          h: '8',
          borderRadius: 'sm',
        },
        addon: {
          fontSize: 'sm',
          px: '3',
          h: '8',
          borderRadius: 'sm',
        },
        element: {
          w: '8',
          fontSize: 'sm',
        },
      },
      md: {
        field: {
          fontSize: 'md',
          px: '4',
          h: '10',
          borderRadius: 'md',
        },
        addon: {
          fontSize: 'md',
          px: '4',
          h: '10',
          borderRadius: 'md',
        },
        element: {
          w: '10',
          fontSize: 'md',
        },
      },
      lg: {
        field: {
          fontSize: 'lg',
          px: '4',
          h: '12',
          borderRadius: 'md',
        },
        addon: {
          fontSize: 'lg',
          px: '4',
          h: '12',
          borderRadius: 'md',
        },
        element: {
          w: '12',
          fontSize: 'lg',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});

export default inputSlotRecipe;
