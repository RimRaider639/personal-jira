import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, LinkingOptions, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/store/selectors';

import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { BoardListScreen } from '@/screens/BoardListScreen';
import { BoardScreen } from '@/screens/BoardScreen';
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';

/**
 * Navigation param list types
 */
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  BoardList: { openEpicId?: string } | undefined;
  Board: { boardId: string };
  TaskDetail: { taskId: string; boardId: string };
};

/**
 * Linking configuration for web URL navigation
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    // Add your production URL here
    'https://personal-jira-backend.vercel.app',
    // Local development
    'http://localhost:8081',
    'http://localhost:19006',
  ],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      BoardList: 'boards',
      Board: 'boards/:boardId',
      TaskDetail: 'boards/:boardId/tasks/:taskId',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Wrapper for BoardScreen to extract route params
 */
function BoardScreenWrapper({ 
  route, 
  navigation 
}: NativeStackScreenProps<RootStackParamList, 'Board'>): React.JSX.Element {
  const { boardId } = route.params;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('BoardList');
    }
  }, [navigation]);

  const handleTaskPress = useCallback((taskId: string) => {
    navigation.navigate('TaskDetail', { taskId, boardId });
  }, [navigation, boardId]);

  const handleEpicPress = useCallback((epicId: string) => {
    // Navigate to BoardList with the epic ID to open the epic modal
    navigation.navigate('BoardList', { openEpicId: epicId });
  }, [navigation]);

  return (
    <BoardScreen 
      boardId={boardId} 
      onBack={handleBack}
      onTaskPress={handleTaskPress}
      onEpicPress={handleEpicPress}
    />
  );
}

/**
 * Wrapper for TaskDetailScreen to extract route params
 */
function TaskDetailScreenWrapper({ 
  route, 
  navigation 
}: NativeStackScreenProps<RootStackParamList, 'TaskDetail'>): React.JSX.Element {
  const { taskId, boardId } = route.params;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Board', { boardId });
    }
  }, [navigation, boardId]);

  const handleDelete = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Board', { boardId });
    }
  }, [navigation, boardId]);

  return (
    <TaskDetailScreen 
      taskId={taskId}
      boardId={boardId}
      onBack={handleBack}
      onDelete={handleDelete}
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
      <Stack.Screen name="TaskDetail" component={TaskDetailScreenWrapper} />
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

  // Only use linking on web platform
  const linkingConfig = Platform.OS === 'web' ? linking : undefined;

  return (
    <NavigationContainer linking={linkingConfig}>
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
