import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { FiKey, FiLogOut } from 'react-icons/fi';
import { useTheme } from '@/theme/ThemeContext';

interface ProfileAvatarProps {
  displayName: string;
  onLogout: () => void;
  onChangePassword?: () => void;
}

/**
 * ProfileAvatar - Circular avatar with user initials and dropdown menu
 */
export function ProfileAvatar({
  displayName,
  onLogout,
  onChangePassword,
}: ProfileAvatarProps): React.JSX.Element {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const avatarRef = useRef<View>(null);

  // Get initials from display name
  const initials = displayName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Generate a consistent color based on the name
  const getAvatarColor = (name: string): string => {
    const avatarColors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const avatarColor = getAvatarColor(displayName);

  const handleAvatarPress = useCallback(() => {
    if (Platform.OS === 'web' && avatarRef.current) {
      // On web, measure the avatar position for dropdown placement
      (avatarRef.current as any).measureInWindow?.((x: number, y: number, width: number, height: number) => {
        setMenuPosition({ top: y + height + 8, right: window.innerWidth - x - width });
        setMenuVisible(true);
      });
    } else {
      setMenuVisible(true);
    }
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleLogout = useCallback(() => {
    setMenuVisible(false);
    onLogout();
  }, [onLogout]);

  const handleChangePassword = useCallback(() => {
    setMenuVisible(false);
    onChangePassword?.();
  }, [onChangePassword]);

  return (
    <>
      <TouchableOpacity
        ref={avatarRef as any}
        style={[styles.avatar, { backgroundColor: avatarColor }]}
        onPress={handleAvatarPress}
        accessibilityRole="button"
        accessibilityLabel={`Profile menu for ${displayName}`}
      >
        <Text style={styles.initials}>{initials || '?'}</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={handleMenuClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleMenuClose}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Platform.OS === 'web' && { position: 'absolute', top: menuPosition.top, right: menuPosition.right },
            ]}
          >
            {/* User info header */}
            <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.menuAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.menuInitials}>{initials || '?'}</Text>
              </View>
              <Text style={[styles.menuDisplayName, { color: colors.text }]} numberOfLines={1}>
                {displayName}
              </Text>
            </View>

            {/* Menu items */}
            <View style={styles.menuItems}>
              {onChangePassword && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleChangePassword}
                >
                  <View style={styles.menuItemIcon}>
                    <FiKey size={16} color={colors.text} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Change Password</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
              >
                <View style={styles.menuItemIcon}>
                  <FiLogOut size={16} color={colors.error} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.error }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
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
    padding: 16,
    borderBottomWidth: 1,
  },
  menuAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuInitials: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuDisplayName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemIcon: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
  },
});

export default ProfileAvatar;
