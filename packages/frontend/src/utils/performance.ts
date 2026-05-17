/**
 * Performance utilities for the Kanban frontend
 *
 * Requirements:
 * - 13.2: Ensure transitions complete within 300ms
 * - 13.5: Optimize re-renders
 * - 15.2: Ensure API responses under 200ms (p95)
 */

import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Debounce a value - useful for search inputs
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default 300ms)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Throttle a callback function - useful for scroll handlers
 * @param callback - The function to throttle
 * @param limit - Minimum time between calls in milliseconds (default 100ms)
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number = 100
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= limit) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule a trailing call
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, limit - timeSinceLastRun);
      }
    }) as T,
    [limit]
  );
}

/**
 * Measure render performance in development
 * @param componentName - Name of the component for logging
 */
export function useRenderCount(componentName: string): void {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (__DEV__) {
      console.log(`[Performance] ${componentName} rendered ${renderCount.current} times`);
    }
  });
}

/**
 * Track component mount/unmount timing
 * @param componentName - Name of the component for logging
 */
export function useMountTiming(componentName: string): void {
  useEffect(() => {
    const mountTime = performance.now();
    if (__DEV__) {
      console.log(`[Performance] ${componentName} mounted at ${mountTime.toFixed(2)}ms`);
    }

    return () => {
      const unmountTime = performance.now();
      const duration = unmountTime - mountTime;
      if (__DEV__) {
        console.log(
          `[Performance] ${componentName} unmounted after ${duration.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);
}

/**
 * Batch multiple state updates to reduce re-renders
 * React 18+ automatically batches, but this is useful for async operations
 */
export function batchUpdates(callback: () => void): void {
  // In React 18+, updates are automatically batched
  // This is a no-op wrapper for compatibility
  callback();
}

/**
 * Create a stable callback reference that doesn't change between renders
 * but always calls the latest version of the callback
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Constants for performance targets
 */
export const PERFORMANCE_TARGETS = {
  /** Maximum time for UI transitions (ms) */
  TRANSITION_MAX_MS: 300,
  /** Maximum time for API responses (ms) */
  API_RESPONSE_MAX_MS: 200,
  /** Debounce delay for search input (ms) */
  SEARCH_DEBOUNCE_MS: 500,
  /** Throttle limit for scroll handlers (ms) */
  SCROLL_THROTTLE_MS: 100,
  /** Maximum items before virtualization is recommended */
  VIRTUALIZATION_THRESHOLD: 50,
} as const;
