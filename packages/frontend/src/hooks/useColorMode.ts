/**
 * Custom useColorMode hook with localStorage persistence
 * 
 * Provides color mode management for the application:
 * - Color mode persistence to localStorage
 * - Toggle functionality
 * - System color mode detection as fallback
 * - Integration with CSS class-based theming
 * 
 * Note: Chakra UI v3 uses next-themes for color mode, which isn't available
 * in this Expo/React Native Web project. This hook provides equivalent
 * functionality using localStorage and CSS class manipulation.
 * 
 * @see Requirements: 1.5, 5.6, 12.5
 */

import { useCallback, useEffect, useState, useMemo } from 'react';

/** Storage key for color mode preference */
const COLOR_MODE_STORAGE_KEY = '@kanban_color_mode';

/** Valid color mode values */
export type ColorMode = 'light' | 'dark';

/** Return type for the useColorMode hook */
export interface UseColorModeReturn {
  /** Current color mode ('light' or 'dark') */
  colorMode: ColorMode;
  /** Toggle between light and dark modes */
  toggleColorMode: () => void;
  /** Set a specific color mode */
  setColorMode: (mode: ColorMode) => void;
  /** Whether the current mode is dark */
  isDark: boolean;
  /** Whether the current mode is light */
  isLight: boolean;
}

/**
 * Detects the system's preferred color scheme
 * @returns 'dark' if system prefers dark mode, 'light' otherwise
 */
function getSystemColorMode(): ColorMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Retrieves the stored color mode from localStorage
 * Falls back to null if no stored value exists
 * @returns The stored color mode or null
 */
function getStoredColorMode(): ColorMode | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return null;
  } catch (error) {
    // localStorage might be unavailable (e.g., private browsing)
    console.warn('Failed to read color mode from localStorage:', error);
    return null;
  }
}

/**
 * Persists the color mode to localStorage
 * @param mode - The color mode to persist
 */
function persistColorMode(mode: ColorMode): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch (error) {
    // localStorage might be unavailable or full
    console.warn('Failed to persist color mode to localStorage:', error);
  }
}

/**
 * Applies the color mode to the document
 * Sets data-theme attribute and color-scheme CSS property
 * @param mode - The color mode to apply
 */
function applyColorModeToDocument(mode: ColorMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  try {
    // Set data-theme attribute for CSS selectors
    document.documentElement.setAttribute('data-theme', mode);
    
    // Set color-scheme for native browser styling
    document.documentElement.style.colorScheme = mode;
    
    // Add/remove dark class for Chakra UI v3 compatibility
    if (mode === 'dark') {
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
 * Gets the initial color mode from storage or system preference
 * @returns The initial color mode
 */
function getInitialColorMode(): ColorMode {
  const stored = getStoredColorMode();
  if (stored) {
    return stored;
  }
  return getSystemColorMode();
}

/**
 * Custom hook for managing color mode with localStorage persistence
 * 
 * This hook provides:
 * - Automatic persistence to localStorage
 * - System color mode detection as fallback
 * - Convenient boolean flags (isDark, isLight)
 * - Document attribute updates for CSS theming
 * 
 * @example
 * ```tsx
 * function ColorModeToggle() {
 *   const { colorMode, toggleColorMode, isDark } = useColorMode();
 *   
 *   return (
 *     <IconButton
 *       aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
 *       onClick={toggleColorMode}
 *     >
 *       {isDark ? <SunIcon /> : <MoonIcon />}
 *     </IconButton>
 *   );
 * }
 * ```
 * 
 * @returns Object containing color mode state and control functions
 */
export function useColorMode(): UseColorModeReturn {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    // Initialize with stored/system preference
    // This runs only on the client after hydration
    if (typeof window !== 'undefined') {
      return getInitialColorMode();
    }
    return 'light';
  });
  
  // Apply color mode to document on mount and when it changes
  useEffect(() => {
    applyColorModeToDocument(colorMode);
  }, [colorMode]);
  
  // Initialize from storage on mount (handles SSR hydration)
  useEffect(() => {
    const initialMode = getInitialColorMode();
    if (initialMode !== colorMode) {
      setColorModeState(initialMode);
    }
    // Apply immediately on mount
    applyColorModeToDocument(initialMode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Listen for system color mode changes (only if no stored preference)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let mediaQuery: MediaQueryList;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }
    
    const handleChange = (event: MediaQueryListEvent) => {
      // Only follow system preference if user hasn't set a preference
      const storedMode = getStoredColorMode();
      if (storedMode === null) {
        const newMode: ColorMode = event.matches ? 'dark' : 'light';
        setColorModeState(newMode);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  /**
   * Sets the color mode and persists it to localStorage
   */
  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    persistColorMode(mode);
  }, []);
  
  /**
   * Toggles between light and dark modes
   */
  const toggleColorMode = useCallback(() => {
    setColorModeState((prevMode) => {
      const newMode: ColorMode = prevMode === 'dark' ? 'light' : 'dark';
      persistColorMode(newMode);
      return newMode;
    });
  }, []);
  
  // Memoize the return value to prevent unnecessary re-renders
  const returnValue = useMemo<UseColorModeReturn>(() => ({
    colorMode,
    toggleColorMode,
    setColorMode,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light',
  }), [colorMode, toggleColorMode, setColorMode]);
  
  return returnValue;
}

/**
 * Hook to get a value based on the current color mode
 * 
 * @param lightValue - Value to use in light mode
 * @param darkValue - Value to use in dark mode
 * @returns The appropriate value based on current color mode
 * 
 * @example
 * ```tsx
 * const bgColor = useColorModeValue('white', 'gray.800');
 * const textColor = useColorModeValue('gray.800', 'white');
 * ```
 */
export function useColorModeValue<T>(lightValue: T, darkValue: T): T {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? darkValue : lightValue;
}

export default useColorMode;
