/**
 * Chakra UI v3 Theme Configuration
 * 
 * Custom theme extending Chakra UI defaults with:
 * - Brand colors (indigo #6366f1 as primary)
 * - Priority colors for task cards
 * - Typography, spacing, and shadow foundations
 * - Default component styles for Button, Card, Input, Modal
 * 
 * @see https://chakra-ui.com/docs/theming/overview
 */

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * Custom theme configuration using Chakra UI v3 API
 */
const customConfig = defineConfig({
  // CSS variable prefix
  cssVarsPrefix: 'kanban',

  // Global CSS styles
  globalCss: {
    'html, body': {
      fontFamily: 'body',
      lineHeight: 'base',
    },
    '*::placeholder': {
      opacity: 1,
      color: 'fg.subtle',
    },
    '*:focus-visible': {
      outline: 'none',
      boxShadow: '0 0 0 3px {colors.brand.500/50}',
    },
    // Scrollbar styling
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'bg.subtle',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'border.emphasized',
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'fg.subtle',
    },
  },

  theme: {
    // Design tokens
    tokens: {
      // Brand colors - Indigo primary (#6366f1)
      colors: {
        brand: {
          50: { value: '#eef2ff' },
          100: { value: '#e0e7ff' },
          200: { value: '#c7d2fe' },
          300: { value: '#a5b4fc' },
          400: { value: '#818cf8' },
          500: { value: '#6366f1' }, // Primary
          600: { value: '#4f46e5' },
          700: { value: '#4338ca' },
          800: { value: '#3730a3' },
          900: { value: '#312e81' },
          950: { value: '#1e1b4b' },
        },
        // Priority colors for task cards
        priority: {
          critical: { value: '#dc2626' }, // Red-600
          high: { value: '#f97316' },     // Orange-500
          medium: { value: '#eab308' },   // Yellow-500
          low: { value: '#22c55e' },      // Green-500
        },
      },

      // Font families
      fonts: {
        heading: { value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif` },
        body: { value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif` },
        mono: { value: `'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace` },
      },

      // Font sizes
      fontSizes: {
        '2xs': { value: '0.625rem' },  // 10px
        xs: { value: '0.75rem' },      // 12px
        sm: { value: '0.875rem' },     // 14px
        md: { value: '1rem' },         // 16px
        lg: { value: '1.125rem' },     // 18px
        xl: { value: '1.25rem' },      // 20px
        '2xl': { value: '1.5rem' },    // 24px
        '3xl': { value: '1.875rem' },  // 30px
        '4xl': { value: '2.25rem' },   // 36px
        '5xl': { value: '3rem' },      // 48px
      },

      // Font weights
      fontWeights: {
        hairline: { value: '100' },
        thin: { value: '200' },
        light: { value: '300' },
        normal: { value: '400' },
        medium: { value: '500' },
        semibold: { value: '600' },
        bold: { value: '700' },
        extrabold: { value: '800' },
        black: { value: '900' },
      },

      // Line heights
      lineHeights: {
        none: { value: '1' },
        shorter: { value: '1.25' },
        short: { value: '1.375' },
        base: { value: '1.5' },
        tall: { value: '1.625' },
        taller: { value: '2' },
      },

      // Letter spacings
      letterSpacings: {
        tighter: { value: '-0.05em' },
        tight: { value: '-0.025em' },
        normal: { value: '0' },
        wide: { value: '0.025em' },
        wider: { value: '0.05em' },
        widest: { value: '0.1em' },
      },

      // Spacing
      spacing: {
        px: { value: '1px' },
        '0': { value: '0' },
        '0.5': { value: '0.125rem' },
        '1': { value: '0.25rem' },
        '1.5': { value: '0.375rem' },
        '2': { value: '0.5rem' },
        '2.5': { value: '0.625rem' },
        '3': { value: '0.75rem' },
        '3.5': { value: '0.875rem' },
        '4': { value: '1rem' },
        '5': { value: '1.25rem' },
        '6': { value: '1.5rem' },
        '7': { value: '1.75rem' },
        '8': { value: '2rem' },
        '9': { value: '2.25rem' },
        '10': { value: '2.5rem' },
        '12': { value: '3rem' },
        '14': { value: '3.5rem' },
        '16': { value: '4rem' },
        '20': { value: '5rem' },
        '24': { value: '6rem' },
        '28': { value: '7rem' },
        '32': { value: '8rem' },
        '36': { value: '9rem' },
        '40': { value: '10rem' },
        '44': { value: '11rem' },
        '48': { value: '12rem' },
        '52': { value: '13rem' },
        '56': { value: '14rem' },
        '60': { value: '15rem' },
        '64': { value: '16rem' },
        '72': { value: '18rem' },
        '80': { value: '20rem' },
        '96': { value: '24rem' },
      },

      // Border radii
      radii: {
        none: { value: '0' },
        sm: { value: '0.125rem' },
        base: { value: '0.25rem' },
        md: { value: '0.375rem' },
        lg: { value: '0.5rem' },
        xl: { value: '0.75rem' },
        '2xl': { value: '1rem' },
        '3xl': { value: '1.5rem' },
        full: { value: '9999px' },
      },

      // Shadows
      shadows: {
        xs: { value: '0 0 0 1px rgba(0, 0, 0, 0.05)' },
        sm: { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
        base: { value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
        md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
        lg: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
        xl: { value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
        '2xl': { value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
        inner: { value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' },
        none: { value: 'none' },
        // Card-specific shadows
        card: { value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
        cardHover: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
        // Focus ring shadow
        outline: { value: '0 0 0 3px rgba(99, 102, 241, 0.5)' },
      },

      // Z-index values
      zIndex: {
        hide: { value: -1 },
        base: { value: 0 },
        docked: { value: 10 },
        dropdown: { value: 1000 },
        sticky: { value: 1100 },
        banner: { value: 1200 },
        overlay: { value: 1300 },
        modal: { value: 1400 },
        popover: { value: 1500 },
        skipLink: { value: 1600 },
        toast: { value: 1700 },
        tooltip: { value: 1800 },
      },

      // Durations
      durations: {
        'ultra-fast': { value: '50ms' },
        faster: { value: '100ms' },
        fast: { value: '150ms' },
        normal: { value: '200ms' },
        slow: { value: '300ms' },
        slower: { value: '400ms' },
        'ultra-slow': { value: '500ms' },
      },
    },

    // Semantic tokens for color mode support
    semanticTokens: {
      colors: {
        // Brand color palette for colorPalette prop
        brand: {
          solid: { value: '{colors.brand.500}' },
          contrast: { value: 'white' },
          fg: { value: { base: '{colors.brand.700}', _dark: '{colors.brand.300}' } },
          muted: { value: { base: '{colors.brand.100}', _dark: '{colors.brand.900}' } },
          subtle: { value: { base: '{colors.brand.50}', _dark: '{colors.brand.950}' } },
          emphasized: { value: { base: '{colors.brand.200}', _dark: '{colors.brand.800}' } },
          focusRing: { value: '{colors.brand.500}' },
        },

        // Priority semantic tokens
        'priority.critical': {
          solid: { value: '{colors.priority.critical}' },
          subtle: { value: { base: '#fef2f2', _dark: '#450a0a' } },
        },
        'priority.high': {
          solid: { value: '{colors.priority.high}' },
          subtle: { value: { base: '#fff7ed', _dark: '#431407' } },
        },
        'priority.medium': {
          solid: { value: '{colors.priority.medium}' },
          subtle: { value: { base: '#fefce8', _dark: '#422006' } },
        },
        'priority.low': {
          solid: { value: '{colors.priority.low}' },
          subtle: { value: { base: '#f0fdf4', _dark: '#052e16' } },
        },
      },

      shadows: {
        // Card shadows with dark mode support
        card: {
          value: {
            base: '{shadows.card}',
            _dark: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          },
        },
        cardHover: {
          value: {
            base: '{shadows.cardHover}',
            _dark: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
  },
});

/**
 * Create the Chakra UI system with custom configuration
 * Merges with defaultConfig to retain all built-in tokens and recipes
 */
export const system = createSystem(defaultConfig, customConfig);

export type ChakraSystem = typeof system;

export default system;
