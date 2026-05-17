import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, getTheme, ThemeType, Theme, ThemeColors } from './index';

const THEME_STORAGE_KEY = '@kanban_theme';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeType;
  colors: ThemeColors;
  setTheme: (themeName: ThemeType) => void;
  availableThemes: { name: ThemeType; displayName: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [themeName, setThemeName] = useState<ThemeType>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && themes[savedTheme as ThemeType]) {
          setThemeName(savedTheme as ThemeType);
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

  const theme = useMemo(() => getTheme(themeName), [themeName]);
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
      setTheme,
      availableThemes,
    }),
    [theme, themeName, colors, setTheme, availableThemes]
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
