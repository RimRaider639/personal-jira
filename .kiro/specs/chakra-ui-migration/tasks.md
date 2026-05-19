# Implementation Plan: Chakra UI Migration

## Overview

This implementation plan follows a bottom-up migration approach, starting with Chakra UI setup and theme configuration, then building reusable base components, migrating screens progressively from authentication through board management, and finishing with polish and accessibility. The plan is organized into 6 phases spanning approximately 4 weeks.

## Tasks

- [x] 1. Phase 1: Foundation Setup
  - [x] 1.1 Install Chakra UI dependencies and configure ChakraProvider
    - Install `@chakra-ui/react`, `@chakra-ui/icons`, `@emotion/react`, `@emotion/styled`, `framer-motion`, and `react-icons`
    - Wrap application root with ChakraProvider and ColorModeScript
    - Configure initial color mode and system color mode detection
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create custom theme configuration
    - Create `src/theme/index.ts` with theme extending Chakra defaults
    - Define brand colors with indigo primary (#6366f1) in `src/theme/colors.ts`
    - Create `src/theme/foundations/` with typography, spacing, and shadows tokens
    - Configure default component styles in `src/theme/components/`
    - _Requirements: 1.3, 1.4_

  - [x] 1.3 Implement color mode persistence
    - Create `src/hooks/useColorMode.ts` with localStorage persistence
    - Implement color mode toggle functionality
    - Test persistence across page reloads
    - _Requirements: 1.5, 5.6, 12.5_

  - [x] 1.4 Set up icon library
    - Configure react-icons with Feather/Heroicons sets
    - Create icon mapping constants for consistent usage
    - _Requirements: 2.1_

  - [x]* 1.5 Write unit tests for theme configuration
    - Test brand colors are correctly defined
    - Test color mode configuration
    - Test priority colors are defined
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Phase 1: Base Component Library
  - [x] 2.1 Create AppButton component
    - Implement `src/components/chakra/AppButton.tsx` with intent variants (primary, secondary, danger, ghost)
    - Support leftIcon, rightIcon, isLoading, and tooltip props
    - Implement proper aria-label for icon-only buttons
    - _Requirements: 2.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [x] 2.2 Create AppInput component
    - Implement `src/components/chakra/AppInput.tsx` with FormControl integration
    - Support label, error, helperText, isRequired, leftElement, rightElement props
    - Implement FormErrorMessage with error icon display
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.8_

  - [x] 2.3 Create AppCard component
    - Implement `src/components/chakra/AppCard.tsx` with accentColor, isHoverable, variant props
    - Support hover elevation effects
    - _Requirements: 6.2, 6.5, 8.1, 8.7_

  - [x] 2.4 Create AppModal component
    - Implement `src/components/chakra/AppModal.tsx` with Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter
    - Support title, primaryActionText, secondaryActionText, isLoading, size props
    - Implement focus trapping when modal is open
    - _Requirements: 10.1, 10.2, 10.6, 10.7, 18.4_

  - [x] 2.5 Create AppTooltip component
    - Implement `src/components/chakra/AppTooltip.tsx` wrapper with 300ms delay
    - Support configurable placement (top, bottom, left, right)
    - _Requirements: 12.6, 12.7_

  - [x] 2.6 Create barrel export for chakra components
    - Create `src/components/chakra/index.ts` exporting all components
    - _Requirements: 1.4_

  - [x]* 2.7 Write unit tests for base components
    - Test AppButton renders with all intent variants
    - Test AppButton loading state and tooltip
    - Test AppInput validation error display
    - Test AppCard hover effects
    - Test AppModal focus trapping
    - _Requirements: 14.1, 14.5, 13.3, 8.7, 18.4_

- [x] 3. Checkpoint - Foundation Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Phase 2: Toast and Loading Components
  - [x] 4.1 Create toast notification hook
    - Implement `src/hooks/useToast.ts` with showToast, showSuccess, showError, showWarning, showInfo methods
    - Configure toast position to bottom-right
    - Set auto-dismiss to 5 seconds with manual dismiss option
    - Support action buttons for undo operations
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 4.2 Create ToastProvider context
    - Implement `src/components/chakra/ToastProvider.tsx` wrapping application
    - Configure aria-live regions for screen reader announcements
    - _Requirements: 11.1, 18.5_

  - [x] 4.3 Create LoadingState component
    - Implement `src/components/chakra/LoadingState.tsx` with Skeleton and Spinner variants
    - Support different layout patterns (card grid, list, detail)
    - _Requirements: 16.1, 16.4_

  - [x] 4.4 Create EmptyState component
    - Implement `src/components/chakra/EmptyState.tsx` with icon, heading, description, and CTA button
    - Use VStack and Center for layout
    - _Requirements: 16.2, 16.5, 16.6_

  - [x] 4.5 Create ErrorState component
    - Implement error display with Alert, retry button
    - _Requirements: 16.3_

  - [x]* 4.6 Write unit tests for toast and state components
    - Test toast displays with correct status colors
    - Test toast auto-dismiss timing
    - Test LoadingState skeleton rendering
    - Test EmptyState displays CTA button
    - _Requirements: 11.2, 11.3, 11.4, 11.7, 16.1, 16.5_

- [x] 5. Phase 2: Authentication Screens
  - [x] 5.1 Migrate LoginScreen to Chakra UI
    - Replace StyleSheet with Chakra Card, FormControl, FormLabel, Input, Button
    - Implement VStack and Center for layout
    - Add loading state to sign-in button
    - Display FormErrorMessage for validation errors
    - Display Alert for API errors
    - Add Link for registration navigation
    - Add tooltip on sign-in button hover
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 5.2 Migrate RegisterScreen to Chakra UI
    - Replace StyleSheet with Chakra Card, FormControl components
    - Implement InputGroup with InputRightElement for password visibility toggle
    - Add password match validation with FormErrorMessage
    - Add loading spinner during registration
    - Integrate toast notifications for success/failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x]* 5.3 Write integration tests for authentication screens
    - Test LoginScreen validation error display
    - Test LoginScreen API error toast
    - Test RegisterScreen password mismatch error
    - Test RegisterScreen success toast
    - _Requirements: 3.4, 3.5, 4.4, 4.6, 4.7_

