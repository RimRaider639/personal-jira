import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView, enableExperimentalWebImplementation } from 'react-native-gesture-handler';
import { ChakraProvider } from '@chakra-ui/react';

import { store, persistor } from '@/store';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { system } from '@/theme/chakraTheme';
import { setupApiInterceptors } from '@/services/api';

// Enable experimental web implementation for gesture handler
// This is required for drag and drop to work on web
enableExperimentalWebImplementation(true);

/**
 * ChakraColorModeSync - Syncs the app's theme context with Chakra's color mode
 * This ensures consistent theming across all components
 */
function ChakraColorModeSync({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Sync with document for Chakra UI color mode
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDarkMode) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
        root.setAttribute('data-theme', 'light');
      }
    }
  }, [isDarkMode]);

  return <>{children}</>;
}

/**
 * Main App component - Entry point for the Personal Kanban Board application.
 * Provides Redux store, persistence, safe area context, theme support, and navigation structure
 * for both web and Android.
 */
export default function App(): React.JSX.Element {
  // Setup API interceptors for handling auth errors
  useEffect(() => {
    setupApiInterceptors(store);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ChakraProvider value={system}>
            <ThemeProvider>
              <ChakraColorModeSync>
                <SafeAreaProvider>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </SafeAreaProvider>
              </ChakraColorModeSync>
            </ThemeProvider>
          </ChakraProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
