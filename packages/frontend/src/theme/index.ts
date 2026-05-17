/**
 * Theme system for the Kanban app
 * Supports multiple themes including dark mode and themed backgrounds
 */

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

// Light theme (default - Jira-like)
const lightTheme: Theme = {
  name: 'light',
  displayName: 'Light',
  description: 'Clean and professional light theme',
  colors: {
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
    
    headerBackground: '#0052cc',
    headerText: '#ffffff',
    
    sectionBackground: '#ebecf0',
    sectionHeader: '#5e6c84',
    
    overlay: 'rgba(9, 30, 66, 0.54)',
    modalBackground: '#ffffff',
  },
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
  colors: {
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
    
    headerBackground: '#1d2125',
    headerText: '#b6c2cf',
    
    sectionBackground: '#282e33',
    sectionHeader: '#9fadbc',
    
    overlay: 'rgba(0, 0, 0, 0.6)',
    modalBackground: '#22272b',
  },
  background: {
    type: 'solid',
    value: '#1d2125',
  },
};

// Nature theme (subtle forest/nature vibes)
const natureTheme: Theme = {
  name: 'nature',
  displayName: 'Nature',
  description: 'Calming forest-inspired theme',
  colors: {
    background: '#1a2f23',
    surface: '#1e3a2c',
    surfaceSecondary: '#234435',
    text: '#d4e5db',
    textSecondary: '#a8c5b4',
    textMuted: '#7a9d8a',
    border: '#3d5a4a',
    borderLight: '#4a6b58',
    
    primary: '#6bcf8e',
    primaryLight: '#1e3a2c',
    primaryDark: '#8fe0a8',
    
    success: '#6bcf8e',
    warning: '#e8c547',
    error: '#e57373',
    info: '#64b5f6',
    
    priorityCritical: '#e57373',
    priorityHigh: '#ffb74d',
    priorityMedium: '#e8c547',
    priorityLow: '#6bcf8e',
    
    cardBackground: 'rgba(30, 58, 44, 0.9)',
    cardBorder: '#3d5a4a',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    headerBackground: 'rgba(26, 47, 35, 0.95)',
    headerText: '#d4e5db',
    
    sectionBackground: 'rgba(35, 68, 53, 0.85)',
    sectionHeader: '#a8c5b4',
    
    overlay: 'rgba(0, 0, 0, 0.6)',
    modalBackground: '#1e3a2c',
  },
  background: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
    overlay: 'rgba(26, 47, 35, 0.85)',
  },
};

// Rick and Morty theme (fun sci-fi vibes)
const rickMortyTheme: Theme = {
  name: 'rickmorty',
  displayName: 'Sci-Fi Portal',
  description: 'Interdimensional fun theme',
  colors: {
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceSecondary: '#1f2b4d',
    text: '#e0e7ff',
    textSecondary: '#a5b4fc',
    textMuted: '#7c8adb',
    border: '#3d4a7a',
    borderLight: '#4a5a8a',
    
    primary: '#97f59b',
    primaryLight: '#1a2f23',
    primaryDark: '#b8ffbb',
    
    success: '#97f59b',
    warning: '#ffd93d',
    error: '#ff6b6b',
    info: '#74c0fc',
    
    priorityCritical: '#ff6b6b',
    priorityHigh: '#ffa94d',
    priorityMedium: '#ffd93d',
    priorityLow: '#97f59b',
    
    cardBackground: 'rgba(22, 33, 62, 0.9)',
    cardBorder: '#3d4a7a',
    cardShadow: 'rgba(151, 245, 155, 0.1)',
    
    headerBackground: 'rgba(26, 26, 46, 0.95)',
    headerText: '#e0e7ff',
    
    sectionBackground: 'rgba(31, 43, 77, 0.85)',
    sectionHeader: '#a5b4fc',
    
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#16213e',
  },
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    overlay: 'rgba(26, 26, 46, 0.3)',
  },
};

// Office LA theme (modern city vibes)
const officeTheme: Theme = {
  name: 'office',
  displayName: 'City View',
  description: 'Modern office with city skyline',
  colors: {
    background: '#1c1c28',
    surface: '#252532',
    surfaceSecondary: '#2d2d3d',
    text: '#e8e8f0',
    textSecondary: '#b8b8c8',
    textMuted: '#8888a0',
    border: '#404055',
    borderLight: '#505068',
    
    primary: '#ff9f43',
    primaryLight: '#2d2520',
    primaryDark: '#ffb86c',
    
    success: '#2ed573',
    warning: '#ffa502',
    error: '#ff4757',
    info: '#70a1ff',
    
    priorityCritical: '#ff4757',
    priorityHigh: '#ff6b81',
    priorityMedium: '#ffa502',
    priorityLow: '#2ed573',
    
    cardBackground: 'rgba(37, 37, 50, 0.9)',
    cardBorder: '#404055',
    cardShadow: 'rgba(255, 159, 67, 0.1)',
    
    headerBackground: 'rgba(28, 28, 40, 0.95)',
    headerText: '#e8e8f0',
    
    sectionBackground: 'rgba(45, 45, 61, 0.85)',
    sectionHeader: '#b8b8c8',
    
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#252532',
  },
  background: {
    type: 'image',
    value: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80',
    overlay: 'rgba(28, 28, 40, 0.88)',
  },
};

export const themes: Record<ThemeType, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  nature: natureTheme,
  rickmorty: rickMortyTheme,
  office: officeTheme,
};

export const getTheme = (themeName: ThemeType): Theme => {
  return themes[themeName] || themes.light;
};

export const themeList = Object.values(themes);

export default themes;