- [x] 6. Checkpoint - Authentication Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Phase 3: Navigation and Layout
  - [x] 7.1 Create NavBar component
    - Implement `src/components/chakra/NavBar.tsx` with Flex and sticky positioning
    - Add application logo and name on left side
    - Add navigation links for Boards and Epics
    - Add Avatar with Menu dropdown (profile, settings, logout)
    - Add IconButton for color mode toggle (sun/moon)
    - Add tooltips on navigation items
    - Add icons for navigation actions (home, boards, epics, settings, logout)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 2.2_

  - [x] 7.2 Implement responsive navigation
    - Add hamburger menu for mobile viewports (below 768px)
    - Implement Drawer for mobile navigation menu
    - _Requirements: 17.2_

  - [x] 7.3 Create responsive layout container
    - Implement Container with responsive max-width
    - Configure responsive array syntax for breakpoints
    - _Requirements: 17.1_

  - [x]* 7.4 Write unit tests for NavBar
    - Test NavBar renders all navigation elements
    - Test color mode toggle functionality
    - Test avatar menu displays options
    - _Requirements: 5.3, 5.5, 5.6_

- [x] 8. Phase 3: Board List Screen
  - [x] 8.1 Migrate BoardListScreen to Chakra UI
    - Replace StyleSheet with Chakra SimpleGrid for responsive layout
    - Configure grid columns: 1 mobile, 2 tablet, 3-4 desktop
    - Use Card components for each board with hover effects
    - Add Stat components for board statistics (open, completed, overdue tasks)
    - Add Button with AddIcon for "Create Board" action
    - Add Menu on long-press/right-click for edit and delete options
    - Add Skeleton components for loading state
    - Add icons for sections count, task count, and activity
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 2.6, 17.3_

  - [x] 8.2 Implement board deletion with toast
    - Add success toast with undo option on board delete
    - _Requirements: 6.8_

  - [x]* 8.3 Write integration tests for BoardListScreen
    - Test responsive grid layout
    - Test board card hover effects
    - Test loading skeleton display
    - Test delete toast with undo
    - _Requirements: 6.1, 6.5, 6.7, 6.8_

