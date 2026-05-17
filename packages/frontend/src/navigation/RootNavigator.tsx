import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/store/selectors';

import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { BoardListScreen } from '@/screens/BoardListScreen';
import { BoardScreen } from '@/screens/BoardScreen';

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
 * Wrapper for BoardScreen to extract route params
 */
function BoardScreenWrapper({ 
  route, 
  navigation 
}: NativeStackScreenProps<RootStackParamList, 'Board'>): React.JSX.Element {
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleTaskPress = useCallback((taskId: string) => {
    // TODO: Navigate to TaskDetail screen
    console.log('Task pressed:', taskId);
  }, []);

  return (
    <BoardScreen 
      boardId={route.params.boardId} 
      onBack={handleBack}
      onTaskPress={handleTaskPress}
    />
  );
}

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
      <Stack.Screen name="Board" component={BoardScreenWrapper} />
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
