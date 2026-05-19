/**
 * ToastProvider Component
 *
 * A provider component that wraps the application with toast notification support.
 * This component renders the Toaster component from useToast.tsx at the application
 * level, ensuring toast notifications are available throughout the app.
 *
 * Accessibility Features (Requirement 18.5):
 * - The Toaster component configures aria-live regions for screen reader announcements
 * - Error and warning toasts use aria-live="assertive" for immediate announcement
 * - Success and info toasts use aria-live="polite" to not interrupt current speech
 * - All toasts include role="status" and aria-atomic="true" for proper screen reader support
 *
 * Usage:
 * ```tsx
 * // In App.tsx or root component
 * import { ToastProvider } from '@/components/chakra';
 *
 * function App() {
 *   return (
 *     <ChakraProvider>
 *       <ToastProvider>
 *         <YourApp />
 *       </ToastProvider>
 *     </ChakraProvider>
 *   );
 * }
 * ```
 *
 * @see Requirements: 11.1, 18.5
 */

import React from 'react';
import { Toaster } from '../../hooks/useToast';

/** Props for the ToastProvider component */
export interface ToastProviderProps {
  /** Child components that will have access to toast notifications */
  children: React.ReactNode;
}

/**
 * ToastProvider component that wraps the application with toast notification support.
 *
 * This component:
 * - Renders the Toaster component which displays toast notifications
 * - Configures aria-live regions for screen reader announcements (Requirement 18.5)
 * - Should be placed near the root of the application, inside ChakraProvider
 *
 * The Toaster uses a Portal to render toasts outside the normal DOM hierarchy,
 * ensuring they appear above all other content and are properly announced to
 * screen readers via aria-live regions.
 *
 * Aria-live Configuration:
 * - Error/Warning toasts: aria-live="assertive" (immediate announcement)
 * - Success/Info toasts: aria-live="polite" (waits for current speech to finish)
 * - All toasts: role="status", aria-atomic="true"
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns The wrapped children with toast notification support
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ChakraProvider theme={customTheme}>
 *       <Provider store={store}>
 *         <ToastProvider>
 *           <RootNavigator />
 *         </ToastProvider>
 *       </Provider>
 *     </ChakraProvider>
 *   );
 * }
 * ```
 *
 * @see Requirements: 11.1, 18.5
 */
export function ToastProvider({ children }: ToastProviderProps): React.JSX.Element {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

export default ToastProvider;
