import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  themes, 
  getTheme, 
  getDecorativeTheme, 
  getBaseTheme,
  decorativeThemes,
  ThemeType, 
  DecorativeThemeType,
  Theme, 
  ThemeColors 
} from './index';

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
  getBoardTheme: (boardId: string) => DecorativeThemeType | null;
  setBoardTheme: (boardId: string, themeName: DecorativeThemeType | null) => void;
  getEffectiveTheme: (boardId?: string) => Theme;
  availableThemes: { name: ThemeType; displayName: string; description: string }[];
  decorativeThemeOptions: { name: DecorativeThemeType; displayName: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [themeName, setThemeName] = useState<ThemeType>('light');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [boardThemes, setBoardThemes] = useState<Record<string, DecorativeThemeType>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const [savedDarkMode, savedBoardThemes] = await Promise.all([
          AsyncStorage.getItem(DARK_MODE_STORAGE_KEY),
          AsyncStorage.getItem(BOARD_THEME_STORAGE_KEY),
        ]);
        
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

  // Update themeName based on dark mode
  useEffect(() => {
    setThemeName(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    // For backwards compatibility, setting light/dark theme also sets dark mode
    if (newTheme === 'dark') {
      setIsDarkMode(true);
    } else if (newTheme === 'light') {
      setIsDarkMode(false);
    }
    setThemeName(newTheme);
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

  const getBoardTheme = useCallback((boardId: string): DecorativeThemeType | null => {
    return boardThemes[boardId] || null;
  }, [boardThemes]);

  const setBoardTheme = useCallback(async (boardId: string, newTheme: DecorativeThemeType | null) => {
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

  // Get effective theme considering dark mode and board-specific decorative theme
  const getEffectiveTheme = useCallback((boardId?: string): Theme => {
    // Check for board-specific decorative theme
    if (boardId && boardThemes[boardId]) {
      return getDecorativeTheme(boardThemes[boardId], isDarkMode);
    }
    // Return base theme based on dark mode
    return getBaseTheme(isDarkMode);
  }, [boardThemes, isDarkMode]);

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

  const decorativeThemeOptions = useMemo(
    () =>
      decorativeThemes.map((t) => ({
        name: t.name,
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
      decorativeThemeOptions,
    }),
    [theme, themeName, colors, isDarkMode, setTheme, setDarkMode, toggleDarkMode, getBoardTheme, setBoardTheme, getEffectiveTheme, availableThemes, decorativeThemeOptions]
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
