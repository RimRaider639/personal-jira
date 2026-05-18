import React from 'react';
import { View, StyleSheet, ImageBackground, Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface ThemedBackgroundProps {
  children: React.ReactNode;
  boardId?: string;
}

/**
 * ThemedBackground - Renders the appropriate background based on current theme
 * Supports solid colors, gradients, and images with overlays
 * If boardId is provided, uses the board-specific theme
 */
export function ThemedBackground({ children, boardId }: ThemedBackgroundProps): React.JSX.Element {
  const { colors, getEffectiveTheme } = useTheme();
  
  // Get board-specific theme if boardId is provided
  const theme = boardId ? getEffectiveTheme(boardId) : getEffectiveTheme();
  const { background } = theme;

  // For solid backgrounds
  if (background.type === 'solid') {
    return (
      <View style={[styles.container, { backgroundColor: background.value }]}>
        {children}
      </View>
    );
  }

  // For gradient backgrounds (web only with CSS)
  if (background.type === 'gradient') {
    if (Platform.OS === 'web') {
      return (
        <View
          style={[
            styles.container,
            {
              // @ts-ignore - web-specific style
              background: background.value,
            },
          ]}
        >
          {background.overlay && (
            <View style={[styles.overlay, { backgroundColor: background.overlay }]} />
          )}
          <View style={styles.content}>{children}</View>
        </View>
      );
    }
    // Fallback for native - use primary background color
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {children}
      </View>
    );
  }

  // For image backgrounds
  if (background.type === 'image') {
    return (
      <ImageBackground
        source={{ uri: background.value }}
        style={styles.container}
        resizeMode="cover"
      >
        {background.overlay && (
          <View style={[styles.overlay, { backgroundColor: background.overlay }]} />
        )}
        <View style={styles.content}>{children}</View>
      </ImageBackground>
    );
  }

  // Default fallback
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});

export default ThemedBackground;
