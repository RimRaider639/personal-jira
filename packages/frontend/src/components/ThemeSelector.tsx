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
import { themes, ThemeType } from '@/theme';

/**
 * ThemeSelector - Component to select and preview themes
 */
export function ThemeSelector(): React.JSX.Element {
  const { colors, themeName, setTheme, availableThemes } = useTheme();
  const [visible, setVisible] = useState(false);

  const handleSelectTheme = useCallback(
    (name: ThemeType) => {
      setTheme(name);
      setVisible(false);
    },
    [setTheme]
  );

  const getThemePreviewColors = (name: ThemeType) => {
    const theme = themes[name];
    return {
      bg: theme.colors.background,
      surface: theme.colors.surface,
      primary: theme.colors.primary,
      text: theme.colors.text,
    };
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setVisible(true)}
        accessibilityLabel="Change theme"
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>🎨</Text>
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
          >
            <Text style={[styles.title, { color: colors.text, borderBottomColor: colors.borderLight }]}>
              Choose Theme
            </Text>

            <ScrollView style={styles.themeList} showsVerticalScrollIndicator={false}>
              {availableThemes.map((theme) => {
                const preview = getThemePreviewColors(theme.name);
                const isSelected = theme.name === themeName;

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
                    {/* Theme preview */}
                    <View style={[styles.preview, { backgroundColor: preview.bg }]}>
                      <View style={[styles.previewSurface, { backgroundColor: preview.surface }]}>
                        <View style={[styles.previewCard, { backgroundColor: preview.surface }]}>
                          <View style={[styles.previewAccent, { backgroundColor: preview.primary }]} />
                        </View>
                      </View>
                    </View>

                    {/* Theme info */}
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
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
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
    maxHeight: '80%',
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
  themeList: {
    padding: 16,
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
});

export default ThemeSelector;
