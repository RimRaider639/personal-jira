/**
 * Chakra UI Color Definitions
 * 
 * Brand colors use indigo (#6366f1) as the primary color.
 * Priority colors are used for task card visual categorization.
 * 
 * These color values are also defined in chakraTheme.ts as Chakra UI v3 tokens.
 * This file provides raw color values for use outside of Chakra context.
 */

/**
 * Brand colors - Indigo primary (#6366f1)
 * Full palette from 50 (lightest) to 950 (darkest)
 */
export const brandColors = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1', // Primary
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
} as const;

/**
 * Priority colors for task cards
 * Used for visual categorization of task priority levels
 */
export const priorityColors = {
  critical: '#dc2626', // Red-600
  high: '#f97316',     // Orange-500
  medium: '#eab308',   // Yellow-500
  low: '#22c55e',      // Green-500
} as const;

/**
 * Extended priority palette with light/dark shades
 * Useful for backgrounds and hover states
 */
export const priorityShades = {
  critical: {
    light: '#fef2f2',
    main: '#dc2626',
    dark: '#991b1b',
  },
  high: {
    light: '#fff7ed',
    main: '#f97316',
    dark: '#c2410c',
  },
  medium: {
    light: '#fefce8',
    main: '#eab308',
    dark: '#a16207',
  },
  low: {
    light: '#f0fdf4',
    main: '#22c55e',
    dark: '#15803d',
  },
} as const;

/**
 * Status colors for feedback states
 */
export const statusColors = {
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
} as const;

/**
 * Combined colors object for convenience
 */
export const colors = {
  brand: brandColors,
  priority: priorityColors,
  priorityShades,
  ...statusColors,
} as const;

export type BrandColor = keyof typeof brandColors;
export type PriorityLevel = keyof typeof priorityColors;

export default colors;
