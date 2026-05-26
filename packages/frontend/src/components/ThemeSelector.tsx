import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { decorativeThemes, DecorativeThemeType } from '@/theme';
import { PaletteIcon } from '@/theme/icons';

interface ThemeSelectorProps {
  boardId?: string; // If provided, allows setting board-specific theme
  showDarkModeOnly?: boolean; // If true, only show dark mode toggle (for global header)
}

/**
 * DarkModeToggle - Simple dark mode toggle button for global header
 */
export function DarkModeToggle(): React.JSX.Element {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.darkModeButton, { backgroundColor: isDarkMode ? colors.primary : 'rgba(255,255,255,0.2)' }]}
      onPress={toggleDarkMode}
      accessibilityLabel={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="button"
    >
      <Text style={styles.darkModeIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
    </TouchableOpacity>
  );
}

/**
 * BoardThemeSelector - Theme selector specifically for board view
 * Shows decorative themes that have light/dark variants
 */
export function BoardThemeSelector({ boardId }: { boardId: string }): React.JSX.Element {
  const { colors, isDarkMode, getBoardTheme, setBoardTheme, decorativeThemeOptions } = useTheme();
  const [visible, setVisible] = useState(false);

  const currentBoardTheme = getBoardTheme(boardId);

  const handleSelectTheme = useCallback(
    (name: DecorativeThemeType) => {
      if (name === 'default') {
        setBoardTheme(boardId, null);
      } else {
        setBoardTheme(boardId, name);
      }
    },
    [boardId, setBoardTheme]
  );

  const handleClearBoardTheme = useCallback(() => {
    setBoardTheme(boardId, null);
  }, [boardId, setBoardTheme]);

  const getThemePreviewColors = (name: DecorativeThemeType) => {
    const theme = decorativeThemes.find(t => t.name === name);
    if (!theme) return { bg: colors.background, surface: colors.surface, primary: colors.primary };
    const variant = isDarkMode ? theme.dark : theme.light;
    return {
      bg: variant.colors.background,
      surface: variant.colors.surface,
      primary: variant.colors.primary,
    };
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
        onPress={() => setVisible(true)}
        accessibilityLabel="Change board theme"
        accessibilityRole="button"
      >
        <PaletteIcon size={18} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.title, { color: colors.text, borderBottomColor: colors.borderLight }]}>
              Board Theme
            </Text>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Current theme notice */}
              {currentBoardTheme && (
                <View style={[styles.boardThemeNotice, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.boardThemeText, { color: colors.primary }]}>
                    Custom theme active
                  </Text>
                  <TouchableOpacity onPress={handleClearBoardTheme}>
                    <Text style={[styles.clearThemeText, { color: colors.error }]}>Reset</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                Themes adapt to your global light/dark mode setting
              </Text>

              {/* Theme options */}
              {decorativeThemeOptions.map((theme) => {
                const preview = getThemePreviewColors(theme.name);
                const isSelected = theme.name === 'default' 
                  ? !currentBoardTheme 
                  : currentBoardTheme === theme.name;

                return (
                  <TouchableOpacity
                    key={theme.name}
                    style={[
                      styles.themeOption,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => handleSelectTheme(theme.name)}
                  >
                    <View style={[styles.preview, { backgroundColor: preview.bg }]}>
                      <View style={[styles.previewSurface, { backgroundColor: preview.surface }]}>
                        <View style={[styles.previewCard, { backgroundColor: preview.surface }]}>
                          <View style={[styles.previewAccent, { backgroundColor: preview.primary }]} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.themeInfo}>
                      <View style={styles.themeHeader}>
                        <Text style={[styles.themeName, { color: colors.text }]}>
                          {theme.displayName}
                        </Text>
                        {isSelected && (
                          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                        )}
                      </View>
                      <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                        {theme.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * ThemeSelector - Legacy component for backwards compatibility
 * @deprecated Use DarkModeToggle for global header, BoardThemeSelector for board view
 */
export function ThemeSelector({ boardId, showDarkModeOnly }: ThemeSelectorProps): React.JSX.Element {
  if (showDarkModeOnly || !boardId) {
    return <DarkModeToggle />;
  }
  return <BoardThemeSelector boardId={boardId} />;
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
  },
  darkModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkModeIcon: {
    fontSize: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    padding: 20,
    borderBottomWidth: 1,
  },
  content: {
    padding: 16,
    maxHeight: 400,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  darkModeInfo: {
    flex: 1,
  },
  darkModeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  darkModeHint: {
    fontSize: 12,
    marginTop: 2,
  },
  boardThemeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  boardThemeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearThemeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  preview: {
    width: 60,
    height: 45,
    borderRadius: 6,
    padding: 4,
    overflow: 'hidden',
  },
  previewSurface: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
  },
  previewCard: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  previewAccent: {
    height: 3,
  },
  themeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  themeDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  doneButton: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ThemeSelector;
