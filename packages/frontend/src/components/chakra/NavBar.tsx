/**
 * NavBar Component
 *
 * A responsive navigation bar component using Chakra UI with:
 * - Sticky positioning at the top of the viewport
 * - Application logo and name on the left
 * - Navigation links for Boards and Epics with icons
 * - User avatar with dropdown menu (profile, settings, logout)
 * - Color mode toggle button (sun/moon icons)
 * - Tooltips on navigation items
 * - Hamburger menu for mobile viewports (below 768px)
 * - Drawer for mobile navigation menu
 *
 * @see Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 2.2, 17.2
 */

import React, { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Avatar,
  Menu,
  Portal,
  Drawer,
  CloseButton,
} from '@chakra-ui/react';
import type { User } from '@kanban/shared';

import { AppIconButton, AppButton } from './AppButton';
import { AppTooltip } from './AppTooltip';
import { useColorMode, useColorModeValue } from '@/hooks/useColorMode';
import {
  HomeIcon,
  BoardsIcon,
  EpicsIcon,
  SettingsIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  MenuIcon,
  CloseIcon,
} from '@/theme/icons';

/**
 * Props for the NavBar component
 */
export interface NavBarProps {
  /** Current user for avatar display */
  user: User | null;
  /** Navigation handler - called with route name */
  onNavigate: (route: 'home' | 'boards' | 'epics' | 'profile' | 'settings') => void;
  /** Logout handler */
  onLogout: () => void;
  /** Currently active route for highlighting */
  activeRoute?: 'home' | 'boards' | 'epics';
}

/**
 * NavBar - Application navigation bar
 *
 * Requirements:
 * - 5.1: Use Chakra UI Flex with sticky positioning at top
 * - 5.2: Display application logo and name on left side
 * - 5.3: Include navigation links/buttons for Boards and Epics
 * - 5.4: Display user's profile avatar on right side
 * - 5.5: Avatar click shows Menu with profile, settings, logout
 * - 5.6: Include IconButton for color mode toggle (sun/moon)
 * - 5.7: Tooltips on navigation items
 * - 2.2: Show appropriate icons for navigation actions
 * - 17.2: Collapse to hamburger menu on mobile viewports (below 768px)
 *
 * @example
 * ```tsx
 * <NavBar
 *   user={currentUser}
 *   onNavigate={(route) => navigate(route)}
 *   onLogout={handleLogout}
 *   activeRoute="boards"
 * />
 * ```
 */
