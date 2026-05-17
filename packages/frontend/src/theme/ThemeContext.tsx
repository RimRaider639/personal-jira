import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, getTheme, ThemeType, Theme, ThemeColors } from './index';

const THEME_STORAGE_KEY = '@kanban_theme';
const BOARD_THEME_STORAGE_KEY = '@kanban_board_themes';
const DARK_MODE_STORAGE_KEY = '@kanban_dark_mode';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeType;
  colors: ThemeColors;
  isDarkMode: boolean;
  setTheme: (themeName: ThemeType) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  getBoardTheme: (boardId: string) => ThemeType | null;
  setBoardTheme: (boardId: string, themeName: ThemeType | null) => void;
  getEffectiveTheme: (boardId?: string) => Theme;
  availableThemes: { name: ThemeType; displayName: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [themeName, setThemeName] = useState<ThemeType>('light');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [boardThemes, setBoardThemes] = useState<Record<string, ThemeType>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const [savedTheme, savedDarkMode, savedBoardThemes] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(DARK_MODE_STORAGE_KEY),
          AsyncStorage.getItem(BOARD_THEME_STORAGE_KEY),
        ]);
        
        if (savedTheme && themes[savedTheme as ThemeType]) {
          setThemeName(savedTheme as ThemeType);
        }
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }
        if (savedBoardThemes) {
          setBoardThemes(JSON.parse(savedBoardThemes));
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = useCallback(async (newTheme: ThemeType) => {
    setThemeName(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, []);

  const setDarkMode = useCallback(async (isDark: boolean) => {
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, isDark.toString());
    } catch (error) {
      console.error('Failed to save dark mode:', error);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  const getBoardTheme = useCallback((boardId: string): ThemeType | null => {
    return boardThemes[boardId] || null;
  }, [boardThemes]);

  const setBoardTheme = useCallback(async (boardId: string, newTheme: ThemeType | null) => {
    const newBoardThemes = { ...boardThemes };
    if (newTheme === null) {
      delete newBoardThemes[boardId];
    } else {
      newBoardThemes[boardId] = newTheme;
    }
    setBoardThemes(newBoardThemes);
    try {
      await AsyncStorage.setItem(BOARD_THEME_STORAGE_KEY, JSON.stringify(newBoardThemes));
    } catch (error) {
      console.error('Failed to save board theme:', error);
    }
  }, [boardThemes]);

  // Get effective theme considering dark mode and board-specific theme
  const getEffectiveTheme = useCallback((boardId?: string): Theme => {
    // Check for board-specific theme first
    if (boardId && boardThemes[boardId]) {
      return getTheme(boardThemes[boardId]);
    }
    // If dark mode is on, use dark theme, otherwise use selected theme
    if (isDarkMode) {
      return getTheme('dark');
    }
    return getTheme(themeName);
  }, [boardThemes, isDarkMode, themeName]);

  const theme = useMemo(() => getEffectiveTheme(), [getEffectiveTheme]);
  const colors = theme.colors;

  const availableThemes = useMemo(
    () =>
      Object.values(themes).map((t) => ({
        name: t.name as ThemeType,
        displayName: t.displayName,
        description: t.description,
      })),
    []
  );

  const value = useMemo(
    () => ({
      theme,
      themeName,
      colors,
      isDarkMode,
      setTheme,
      setDarkMode,
      toggleDarkMode,
      getBoardTheme,
      setBoardTheme,
      getEffectiveTheme,
      availableThemes,
    }),
    [theme, themeName, colors, isDarkMode, setTheme, setDarkMode, toggleDarkMode, getBoardTheme, setBoardTheme, getEffectiveTheme, availableThemes]
  );

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return <></>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