- [x] 9. Checkpoint - Navigation and Board List Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Phase 4: Board Screen
  - [x] 10.1 Migrate BoardScreen to Chakra UI
    - Replace StyleSheet with Chakra Flex for horizontal scroll sections
    - Use Card components for section headers with name and task count Badge
    - Add IconButton for section actions (add task, edit, delete)
    - Add InputGroup with search icon for search bar
    - Add Badge for active filter count
    - Add tooltips on section action buttons
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 10.2 Implement responsive filter panel
    - Add Drawer component for filter panel on mobile
    - _Requirements: 7.7, 17.7_

  - [x] 10.3 Implement task move toast
    - Add info toast when tasks are moved between sections
    - _Requirements: 7.8_

  - [x] 10.4 Add filter bar icons
    - Add icons for filter (funnel), search (magnifying glass), clear (x-circle)
    - _Requirements: 2.5_

  - [x]* 10.5 Write integration tests for BoardScreen
    - Test horizontal scroll for sections
    - Test filter drawer on mobile
    - Test task move toast
    - _Requirements: 7.1, 7.7, 7.8_

- [x] 11. Phase 4: Task Card Component
  - [x] 11.1 Migrate TaskCard to Chakra UI
    - Replace StyleSheet with Chakra Card with configurable border-left color by priority
    - Use Text component with proper typography for title
    - Use Tag components for epic badges with colors
    - Use HStack for metadata row with icons (due date, comments, attachments)
    - Display overdue dates in red color scheme
    - Use Badge for story points
    - Add hover shadow increase effect
    - Add Menu with IconButton for quick actions (move, pin, assign epic)
    - Add icons for due date (calendar), comments (chat), attachments (paperclip), priority (flag)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 2.3_

  - [x] 11.2 Add task card tooltips
    - Add tooltip for truncated text showing full text
    - Add tooltip for priority indicators showing level name
    - Add tooltip for epic badges showing full epic name
    - _Requirements: 12.2, 12.3, 12.4_

  - [x]* 11.3 Write unit tests for TaskCard
    - Test priority border color rendering
    - Test overdue date red styling
    - Test epic badge display
    - Test hover shadow effect
    - _Requirements: 8.1, 8.5, 8.3, 8.7_

- [x] 12. Checkpoint - Board and Task Card Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Phase 5: Task Detail Screen
  - [x] 13.1 Migrate TaskDetailScreen to Chakra UI
    - Replace StyleSheet with Chakra Card as main container
    - Use Editable component for inline title editing
    - Use Textarea with auto-resize for description
    - Use Select components for priority and status dropdowns
    - Use FormControl with FormLabel for date pickers
    - Use Tabs for comments, attachments, dependencies sections
    - Use Divider to separate content sections
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.9_

  - [x] 13.2 Implement task detail toasts
    - Add success toast on save with "Task updated" message
    - Add warning toast with confirmation on delete
    - _Requirements: 9.7, 9.8_

  - [x] 13.3 Add additional form input components
    - Implement NumberInput for story points
    - Implement Textarea with auto-resize
    - Implement Select with custom styling
    - _Requirements: 13.5, 13.6, 13.7_

  - [x]* 13.4 Write integration tests for TaskDetailScreen
    - Test inline title editing
    - Test save success toast
    - Test delete confirmation toast
    - _Requirements: 9.2, 9.7, 9.8_

- [x] 14. Phase 5: Modal Components
  - [x] 14.1 Migrate board creation modal
    - Use Modal with ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter
    - Add ModalCloseButton for dismissal
    - Use FormControl components for form fields
    - Use ButtonGroup for Cancel/Submit actions
    - Add Spinner on submit button during submission
    - Add success toast on close after creation
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 10.8_

  - [x] 14.2 Migrate task creation modal
    - Include Select for section selection
    - _Requirements: 10.4_

  - [x] 14.3 Migrate note creation modal
    - Use Textarea for note content
    - Implement color picker using RadioGroup with colored Circle components
    - _Requirements: 10.5_

  - [x] 14.4 Implement responsive modal sizing
    - Configure full-screen on mobile, centered with max-width on desktop
    - _Requirements: 17.5_

  - [x]* 14.5 Write unit tests for modal components
    - Test modal focus trapping
    - Test form submission loading state
    - Test success toast on creation
    - _Requirements: 18.4, 10.7, 10.8_

