import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FiKey, FiLogOut, FiLink } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useTheme } from '@/theme/ThemeContext';
import type { AuthProvider } from '@kanban/shared';

interface ProfileAvatarProps {
  displayName: string;
  email?: string;
  authProvider?: AuthProvider | null;
  onLogout: () => void;
  onChangePassword?: () => void;
  onLinkGoogle?: () => void;
  isLinkingAccount?: boolean;
  linkAccountSuccess?: string | null;
  linkAccountError?: string | null;
}

/**
 * ProfileAvatar - Circular avatar with user initials and dropdown menu
 * 
 * Validates: Requirements 3.2, 3.6, 7.5
 */
export function ProfileAvatar({
  displayName,
  email,
  authProvider,
  onLogout,
  onChangePassword,
  onLinkGoogle,
  isLinkingAccount,
  linkAccountSuccess,
  linkAccountError,
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
              <View style={styles.menuHeaderText}>
                <Text style={[styles.menuDisplayName, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                {email && (
                  <Text style={[styles.menuEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                    {email}
                  </Text>
                )}
                {authProvider && (
                  <View style={styles.authProviderBadge}>
                    {authProvider === 'google' && <FcGoogle size={12} />}
                    {authProvider === 'linked' && <FiLink size={12} color={colors.primary} />}
                    <Text style={[styles.authProviderText, { color: colors.textSecondary }]}>
                      {authProvider === 'email' ? 'Email' : authProvider === 'google' ? 'Google' : 'Linked'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Success/Error feedback for account linking */}
            {linkAccountSuccess && (
              <View style={[styles.feedbackContainer, styles.successFeedback]}>
                <Text style={[styles.feedbackText, { color: '#16a34a' }]}>
                  {linkAccountSuccess}
                </Text>
              </View>
            )}
            {linkAccountError && (
              <View style={[styles.feedbackContainer, styles.errorFeedback]}>
                <Text style={[styles.feedbackText, { color: colors.error }]}>
                  {linkAccountError}
                </Text>
              </View>
            )}

            {/* Menu items */}
            <View style={styles.menuItems}>
              {/* Link Google Account - only show for email-only users */}
              {authProvider === 'email' && onLinkGoogle && (
                <TouchableOpacity
                  style={[styles.menuItem, isLinkingAccount && styles.menuItemDisabled]}
                  onPress={() => {
                    if (!isLinkingAccount) {
                      onLinkGoogle();
                    }
                  }}
                  disabled={isLinkingAccount}
                >
                  <View style={styles.menuItemIcon}>
                    {isLinkingAccount ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <FcGoogle size={16} />
                    )}
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>
                    {isLinkingAccount ? 'Linking...' : 'Link Google Account'}
                  </Text>
                </TouchableOpacity>
              )}
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
  menuHeaderText: {
    flex: 1,
  },
  menuEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  authProviderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  authProviderText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  feedbackContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  successFeedback: {
    backgroundColor: '#dcfce7',
  },
  errorFeedback: {
    backgroundColor: '#fee2e2',
  },
  feedbackText: {
    fontSize: 13,
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
  menuItemDisabled: {
    opacity: 0.6,
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
