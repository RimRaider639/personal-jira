import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { Section, Epic } from '@kanban/shared';

interface TaskCardMenuProps {
  taskId: string;
  currentSectionId: string;
  sections: Section[];
  epics: Epic[];
  taskEpicIds: string[];
  isPinned?: boolean;
  onMove: (taskId: string, newSectionId: string) => void;
  onToggleEpic: (taskId: string, epicId: string) => void;
  onTogglePin?: (taskId: string) => void;
}

type MenuView = 'main' | 'move' | 'epics';

/**
 * TaskCardMenu - Localized context menu for quick task actions
 * Opens right where the 3-dots button is positioned
 */
export function TaskCardMenu({
  taskId,
  currentSectionId,
  sections,
  epics,
  taskEpicIds,
  isPinned = false,
  onMove,
  onToggleEpic,
  onTogglePin,
}: TaskCardMenuProps): React.JSX.Element {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>('main');
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<View>(null);

  const handleMenuPress = useCallback((e: any) => {
    e.stopPropagation();
    
    // Measure button position to place menu nearby
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
      
      // Position menu below the button, aligned to the right
      let top = y + height + 4;
      let right = screenWidth - x - width;
      
      // Ensure menu doesn't go off screen
      if (top + 200 > screenHeight) {
        top = y - 200; // Show above if not enough space below
      }
      if (right < 10) {
        right = 10;
      }
      
      setMenuPosition({ top, right });
      setMenuView('main');
      setMenuVisible(true);
    });
  }, []);

  const handleMoveToSection = useCallback(
    (sectionId: string) => {
      if (sectionId !== currentSectionId) {
        onMove(taskId, sectionId);
      }
      setMenuVisible(false);
    },
    [taskId, currentSectionId, onMove]
  );

  const handleToggleEpic = useCallback(
    (epicId: string) => {
      onToggleEpic(taskId, epicId);
    },
    [taskId, onToggleEpic]
  );

  const handleTogglePin = useCallback(() => {
    if (onTogglePin) {
      onTogglePin(taskId);
    }
    setMenuVisible(false);
  }, [taskId, onTogglePin]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setMenuView('main');
  }, []);

  const otherSections = sections.filter((s) => s.id !== currentSectionId);

  const renderMainMenu = () => (
    <>
      {onTogglePin && (
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
          onPress={handleTogglePin}
        >
          <Text style={[styles.menuItemIcon]}>{isPinned ? '📌' : '📍'}</Text>
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            {isPinned ? 'Unpin from Board' : 'Pin to Board'}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
        onPress={() => setMenuView('move')}
      >
        <Text style={[styles.menuItemIcon]}>↗</Text>
        <Text style={[styles.menuItemText, { color: colors.text }]}>Move to Section</Text>
        <Text style={[styles.menuItemArrow, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
        onPress={() => setMenuView('epics')}
      >
        <Text style={[styles.menuItemIcon]}>🏷</Text>
        <Text style={[styles.menuItemText, { color: colors.text }]}>Change Epic</Text>
        <Text style={[styles.menuItemArrow, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>
    </>
  );

  const renderMoveMenu = () => (
    <>
      <TouchableOpacity
        style={[styles.menuHeader, { borderBottomColor: colors.borderLight }]}
        onPress={() => setMenuView('main')}
      >
        <Text style={[styles.menuHeaderArrow, { color: colors.primary }]}>‹</Text>
        <Text style={[styles.menuHeaderText, { color: colors.textSecondary }]}>Move to Section</Text>
      </TouchableOpacity>
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
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No other sections</Text>
      )}
    </>
  );

  const renderEpicsMenu = () => (
    <>
      <TouchableOpacity
        style={[styles.menuHeader, { borderBottomColor: colors.borderLight }]}
        onPress={() => setMenuView('main')}
      >
        <Text style={[styles.menuHeaderArrow, { color: colors.primary }]}>‹</Text>
        <Text style={[styles.menuHeaderText, { color: colors.textSecondary }]}>Change Epic</Text>
      </TouchableOpacity>
      {epics.length > 0 ? (
        epics.map((epic) => {
          const isAssigned = taskEpicIds.includes(epic.id);
          return (
            <TouchableOpacity
              key={epic.id}
              style={[
                styles.menuItem,
                { borderBottomColor: colors.borderLight },
                isAssigned && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => handleToggleEpic(epic.id)}
            >
              <View style={[styles.epicDot, { backgroundColor: epic.color }]} />
              <Text style={[styles.menuItemText, { color: colors.text, flex: 1 }]}>{epic.name}</Text>
              {isAssigned && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
            </TouchableOpacity>
          );
        })
      ) : (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No epics available</Text>
      )}
    </>
  );

  return (
    <>
      {/* Three dots button */}
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Task menu"
          accessibilityRole="button"
        >
          <Text style={[styles.menuDots, { color: colors.textMuted }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Localized menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <Pressable
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                top: menuPosition.top,
                right: menuPosition.right,
              },
            ]}
          >
            {menuView === 'main' && renderMainMenu()}
            {menuView === 'move' && renderMoveMenu()}
            {menuView === 'epics' && renderEpicsMenu()}
          </Pressable>
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
  },
  menuContainer: {
    position: 'absolute',
    minWidth: 200,
    maxWidth: 280,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  menuHeaderArrow: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: '300',
  },
  menuHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 18,
    marginLeft: 'auto',
  },
  epicDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    padding: 14,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TaskCardMenu;
