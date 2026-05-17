import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { Section } from '@kanban/shared';

interface TaskCardMenuProps {
  taskId: string;
  currentSectionId: string;
  sections: Section[];
  onMove: (taskId: string, newSectionId: string) => void;
}

/**
 * TaskCardMenu - Three dots menu for quick task actions
 */
export function TaskCardMenu({
  taskId,
  currentSectionId,
  sections,
  onMove,
}: TaskCardMenuProps): React.JSX.Element {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [moveMenuVisible, setMoveMenuVisible] = useState(false);

  const handleMenuPress = useCallback((e: any) => {
    e.stopPropagation();
    setMenuVisible(true);
  }, []);

  const handleMovePress = useCallback(() => {
    setMenuVisible(false);
    setMoveMenuVisible(true);
  }, []);

  const handleMoveToSection = useCallback(
    (sectionId: string) => {
      if (sectionId !== currentSectionId) {
        onMove(taskId, sectionId);
      }
      setMoveMenuVisible(false);
    },
    [taskId, currentSectionId, onMove]
  );

  const closeMenus = useCallback(() => {
    setMenuVisible(false);
    setMoveMenuVisible(false);
  }, []);

  const otherSections = sections.filter((s) => s.id !== currentSectionId);

  return (
    <>
      {/* Three dots button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleMenuPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Task menu"
        accessibilityRole="button"
      >
        <Text style={[styles.menuDots, { color: colors.textMuted }]}>⋮</Text>
      </TouchableOpacity>

      {/* Main menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenus}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenus}>
          <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
              onPress={handleMovePress}
            >
              <Text style={[styles.menuItemText, { color: colors.text }]}>↗ Move to...</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Move to section modal */}
      <Modal
        visible={moveMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenus}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenus}>
          <View style={[styles.menuContainer, styles.moveMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.menuTitle, { color: colors.textSecondary, borderBottomColor: colors.borderLight }]}>
              Move to section
            </Text>
            {otherSections.length > 0 ? (
              otherSections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => handleMoveToSection(section.id)}
                >
                  <Text style={[styles.menuItemText, { color: colors.text }]}>{section.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noSections, { color: colors.textMuted }]}>No other sections</Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 4,
    marginLeft: 4,
  },
  menuDots: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  moveMenu: {
    maxHeight: 300,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    padding: 12,
    borderBottomWidth: 1,
  },
  menuItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noSections: {
    padding: 14,
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default TaskCardMenu;
