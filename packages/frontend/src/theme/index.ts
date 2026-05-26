/**
 * Theme system for the Kanban app
 * 
 * Architecture:
 * - Global dark mode toggle: Affects all UI elements (text, buttons, bars)
 * - Board-specific decorative themes: Add backgrounds and color palettes
 * - Each decorative theme has light and dark variants that respect the global toggle
 */

// Base theme type (global light/dark mode)
export type BaseThemeType = 'light' | 'dark';

// Decorative theme type (board-specific visual themes)
export type DecorativeThemeType = 'default' | 'nature' | 'scifi' | 'city';

// Combined theme type for backwards compatibility
export type ThemeType = 'light' | 'dark' | 'nature' | 'rickmorty' | 'office';

export interface ThemeColors {
  // Core colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  
  // Accent colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Priority colors
  priorityCritical: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  
  // Card colors
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  
  // Header
  headerBackground: string;
  headerText: string;
  
  // Section
  sectionBackground: string;
  sectionHeader: string;
  
  // Overlay
  overlay: string;
  modalBackground: string;
}

export interface ThemeBackground {
  type: 'solid' | 'gradient' | 'image';
  value: string;
  overlay?: string;
}

export interface Theme {
  name: string;
  displayName: string;
  description: string;
  colors: ThemeColors;
  background: ThemeBackground;
}

// ==================== BASE THEMES ====================
// These define the core light/dark mode colors

const lightBaseColors: ThemeColors = {
  background: '#f4f5f7',
  surface: '#ffffff',
  surfaceSecondary: '#f9fafb',
  text: '#172b4d',
  textSecondary: '#5e6c84',
  textMuted: '#97a0af',
  border: '#dfe1e6',
  borderLight: '#ebecf0',
  
  primary: '#0052cc',
  primaryLight: '#deebff',
  primaryDark: '#0747a6',
  
  success: '#36b37e',
  warning: '#ffab00',
  error: '#de350b',
  info: '#0065ff',
  
  priorityCritical: '#de350b',
  priorityHigh: '#ff5630',
  priorityMedium: '#ffab00',
  priorityLow: '#36b37e',
  
  cardBackground: '#ffffff',
  cardBorder: '#dfe1e6',
  cardShadow: 'rgba(9, 30, 66, 0.08)',
  
  headerBackground: '#4a90d9',
  headerText: '#ffffff',
  
  sectionBackground: '#ebecf0',
  sectionHeader: '#5e6c84',
  
  overlay: 'rgba(9, 30, 66, 0.54)',
  modalBackground: '#ffffff',
};

const darkBaseColors: ThemeColors = {
  background: '#1d2125',
  surface: '#22272b',
  surfaceSecondary: '#282e33',
  text: '#b6c2cf',
  textSecondary: '#9fadbc',
  textMuted: '#738496',
  border: '#3d474f',
  borderLight: '#454f59',
  
  primary: '#579dff',
  primaryLight: '#1c2b41',
  primaryDark: '#85b8ff',
  
  success: '#4bce97',
  warning: '#f5cd47',
  error: '#f87168',
  info: '#579dff',
  
  priorityCritical: '#f87168',
  priorityHigh: '#fea362',
  priorityMedium: '#f5cd47',
  priorityLow: '#4bce97',
  
  cardBackground: '#22272b',
  cardBorder: '#3d474f',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  
  headerBackground: '#0d1117',
  headerText: '#e6edf3',
  
  sectionBackground: '#282e33',
  sectionHeader: '#9fadbc',
  
  overlay: 'rgba(0, 0, 0, 0.6)',
  modalBackground: '#22272b',
};

// Light theme (default - Jira-like)
const lightTheme: Theme = {
  name: 'light',
  displayName: 'Light',
  description: 'Clean and professional light theme',
  colors: lightBaseColors,
  background: {
    type: 'solid',
    value: '#f4f5f7',
  },
};

// Dark theme (Jira dark mode style)
const darkTheme: Theme = {
  name: 'dark',
  displayName: 'Dark',
  description: 'Easy on the eyes dark theme',
  colors: darkBaseColors,
  background: {
    type: 'solid',
    value: '#1d2125',
  },
};

// ==================== DECORATIVE THEMES ====================
// Each has light and dark variants

// Nature theme - Light variant
const natureLightTheme: Theme = {
  name: 'nature-light',
  displayName: 'Nature',
  description: 'Calming forest-inspired theme',
  colors: {
    ...lightBaseColors,
    primary: '#2d8a4e',
    primaryLight: '#e8f5e9',
    primaryDark: '#1b5e20',
    headerBackground: 'rgba(45, 138, 78, 0.95)',
    headerText: '#ffffff',
    cardBackground: 'rgba(255, 255, 255, 0.95)',
    sectionBackground: 'rgba(232, 245, 233, 0.9)',
  },
  background: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
    overlay: 'rgba(255, 255, 255, 0.75)',
  },
};

// Nature theme - Dark variant
const natureDarkTheme: Theme = {
  name: 'nature-dark',
  displayName: 'Nature',
  description: 'Calming forest-inspired theme',
  colors: {
    ...darkBaseColors,
    primary: '#6bcf8e',
    primaryLight: '#1e3a2c',
    primaryDark: '#8fe0a8',
    headerBackground: 'rgba(26, 47, 35, 0.95)',
    headerText: '#d4e5db',
    cardBackground: 'rgba(30, 58, 44, 0.9)',
    cardBorder: '#3d5a4a',
    sectionBackground: 'rgba(35, 68, 53, 0.85)',
    sectionHeader: '#a8c5b4',
  },
  background: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
    overlay: 'rgba(26, 47, 35, 0.85)',
  },
};