- [x] 15. Checkpoint - Task Detail and Modals Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Phase 5: Epic Management Screens
  - [x] 16.1 Migrate EpicListScreen to Chakra UI
    - Replace StyleSheet with Chakra SimpleGrid for responsive layout
    - Use Card with left border color matching epic color
    - Use Progress component for epic completion percentage
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 16.2 Migrate EpicDetailScreen to Chakra UI
    - Use Tabs for tasks, description, settings sections
    - Use Editable for inline name editing
    - Use List with ListItem for associated tasks
    - Add success toast on epic color change
    - _Requirements: 15.4, 15.5, 15.6, 15.7_

  - [x]* 16.3 Write integration tests for Epic screens
    - Test epic card progress display
    - Test inline name editing
    - Test color change toast
    - _Requirements: 15.3, 15.5, 15.7_

- [x] 17. Phase 6: Accessibility and Polish
  - [x] 17.1 Implement keyboard navigation
    - Ensure all interactive elements are keyboard accessible
    - Add visible focus indicators on focus
    - _Requirements: 18.6, 18.7_

  - [x] 17.2 Verify ARIA attributes
    - Verify Chakra components provide built-in ARIA attributes
    - Add aria-label to all icon-only buttons
    - Verify FormControl associates labels with inputs
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 17.3 Verify color contrast
    - Test color contrast ratios meet WCAG AA in light mode
    - Test color contrast ratios meet WCAG AA in dark mode
    - _Requirements: 18.8_

  - [x] 17.4 Add remaining tooltips
    - Add tooltips to all icon-only buttons throughout app
    - Verify tooltip delay is 300ms
    - _Requirements: 12.1, 12.7_

  - [x] 17.5 Verify responsive typography
    - Ensure TaskCard maintains readable typography across viewports
    - _Requirements: 17.6_

  - [x] 17.6 Implement horizontal scroll for board sections
    - Verify horizontal scroll works on all viewports
    - _Requirements: 17.4_

  - [x]* 17.7 Write accessibility tests
    - Run jest-axe on LoginScreen
    - Run jest-axe on BoardListScreen
    - Run jest-axe on BoardScreen
    - Test modal focus trapping
    - Test keyboard navigation
    - _Requirements: 18.1, 18.4, 18.6_

- [x] 18. Final Checkpoint - All Tests Pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- The migration follows a bottom-up approach: foundation → components → screens → polish
- Property-based testing is NOT applicable for this UI migration feature (per design document)
- All testing uses example-based unit tests, integration tests, and accessibility audits
- Install `jest-axe` dev dependency for accessibility testing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "1.5"] },
    { "id": 3, "tasks": ["2.1", "2.2", "2.3", "2.5"] },
    { "id": 4, "tasks": ["2.4", "2.6"] },
    { "id": 5, "tasks": ["2.7", "4.1", "4.3", "4.4", "4.5"] },
    { "id": 6, "tasks": ["4.2", "4.6"] },
    { "id": 7, "tasks": ["5.1", "5.2"] },
    { "id": 8, "tasks": ["5.3", "7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3"] },
    { "id": 10, "tasks": ["7.4", "8.1"] },
    { "id": 11, "tasks": ["8.2", "8.3"] },
    { "id": 12, "tasks": ["10.1", "11.1"] },
    { "id": 13, "tasks": ["10.2", "10.3", "10.4", "11.2"] },
    { "id": 14, "tasks": ["10.5", "11.3"] },
    { "id": 15, "tasks": ["13.1"] },
    { "id": 16, "tasks": ["13.2", "13.3"] },
    { "id": 17, "tasks": ["13.4", "14.1"] },
    { "id": 18, "tasks": ["14.2", "14.3", "14.4"] },
    { "id": 19, "tasks": ["14.5", "16.1"] },
    { "id": 20, "tasks": ["16.2"] },
    { "id": 21, "tasks": ["16.3", "17.1", "17.2", "17.3", "17.4", "17.5", "17.6"] },
    { "id": 22, "tasks": ["17.7"] }
  ]
}
```
