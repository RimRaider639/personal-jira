/**
 * Tests for useColorMode hook
 * 
 * Tests localStorage persistence, toggle functionality,
 * and system color mode detection.
 * 
 * @see Requirements: 1.5, 5.6, 12.5
 */

import { renderHook, act } from '@testing-library/react-native';
import { useColorMode, useColorModeValue } from '../useColorMode';

// Storage key used by the hook
const COLOR_MODE_STORAGE_KEY = '@kanban_color_mode';

describe('useColorMode', () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string };
  
  // Mock matchMedia
  let matchMediaMock: jest.Mock;
  let mediaQueryListeners: ((event: MediaQueryListEvent) => void)[];
  
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });
    
    // Reset matchMedia mock
    mediaQueryListeners = [];
    matchMediaMock = jest.fn().mockImplementation((query: string) => ({
      matches: false, // Default to light mode
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners.push(listener);
        }
      }),
      removeEventListener: jest.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          const index = mediaQueryListeners.indexOf(listener);
          if (index > -1) {
            mediaQueryListeners.splice(index, 1);
          }
        }
      }),
      dispatchEvent: jest.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });
    
    // Mock document methods
    Object.defineProperty(document.documentElement, 'setAttribute', {
      value: jest.fn(),
      writable: true,
    });
    
    Object.defineProperty(document.documentElement.style, 'colorScheme', {
      value: '',
      writable: true,
    });
    
    Object.defineProperty(document.documentElement.classList, 'add', {
      value: jest.fn(),
      writable: true,
    });
    
    Object.defineProperty(document.documentElement.classList, 'remove', {
      value: jest.fn(),
      writable: true,
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initial state', () => {
    it('should default to light mode when no stored preference and system prefers light', () => {
      const { result } = renderHook(() => useColorMode());
      
      expect(result.current.colorMode).toBe('light');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
    });
    
    it('should use stored preference from localStorage', () => {
      localStorageMock[COLOR_MODE_STORAGE_KEY] = 'dark';
      
      const { result } = renderHook(() => useColorMode());
      
      expect(result.current.colorMode).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);
    });
    
    it('should use system preference when no stored preference', () => {
      // Mock system dark mode preference
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));
      
      const { result } = renderHook(() => useColorMode());
      
      expect(result.current.colorMode).toBe('dark');
    });
  });
  
  describe('toggleColorMode', () => {
    it('should toggle from light to dark mode', () => {
      const { result } = renderHook(() => useColorMode());
      
      expect(result.current.colorMode).toBe('light');
      
      act(() => {
        result.current.toggleColorMode();
      });
      
      expect(result.current.colorMode).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });
    
    it('should toggle from dark to light mode', () => {
      localStorageMock[COLOR_MODE_STORAGE_KEY] = 'dark';
      
      const { result } = renderHook(() => useColorMode());
      
      expect(result.current.colorMode).toBe('dark');
      
      act(() => {
        result.current.toggleColorMode();
      });
      
      expect(result.current.colorMode).toBe('light');
      expect(result.current.isLight).toBe(true);
    });
    
    it('should persist toggled mode to localStorage', () => {
      const { result } = renderHook(() => useColorMode());
      
      act(() => {
        result.current.toggleColorMode();
      });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        COLOR_MODE_STORAGE_KEY,
        'dark'
      );
    });
  });
  
  describe('setColorMode', () => {
    it('should set color mode to dark', () => {
      const { result } = renderHook(() => useColorMode());
      
      act(() => {
        result.current.setColorMode('dark');
      });
      
      expect(result.current.colorMode).toBe('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        COLOR_MODE_STORAGE_KEY,
        'dark'
      );
    });
    
    it('should set color mode to light', () => {
      localStorageMock[COLOR_MODE_STORAGE_KEY] = 'dark';
      
      const { result } = renderHook(() => useColorMode());
      
      act(() => {
        result.current.setColorMode('light');
      });
      
      expect(result.current.colorMode).toBe('light');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        COLOR_MODE_STORAGE_KEY,
        'light'
      );
    });
  });
  
  describe('persistence', () => {
    it('should persist color mode across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useColorMode());
      
      act(() => {
        result.current.setColorMode('dark');
      });
      
      rerender({});
      
      expect(result.current.colorMode).toBe('dark');
    });
    
    it('should read persisted value on mount', () => {
      // Set up localStorage before mounting
      localStorageMock[COLOR_MODE_STORAGE_KEY] = 'dark';
      
      const { result } = renderHook(() => useColorMode());
      
      expect(result.current.colorMode).toBe('dark');
      expect(localStorage.getItem).toHaveBeenCalledWith(COLOR_MODE_STORAGE_KEY);
    });
  });
  
  describe('document updates', () => {
    it('should set data-theme attribute on document', () => {
      renderHook(() => useColorMode());
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-theme',
        'light'
      );
    });
    
    it('should update document when color mode changes', () => {
      const { result } = renderHook(() => useColorMode());
      
      act(() => {
        result.current.setColorMode('dark');
      });
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-theme',
        'dark'
      );
    });
  });
  
  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Make localStorage throw an error
      (localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw
      expect(() => {
        renderHook(() => useColorMode());
      }).not.toThrow();
    });
    
    it('should handle localStorage setItem errors gracefully', () => {
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const { result } = renderHook(() => useColorMode());
      
      // Should not throw
      expect(() => {
        act(() => {
          result.current.toggleColorMode();
        });
      }).not.toThrow();
    });
  });
});

describe('useColorModeValue', () => {
  let localStorageMock: { [key: string]: string };
  
  beforeEach(() => {
    localStorageMock = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
      },
      writable: true,
    });
    
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
      writable: true,
    });
    
    Object.defineProperty(document.documentElement, 'setAttribute', {
      value: jest.fn(),
      writable: true,
    });
    
    Object.defineProperty(document.documentElement.style, 'colorScheme', {
      value: '',
      writable: true,
    });
    
    Object.defineProperty(document.documentElement.classList, 'add', {
      value: jest.fn(),
      writable: true,
    });
    
    Object.defineProperty(document.documentElement.classList, 'remove', {
      value: jest.fn(),
      writable: true,
    });
  });
  
  it('should return light value when in light mode', () => {
    const { result } = renderHook(() => useColorModeValue('white', 'black'));
    
    expect(result.current).toBe('white');
  });
  
  it('should return dark value when in dark mode', () => {
    localStorageMock[COLOR_MODE_STORAGE_KEY] = 'dark';
    
    const { result } = renderHook(() => useColorModeValue('white', 'black'));
    
    expect(result.current).toBe('black');
  });
  
  it('should work with complex values', () => {
    const lightTheme = { bg: 'white', text: 'black' };
    const darkTheme = { bg: 'black', text: 'white' };
    
    const { result } = renderHook(() => useColorModeValue(lightTheme, darkTheme));
    
    expect(result.current).toEqual(lightTheme);
  });
});