// Sci-Fi theme - Light variant
const scifiLightTheme: Theme = {
  name: 'scifi-light',
  displayName: 'Sci-Fi Portal',
  description: 'Interdimensional fun theme',
  colors: {
    ...lightBaseColors,
    primary: '#6366f1',
    primaryLight: '#e0e7ff',
    primaryDark: '#4f46e5',
    headerBackground: 'rgba(99, 102, 241, 0.95)',
    headerText: '#ffffff',
    cardBackground: 'rgba(255, 255, 255, 0.95)',
    sectionBackground: 'rgba(224, 231, 255, 0.9)',
  },
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
    overlay: 'rgba(255, 255, 255, 0.3)',
  },
};

// Sci-Fi theme - Dark variant
const scifiDarkTheme: Theme = {
  name: 'scifi-dark',
  displayName: 'Sci-Fi Portal',
  description: 'Interdimensional fun theme',
  colors: {
    ...darkBaseColors,
    primary: '#97f59b',
    primaryLight: '#1a2f23',
    primaryDark: '#b8ffbb',
    text: '#e0e7ff',
    textSecondary: '#a5b4fc',
    textMuted: '#7c8adb',
    border: '#3d4a7a',
    borderLight: '#4a5a8a',
    headerBackground: 'rgba(26, 26, 46, 0.95)',
    headerText: '#e0e7ff',
    cardBackground: 'rgba(22, 33, 62, 0.9)',
    cardBorder: '#3d4a7a',
    cardShadow: 'rgba(151, 245, 155, 0.1)',
    sectionBackground: 'rgba(31, 43, 77, 0.85)',
    sectionHeader: '#a5b4fc',
  },
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overlay: 'rgba(26, 26, 46, 0.3)',
  },
};

// City theme - Light variant
const cityLightTheme: Theme = {
  name: 'city-light',
  displayName: 'City View',
  description: 'Modern office with city skyline',
  colors: {
    ...lightBaseColors,
    primary: '#f97316',
    primaryLight: '#fff7ed',
    primaryDark: '#ea580c',
    headerBackground: 'rgba(249, 115, 22, 0.95)',
    headerText: '#ffffff',
    cardBackground: 'rgba(255, 255, 255, 0.95)',
    sectionBackground: 'rgba(255, 247, 237, 0.9)',
  },
  background: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80',
    overlay: 'rgba(255, 255, 255, 0.8)',
  },
};

// City theme - Dark variant
const cityDarkTheme: Theme = {
  name: 'city-dark',
  displayName: 'City View',
  description: 'Modern office with city skyline',
  colors: {
    ...darkBaseColors,
    primary: '#ff9f43',
    primaryLight: '#2d2520',
    primaryDark: '#ffb86c',
    text: '#e8e8f0',
    textSecondary: '#b8b8c8',
    textMuted: '#8888a0',
    border: '#404055',
    borderLight: '#505068',
    headerBackground: 'rgba(28, 28, 40, 0.95)',
    headerText: '#e8e8f0',
    cardBackground: 'rgba(37, 37, 50, 0.9)',
    cardBorder: '#404055',
    cardShadow: 'rgba(255, 159, 67, 0.1)',
    sectionBackground: 'rgba(45, 45, 61, 0.85)',
    sectionHeader: '#b8b8c8',
  },
  background: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80',
    overlay: 'rgba(28, 28, 40, 0.88)',
  },
};

// ==================== THEME REGISTRY ====================

// All themes for backwards compatibility
export const themes: Record<ThemeType, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  nature: natureDarkTheme, // Default to dark for backwards compat
  rickmorty: scifiDarkTheme,
  office: cityDarkTheme,
};

// Decorative themes with light/dark variants
export interface DecorativeTheme {
  name: DecorativeThemeType;
  displayName: string;
  description: string;
  light: Theme;
  dark: Theme;
}

export const decorativeThemes: DecorativeTheme[] = [
  {
    name: 'default',
    displayName: 'Default',
    description: 'Clean professional look',
    light: lightTheme,
    dark: darkTheme,
  },
  {
    name: 'nature',
    displayName: 'Nature',
    description: 'Calming forest vibes',
    light: natureLightTheme,
    dark: natureDarkTheme,
  },
  {
    name: 'scifi',
    displayName: 'Sci-Fi Portal',
    description: 'Interdimensional fun',
    light: scifiLightTheme,
    dark: scifiDarkTheme,
  },
  {
    name: 'city',
    displayName: 'City View',
    description: 'Modern urban style',
    light: cityLightTheme,
    dark: cityDarkTheme,
  },
];

/**
 * Get theme by name (backwards compatible)
 */
export const getTheme = (themeName: ThemeType): Theme => {
  return themes[themeName] || themes.light;
};

/**
 * Get decorative theme with appropriate light/dark variant
 */
export const getDecorativeTheme = (
  decorativeTheme: DecorativeThemeType,
  isDarkMode: boolean
): Theme => {
  const theme = decorativeThemes.find(t => t.name === decorativeTheme);
  if (!theme) {
    return isDarkMode ? darkTheme : lightTheme;
  }
  return isDarkMode ? theme.dark : theme.light;
};

/**
 * Get base theme (light or dark)
 */
export const getBaseTheme = (isDarkMode: boolean): Theme => {
  return isDarkMode ? darkTheme : lightTheme;
};

export const themeList = Object.values(themes);

export default themes;