export function NavBar({
  user,
  onNavigate,
  onLogout,
  activeRoute,
}: NavBarProps): React.JSX.Element {
  const { colorMode, toggleColorMode, isDark } = useColorMode();
  
  // State for mobile drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Color mode values for styling
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  /**
   * Get user initials for avatar fallback
   */
  const getUserInitials = (displayName: string): string => {
    const names = displayName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  };

  /**
   * Check if a route is active
   */
  const isActive = (route: 'home' | 'boards' | 'epics'): boolean => {
    return activeRoute === route;
  };

  /**
   * Handle navigation from mobile menu
   * Closes the drawer after navigation
   */
  const handleMobileNavigate = (route: 'home' | 'boards' | 'epics' | 'profile' | 'settings'): void => {
    setIsMobileMenuOpen(false);
    onNavigate(route);
  };

  /**
   * Handle logout from mobile menu
   * Closes the drawer after logout
   */
  const handleMobileLogout = (): void => {
    setIsMobileMenuOpen(false);
    onLogout();
  };

  return (
    <>
      <Box
        as="nav"
        position="sticky"
        top={0}
        zIndex="sticky"
        bg={bgColor}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        shadow="sm"
        aria-label="Main navigation"
      >
        <Flex
          maxW="container.xl"
          mx="auto"
          px={{ base: 4, md: 6 }}
          h="16"
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Left side: Hamburger Menu (mobile) + Logo and App Name (Requirement 5.2, 17.2) */}
          <HStack gap={3}>
            {/* Hamburger Menu Button - visible only on mobile (Requirement 17.2) */}
            <Box display={{ base: 'block', md: 'none' }}>
              <AppIconButton
                intent="ghost"
                aria-label="Open navigation menu"
                tooltip="Open menu"
                tooltipPlacement="bottom"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <MenuIcon />
              </AppIconButton>
            </Box>

            <AppTooltip label="Go to home" placement="bottom">
              <Flex
                alignItems="center"
                gap={2}
                cursor="pointer"
                onClick={() => onNavigate('home')}
                _hover={{ opacity: 0.8 }}
                role="button"
                aria-label="Personal Kanban - Go to home"
              >
                <Text fontSize="2xl" aria-hidden="true">
                  📋
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={textColor}
                  display={{ base: 'none', md: 'block' }}
                >
                  Personal Kanban
                </Text>
              </Flex>
            </AppTooltip>
          </HStack>

          {/* Center: Navigation Links - hidden on mobile (Requirement 5.3, 5.7, 2.2, 17.2) */}
          <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
            <AppTooltip label="View all boards" placement="bottom">
              <AppButton
                intent={isActive('boards') ? 'primary' : 'ghost'}
                leftIcon={<BoardsIcon />}
                onClick={() => onNavigate('boards')}
                aria-current={isActive('boards') ? 'page' : undefined}
              >
                Boards
              </AppButton>
            </AppTooltip>

            <AppTooltip label="View all epics" placement="bottom">
              <AppButton
                intent={isActive('epics') ? 'primary' : 'ghost'}
                leftIcon={<EpicsIcon />}
                onClick={() => onNavigate('epics')}
                aria-current={isActive('epics') ? 'page' : undefined}
              >
                Epics
              </AppButton>
            </AppTooltip>
          </HStack>

          {/* Right side: Color Mode Toggle and User Menu (Requirements 5.4, 5.5, 5.6) */}
          <HStack gap={2}>
            {/* Color Mode Toggle (Requirement 5.6, 12.5) */}
            <AppIconButton
              intent="ghost"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              tooltip={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              tooltipPlacement="bottom"
              onClick={toggleColorMode}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </AppIconButton>

            {/* User Avatar with Menu (Requirements 5.4, 5.5) - hidden on mobile */}
            {user && (
              <Box display={{ base: 'none', md: 'block' }}>
                <Menu.Root>
                  <AppTooltip label="User menu" placement="bottom">
                    <Menu.Trigger asChild>
                      <Box
                        as="button"
                        borderRadius="full"
                        cursor="pointer"
                        _hover={{ opacity: 0.8 }}
                        _focus={{ outline: 'none', boxShadow: 'outline' }}
                        aria-label="Open user menu"
                      >
                        <Avatar.Root size="sm">
                          <Avatar.Fallback>
                            {getUserInitials(user.displayName)}
                          </Avatar.Fallback>
                        </Avatar.Root>
                      </Box>
                    </Menu.Trigger>
                  </AppTooltip>

                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        minW="200px"
                        bg={bgColor}
                        borderColor={borderColor}
                        borderWidth="1px"
                        borderRadius="md"
                        shadow="lg"
                        py={2}
                      >
                        {/* User Info Header */}
                        <Box px={4} py={2} borderBottomWidth="1px" borderBottomColor={borderColor}>
                          <Text fontWeight="semibold" color={textColor}>
                            {user.displayName}
                          </Text>
                          <Text fontSize="sm" color="fg.muted">
                            {user.email}
                          </Text>
                        </Box>

                        {/* Menu Items */}
                        <Menu.Item
                          value="profile"
                          onClick={() => onNavigate('profile')}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                        >
                          <HStack gap={3}>
                            <UserIcon />
                            <Text>Profile</Text>
                          </HStack>
                        </Menu.Item>

                        <Menu.Item
                          value="settings"
                          onClick={() => onNavigate('settings')}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                        >
                          <HStack gap={3}>
                            <SettingsIcon />
                            <Text>Settings</Text>
                          </HStack>
                        </Menu.Item>

                        <Menu.Separator />

                        <Menu.Item
                          value="logout"
                          onClick={onLogout}
                          _hover={{ bg: 'red.50', color: 'red.600' }}
                          cursor="pointer"
                          color="red.500"
                        >
                          <HStack gap={3}>
                            <LogoutIcon />
                            <Text>Logout</Text>
                          </HStack>
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Box>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Navigation Drawer (Requirement 17.2) */}
      <Drawer.Root
        open={isMobileMenuOpen}
        onOpenChange={(details) => setIsMobileMenuOpen(details.open)}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg={bgColor} maxW="280px">
              <Drawer.Header borderBottomWidth="1px" borderBottomColor={borderColor}>
                <Flex alignItems="center" justifyContent="space-between" w="full">
                  <HStack gap={2}>
                    <Text fontSize="xl" aria-hidden="true">
                      📋
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Personal Kanban
                    </Text>
                  </HStack>
                  <Drawer.CloseTrigger asChild>
                    <AppIconButton
                      intent="ghost"
                      aria-label="Close navigation menu"
                      tooltip="Close menu"
                      size="sm"
                    >
                      <CloseIcon />
                    </AppIconButton>
                  </Drawer.CloseTrigger>
                </Flex>
              </Drawer.Header>

              <Drawer.Body py={4}>
                <VStack gap={2} align="stretch">
                  {/* User Info Section */}
                  {user && (
                    <Box
                      px={4}
                      py={3}
                      mb={2}
                      bg={hoverBg}
                      borderRadius="md"
                    >
                      <HStack gap={3}>
                        <Avatar.Root size="sm">
                          <Avatar.Fallback>
                            {getUserInitials(user.displayName)}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="semibold" color={textColor} fontSize="sm">
                            {user.displayName}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            {user.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  )}

                  {/* Navigation Links */}
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textTransform="uppercase"
                    px={4}
                    mb={1}
                  >
                    Navigation
                  </Text>

                  <AppButton
                    intent={isActive('boards') ? 'primary' : 'ghost'}
                    leftIcon={<BoardsIcon />}
                    onClick={() => handleMobileNavigate('boards')}
                    justifyContent="flex-start"
                    w="full"
                    aria-current={isActive('boards') ? 'page' : undefined}
                  >
                    Boards
                  </AppButton>

                  <AppButton
                    intent={isActive('epics') ? 'primary' : 'ghost'}
                    leftIcon={<EpicsIcon />}
                    onClick={() => handleMobileNavigate('epics')}
                    justifyContent="flex-start"
                    w="full"
                    aria-current={isActive('epics') ? 'page' : undefined}
                  >
                    Epics
                  </AppButton>

                  {/* Account Section */}
                  {user && (
                    <>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="fg.muted"
                        textTransform="uppercase"
                        px={4}
                        mt={4}
                        mb={1}
                      >
                        Account
                      </Text>

                      <AppButton
                        intent="ghost"
                        leftIcon={<UserIcon />}
                        onClick={() => handleMobileNavigate('profile')}
                        justifyContent="flex-start"
                        w="full"
                      >
                        Profile
                      </AppButton>

                      <AppButton
                        intent="ghost"
                        leftIcon={<SettingsIcon />}
                        onClick={() => handleMobileNavigate('settings')}
                        justifyContent="flex-start"
                        w="full"
                      >
                        Settings
                      </AppButton>

                      <AppButton
                        intent="danger"
                        leftIcon={<LogoutIcon />}
                        onClick={handleMobileLogout}
                        justifyContent="flex-start"
                        w="full"
                        mt={2}
                      >
                        Logout
                      </AppButton>
                    </>
                  )}
                </VStack>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}

export default NavBar;
