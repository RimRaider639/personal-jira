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
const COLOR_MODE_STORAGE_KEY = '@kanban_color_mode'; // Sync with useColorMode hook

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

/**
 * Apply color mode to document for CSS theming
 */
function applyColorModeToDocument(isDark: boolean): void {
  if (typeof document === 'undefined') return;
  
  try {
    const mode = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  } catch (error) {
    console.warn('Failed to apply color mode to document:', error);
  }
}

/**
 * Persist color mode to both AsyncStorage and localStorage for cross-system sync
 */
async function persistColorMode(isDark: boolean): Promise<void> {
  const mode = isDark ? 'dark' : 'light';
  
  // Save to AsyncStorage (React Native)
  try {
    await AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, isDark.toString());
  } catch (error) {
    console.error('Failed to save dark mode to AsyncStorage:', error);
  }
  
  // Save to localStorage (Web) for useColorMode hook sync
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save color mode to localStorage:', error);
    }
  }
}

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
        
        let darkModeValue = false;
        
        // Check AsyncStorage first
        if (savedDarkMode !== null) {
          darkModeValue = savedDarkMode === 'true';
        } else if (typeof localStorage !== 'undefined') {
          // Fall back to localStorage for web
          const webColorMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
          if (webColorMode === 'dark') {
            darkModeValue = true;
          }
        }
        
        setIsDarkMode(darkModeValue);
        applyColorModeToDocument(darkModeValue);
        
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

  // Update themeName based on dark mode and apply to document
  useEffect(() => {
    setThemeName(isDarkMode ? 'dark' : 'light');
    applyColorModeToDocument(isDarkMode);
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
    await persistColorMode(isDark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    persistColorMode(newValue);
  }, [isDarkMode]);

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
