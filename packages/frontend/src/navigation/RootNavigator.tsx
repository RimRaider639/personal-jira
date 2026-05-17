import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/store/selectors';

import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { BoardListScreen } from '@/screens/BoardListScreen';

/**
 * Navigation param list types
 */
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  BoardList: undefined;
  Board: { boardId: string };
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth Navigator - Handles login and registration screens
 */
function AuthNavigator(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register'>('login');

  const navigateToRegister = useCallback(() => {
    setCurrentScreen('register');
  }, []);

  const navigateToLogin = useCallback(() => {
    setCurrentScreen('login');
  }, []);

  // Simple screen switching without full navigation for auth flow
  if (currentScreen === 'register') {
    return <RegisterScreen onNavigateToLogin={navigateToLogin} />;
  }

  return <LoginScreen onNavigateToRegister={navigateToRegister} />;
}

/**
 * Main Navigator - Handles authenticated user screens
 */
function MainNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen name="BoardList" component={BoardListScreen} />
      {/* Additional screens will be added in later tasks */}
    </Stack.Navigator>
  );
}

/**
 * Root Navigator component.
 * Handles authentication state and renders appropriate navigator.
 *
 * Requirements:
 * - 18.5: Implement logout functionality
 * - 18.6: Persist authentication state across app restarts
 */
export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
