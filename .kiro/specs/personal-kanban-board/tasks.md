# Implementation Plan: Personal Kanban Board

## Overview

This implementation plan covers building a cross-platform Personal Kanban Board application using React Native (web + Android), Node.js backend with Express, MongoDB database, and Cloudinary for attachments. The plan follows an incremental approach, building core functionality first and progressively adding features. This stack uses entirely free-tier services for zero-cost deployment.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - [x] 1.1 Initialize monorepo structure with workspaces
    - Create root package.json with npm/yarn workspaces
    - Set up `packages/frontend` for React Native app
    - Set up `packages/backend` for Node.js API server
    - Set up `packages/shared` for shared TypeScript types
    - Configure TypeScript with strict mode for all packages
    - _Requirements: 16.3_

  - [x] 1.2 Set up React Native project with Expo
    - Initialize Expo project with TypeScript template
    - Configure React Native Web for browser support
    - Set up Metro bundler configuration
    - Configure path aliases for clean imports
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 1.3 Set up Node.js backend project
    - Initialize Express server with TypeScript
    - Configure ESLint and Prettier
    - Set up nodemon for development
    - Configure environment variables with dotenv
    - _Requirements: 15.1_

  - [x] 1.4 Set up Docker development environment
    - Create docker-compose.yml with MongoDB and MinIO services
    - Configure volume mounts for data persistence
    - Set up health checks for all services
    - Create initialization scripts for database
    - Note: MinIO is for local development; Cloudinary is used in production
    - _Requirements: 15.1_

  - [x] 1.5 Configure testing frameworks
    - Set up Jest for backend unit tests
    - Set up Jest + React Native Testing Library for frontend
    - Configure fast-check for property-based testing
    - Set up test coverage reporting
    - _Requirements: Testing Strategy_

- [x] 2. Database Schema and Mongoose Models
  - [x] 2.1 Set up MongoDB connection and Mongoose
    - Install mongoose and configure connection
    - Create connection utility with retry logic
    - Configure MongoDB Atlas connection string for production
    - Set up local MongoDB connection for development
    - _Requirements: 15.1, 1.1, 2.1_

  - [x] 2.2 Create core Mongoose models
    - Create User schema with email, passwordHash, displayName
    - Create Board schema with userId, name, description, sectionOrder
    - Create Section schema with boardId, name, position
    - Create Epic schema with boardId, name, description, color
    - _Requirements: 3.1, 5.1, 5.3_

  - [x] 2.3 Create Task model with embedded documents
    - Create Task schema with all fields (title, description, priority, etc.)
    - Create embedded Comment sub-schema
    - Create embedded Attachment sub-schema with Cloudinary fields
    - Add text index on title and description for full-text search
    - Add indexes for boardId, sectionId, epicIds, endDate, priority
    - _Requirements: 6.1, 7.4, 19.2_

  - [x]* 2.4 Write property tests for model validation
    - **Property 7: Task Data Validation** - Verify priority enum constraints
    - **Property 7: Task Data Validation** - Verify story_points positive constraint
    - **Validates: Requirements 3.5, 3.6**

- [x] 3. Checkpoint - Database Setup Complete
  - Ensure MongoDB connection works locally and with Atlas
  - Verify all Mongoose models are created correctly
  - Ask the user if questions arise

- [x] 4. Shared Types and Utilities
  - [x] 4.1 Define core TypeScript interfaces
    - Create User, Board, Section, Task interfaces
    - Create Epic, Comment, Attachment interfaces
    - Create Priority type and DueDateFilter type
    - Create FilterState and SyncStatus types
    - _Requirements: 3.5, 10.2, 12.1_

  - [x] 4.2 Create validation utilities
    - Implement priority validation function
    - Implement story points validation (positive integer)
    - Implement end date validation (not in past)
    - Implement file type validation for attachments
    - _Requirements: 3.5, 3.6, 3.7, 7.2, 7.3_

  - [x]* 4.3 Write property tests for validation utilities
    - **Property 7: Task Data Validation** - Test priority validation
    - **Property 7: Task Data Validation** - Test story points validation
    - **Property 17: Attachment File Type Validation** - Test MIME type validation
    - **Validates: Requirements 3.5, 3.6, 7.2, 7.3**

- [x] 5. Backend Authentication System
  - [x] 5.1 Implement user registration endpoint
    - Create POST /api/auth/register endpoint
    - Hash passwords with bcrypt (12 rounds)
    - Validate email format and password strength
    - Return JWT token on successful registration
    - _Requirements: 18.2_

  - [x] 5.2 Implement user login endpoint
    - Create POST /api/auth/login endpoint
    - Verify password against stored hash
    - Generate JWT token with user ID and expiration
    - Return appropriate error for invalid credentials
    - _Requirements: 18.3, 18.4_

  - [x] 5.3 Implement authentication middleware
    - Create JWT verification middleware
    - Extract user ID from token for route handlers
    - Handle token expiration and invalid tokens
    - Create POST /api/auth/logout endpoint
    - _Requirements: 18.1, 18.5_

  - [x]* 5.4 Write unit tests for authentication
    - Test registration with valid/invalid inputs
    - Test login with correct/incorrect credentials
    - Test JWT token generation and verification
    - _Requirements: 18.2, 18.3, 18.4_

- [x] 6. Backend Board Management API
  - [x] 6.1 Implement board CRUD endpoints
    - Create GET /api/boards endpoint (list user boards)
    - Create POST /api/boards endpoint with default sections
    - Create GET /api/boards/:id endpoint
    - Create PUT /api/boards/:id endpoint
    - Create DELETE /api/boards/:id endpoint with cascade
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7_

  - [x]* 6.2 Write property tests for board operations
    - **Property 1: Board Creation Initializes Default Sections**
    - **Property 2: Board Deletion Cascades Completely**
    - **Property 3: Board Updates Persist Correctly**
    - **Property 4: Multiple Boards Per User**
    - **Validates: Requirements 1.2, 1.3, 1.5, 1.6, 2.1**

- [x] 7. Backend Section Management API
  - [x] 7.1 Implement section CRUD endpoints
    - Create GET /api/boards/:id/sections endpoint
    - Create POST /api/boards/:id/sections endpoint
    - Create PUT /api/sections/:id endpoint (rename)
    - Create DELETE /api/sections/:id endpoint
    - Create PUT /api/sections/reorder endpoint
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x]* 7.2 Write property tests for section operations
    - **Property 5: Section Operations Preserve Board Integrity**
    - **Validates: Requirements 2.2, 2.3, 2.6**

- [x] 8. Backend Task Management API
  - [x] 8.1 Implement task CRUD endpoints
    - Create GET /api/boards/:id/tasks endpoint with filtering
    - Create POST /api/boards/:id/tasks endpoint
    - Create GET /api/tasks/:id endpoint
    - Create PUT /api/tasks/:id endpoint
    - Create DELETE /api/tasks/:id endpoint with cascade
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.6, 4.7_

  - [x] 8.2 Implement task movement endpoint
    - Create PUT /api/tasks/:id/move endpoint
    - Handle section change and position update
    - Reorder other tasks in affected sections
    - _Requirements: 4.3, 4.4_

  - [x]* 8.3 Write property tests for task operations
    - **Property 6: Task Creation Placement**
    - **Property 8: Task Movement and Reordering**
    - **Property 9: Task Deletion Cascades**
    - **Validates: Requirements 3.3, 3.4, 4.3, 4.4, 4.7**

- [x] 9. Checkpoint - Core CRUD APIs Complete
  - Ensure all board, section, and task endpoints work correctly
  - Run all property tests and verify they pass
  - Ask the user if questions arise

- [x] 10. Backend Epic Management API
  - [x] 10.1 Implement epic CRUD endpoints
    - Create GET /api/boards/:id/epics endpoint
    - Create POST /api/boards/:id/epics endpoint
    - Create PUT /api/epics/:id endpoint
    - Create DELETE /api/epics/:id endpoint (preserve tasks)
    - _Requirements: 5.1, 5.2, 5.8_

  - [x] 10.2 Implement task-epic association endpoints
    - Create POST /api/tasks/:id/epics endpoint (assign epic)
    - Create DELETE /api/tasks/:id/epics/:epicId endpoint (remove epic)
    - Support multiple epic assignments per task
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [x]* 10.3 Write property tests for epic operations
    - **Property 10: Epic Board Constraint**
    - **Property 11: Multi-Epic Task Assignment**
    - **Property 12: Selective Epic Removal**
    - **Property 13: Epic Deletion Preserves Tasks**
    - **Property 14: Epic Task Query Completeness**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8**

- [x] 11. Backend Comments API
  - [x] 11.1 Implement comment CRUD endpoints
    - Create GET /api/tasks/:id/comments endpoint (chronological order)
    - Create POST /api/tasks/:id/comments endpoint
    - Create PUT /api/comments/:id endpoint
    - Create DELETE /api/comments/:id endpoint
    - Note: Comments are embedded in Task documents
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 11.2 Write property tests for comment operations
    - **Property 15: Comment Chronological Ordering**
    - **Property 16: Comment CRUD Integrity**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 12. Backend Attachments API with Cloudinary
  - [x] 12.1 Set up Cloudinary file storage service
    - Install and configure cloudinary SDK
    - Implement file upload with automatic optimization
    - Implement thumbnail generation for images
    - Configure upload presets for allowed file types
    - Note: Use MinIO locally for development, Cloudinary in production
    - _Requirements: 7.4_

  - [x] 12.2 Implement attachment endpoints
    - Create GET /api/tasks/:id/attachments endpoint
    - Create POST /api/tasks/:id/attachments endpoint
    - Create DELETE /api/attachments/:id endpoint
    - Validate file types (JPEG, PNG, GIF, WebP, PDF, TXT, office formats)
    - Store Cloudinary publicId and URLs in embedded attachment documents
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_

  - [x]* 12.3 Write property tests for attachment operations
    - **Property 17: Attachment File Type Validation**
    - **Property 18: Attachment Storage Round-Trip**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [x] 13. Backend Filtering and Search
  - [x] 13.1 Implement task filtering logic
    - Add epic filter with AND logic (all selected epics required)
    - Add priority filter with OR logic (any selected priority)
    - Add due date filters (today, week, 7days, overdue)
    - Implement combined filter logic
    - _Requirements: 8.1, 9.1, 9.3, 10.1, 10.2, 10.3, 11.1, 11.2, 12.1, 12.2_

  - [x] 13.2 Implement search functionality
    - Use MongoDB text index for full-text search on task title and description
    - Implement search within 500ms requirement
    - Return matching tasks with highlighted text positions
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x]* 13.3 Write property tests for filtering
    - **Property 19: Epic Filter AND Logic**
    - **Property 20: Priority Filter OR Logic**
    - **Property 21: Due Date Filter Accuracy**
    - **Property 22: Combined Filter AND Logic**
    - **Property 23: Filter Result Count Accuracy**
    - **Property 24: Search Result Accuracy**
    - **Validates: Requirements 9.1, 9.3, 10.1, 10.3, 11.1, 11.2, 12.1, 12.2, 19.2**

- [x] 14. Backend Data Export
  - [x] 14.1 Implement export endpoints
    - Create GET /api/boards/:id/export endpoint
    - Create GET /api/export/all endpoint
    - Generate JSON with all board data (sections, tasks, epics, comments)
    - Include attachment references by Cloudinary publicId
    - _Requirements: 20.1, 20.2, 20.3_

  - [x]* 14.2 Write property tests for export
    - **Property 29: Export Data Completeness**
    - **Validates: Requirements 20.1**

- [x] 15. Checkpoint - Backend API Complete
  - Ensure all REST endpoints are functional
  - Run all property tests and verify they pass
  - Test API with Postman or similar tool
  - Ask the user if questions arise

- [x] 16. WebSocket Server for Real-Time Sync
  - [x] 16.1 Set up WebSocket server with Socket.io
    - Configure Socket.io with Express server
    - Use in-memory adapter (sufficient for single server)
    - Implement JWT authentication for WebSocket connections
    - Note: Add @socket.io/redis-adapter later for horizontal scaling
    - _Requirements: 15.3, 15.4_

  - [x] 16.2 Implement board subscription system
    - Handle board:subscribe and board:unsubscribe events
    - Create user-specific channels for updates
    - Implement room management for board-level broadcasts
    - _Requirements: 15.3, 15.4_

  - [x] 16.3 Implement real-time event broadcasting
    - Broadcast task:created, task:updated, task:deleted events
    - Broadcast task:moved events
    - Broadcast section:created, section:updated, section:deleted events
    - Broadcast epic and comment events
    - Send sync:ack with server timestamp
    - _Requirements: 15.3, 15.6_

- [x] 17. Frontend State Management Setup
  - [x] 17.1 Configure Redux Toolkit store
    - Set up Redux store with TypeScript
    - Configure Redux DevTools for development
    - Set up RTK Query for API calls
    - Configure persistence with redux-persist
    - _Requirements: 15.1, 15.7_

  - [x] 17.2 Create Redux slices for core entities
    - Create auth slice (user, token, isAuthenticated)
    - Create boards slice with normalized state
    - Create sections slice with byBoardId index
    - Create tasks slice with bySectionId and byBoardId indexes
    - _Requirements: 15.1_

  - [x] 17.3 Create Redux slices for supporting entities
    - Create epics slice with byBoardId index
    - Create comments slice with byTaskId index
    - Create attachments slice with byTaskId index
    - Create filters slice with byBoardId state
    - Create sync slice for connection status
    - Create ui slice for scroll positions and drag state
    - _Requirements: 15.9, 12.3_

  - [x] 17.4 Create selectors for filtered data
    - Create selector for tasks filtered by epic (AND logic)
    - Create selector for tasks filtered by priority (OR logic)
    - Create selector for tasks filtered by due date
    - Create combined filter selector
    - Create task count selector
    - _Requirements: 8.3, 9.1, 9.3, 10.1, 11.1, 12.1, 12.2_

- [x] 18. Frontend Authentication Screens
  - [x] 18.1 Create LoginScreen component
    - Build login form with email and password fields
    - Implement form validation
    - Handle login API call and token storage
    - Display error messages for invalid credentials
    - _Requirements: 18.1, 18.3, 18.4_

  - [x] 18.2 Create RegisterScreen component
    - Build registration form with email, password, display name
    - Implement password strength validation
    - Handle registration API call
    - Navigate to boards on success
    - _Requirements: 18.2_

  - [x] 18.3 Implement AuthProvider and navigation
    - Create AuthProvider context for auth state
    - Implement secure token storage (SecureStore/AsyncStorage)
    - Set up navigation guards for protected routes
    - Implement logout functionality
    - _Requirements: 18.5, 18.6_

- [x] 19. Frontend Board List Screen
  - [x] 19.1 Create BoardListScreen component
    - Display boards in grid/list view
    - Show board name and description
    - Implement pull-to-refresh
    - _Requirements: 1.7_

  - [x] 19.2 Create CreateBoardModal component
    - Build form with name and description fields
    - Validate required name field
    - Handle board creation API call
    - _Requirements: 1.1_

  - [x] 19.3 Implement board management actions
    - Add edit board functionality
    - Add delete board with confirmation dialog
    - Navigate to board on selection
    - _Requirements: 1.4, 1.5, 1.6_

- [x] 20. Checkpoint - Authentication and Board List Complete
  - Ensure login/register flows work end-to-end
  - Verify board CRUD operations from UI
  - Ask the user if questions arise

- [x] 21. Frontend Board Screen - Core Layout
  - [x] 21.1 Create BoardScreen component structure
    - Implement BoardHeader with title and actions
    - Create horizontal scrollable SectionList
    - Add SyncStatusIndicator component
    - _Requirements: 2.7, 15.9_

  - [x] 21.2 Create Section component
    - Display section header with name and task count
    - Implement vertical TaskList within section
    - Add section menu (rename, delete, reorder)
    - _Requirements: 2.3, 2.4, 2.7_

  - [x] 21.3 Create TaskCard component
    - Display task title, priority indicator, due date
    - Show epic badges for associated epics
    - Implement visual feedback for overdue tasks
    - Handle tap to open task details
    - _Requirements: 4.1, 5.9, 10.4, 11.3_

- [x] 22. Frontend Drag and Drop
  - [x] 22.1 Implement drag-and-drop for tasks
    - Set up react-native-draggable-flatlist or similar
    - Handle task reordering within section
    - Handle task movement between sections
    - Provide visual feedback during drag
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 22.2 Implement drag-and-drop for sections
    - Enable section reordering via drag
    - Update section positions on drop
    - Sync reorder to backend
    - _Requirements: 2.6_

- [x] 23. Frontend Task Detail Screen
  - [x] 23.1 Create TaskDetailScreen component
    - Display all task properties (title, description, priority, etc.)
    - Implement inline editing for all fields
    - Add date picker for end date
    - Add priority selector
    - _Requirements: 4.1, 4.2_

  - [x] 23.2 Create EpicSelector component
    - Display available epics with checkboxes
    - Support multi-select for epic assignment
    - Show currently assigned epics
    - Handle epic add/remove operations
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [x] 23.3 Create CommentList component
    - Display comments in chronological order
    - Add new comment input
    - Implement edit and delete for comments
    - Show timestamps for each comment
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 23.4 Create AttachmentList component
    - Display attachment thumbnails/icons (using Cloudinary URLs)
    - Implement file picker for uploads
    - Handle attachment download/preview
    - Implement delete attachment
    - Show upload progress and error states
    - _Requirements: 7.1, 7.5, 7.6, 7.7, 7.8_

- [x] 24. Frontend Filtering System
  - [x] 24.1 Create FilterBar component
    - Display active filter indicators
    - Show task count for current filter
    - Add clear filters button
    - _Requirements: 8.3, 12.3, 12.4_

  - [x] 24.2 Create FilterPanel component
    - Create EpicFilter with multi-select checkboxes
    - Create PriorityFilter with priority level options
    - Create DueDateFilter with preset options
    - Display selected filter count
    - _Requirements: 9.2, 9.4, 9.5, 10.2, 11.2_

  - [x] 24.3 Implement filter logic in UI
    - Apply epic filter with AND logic
    - Apply priority filter with OR logic
    - Apply due date filter
    - Show empty state when no tasks match
    - _Requirements: 9.1, 9.3, 9.6, 10.1, 10.3, 11.1, 12.1, 12.2_

- [x] 25. Frontend Search
  - [x] 25.1 Create SearchInput component
    - Add search input to board header
    - Implement debounced search (500ms)
    - Highlight matching text in results
    - Show empty state for no results
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 26. Checkpoint - Board UI Complete
  - Ensure board view displays correctly with sections and tasks
  - Verify drag-and-drop works for tasks and sections
  - Test filtering and search functionality
  - Ask the user if questions arise

- [x] 27. Frontend Real-Time Sync
  - [x] 27.1 Create SyncService
    - Implement WebSocket connection with Socket.io client
    - Handle authentication with JWT
    - Implement board subscription/unsubscription
    - Handle connection status changes
    - _Requirements: 15.3, 15.4_

  - [x] 27.2 Implement real-time event handlers
    - Handle incoming task:updated, task:created, task:deleted events
    - Handle section and epic update events
    - Handle comment update events
    - Update Redux store on received events
    - _Requirements: 15.3, 15.6_

  - [x] 27.3 Create SyncStatusIndicator component
    - Display synced/syncing/offline status
    - Show pending changes count when offline
    - Provide visual feedback for sync state
    - _Requirements: 15.9_

- [x] 28. Frontend Offline Support
  - [x] 28.1 Create OfflineQueueService
    - Queue local changes when offline
    - Persist queue to AsyncStorage
    - Restore queue on app restart
    - _Requirements: 15.7_

  - [x] 28.2 Implement offline sync logic
    - Detect network connectivity changes
    - Process queued changes on reconnection
    - Handle sync conflicts with timestamp resolution
    - Notify user of conflict resolutions
    - _Requirements: 15.7, 15.8, 15.10_

  - [ ]* 28.3 Write property tests for offline sync
    - **Property 27: Offline Queue Persistence**
    - **Property 28: Conflict Resolution by Timestamp**
    - **Validates: Requirements 15.7, 15.8, 15.10**

- [x] 29. Frontend Engagement Features
  - [x] 29.1 Implement completion animations
    - Add celebratory animation when task moved to done
    - Add epic completion celebration
    - Use Lottie or Reanimated for animations
    - _Requirements: 14.1, 14.4_

  - [x] 29.2 Implement progress indicators
    - Calculate and display board completion percentage
    - Show progress bar on board cards
    - _Requirements: 14.2_

  - [ ]* 29.3 Write property tests for progress calculation
    - **Property 25: Progress Percentage Calculation**
    - **Property 26: Epic Completion Detection**
    - **Validates: Requirements 14.2, 14.4**

- [x] 30. Frontend Navigation and UX
  - [x] 30.1 Implement navigation system
    - Set up React Navigation with stack and tab navigators
    - Create navigation menu for board switching
    - Implement breadcrumb navigation
    - _Requirements: 13.1, 13.4_

  - [x] 30.2 Implement scroll position preservation
    - Save scroll position when navigating away
    - Restore scroll position when returning to board
    - Store positions in Redux ui slice
    - _Requirements: 13.3_

  - [ ]* 30.3 Write property tests for scroll preservation
    - **Property 30: Scroll Position Preservation**
    - **Validates: Requirements 13.3**

  - [x] 30.4 Implement keyboard navigation
    - Add keyboard shortcuts for common actions
    - Ensure focus management for accessibility
    - Support tab navigation through UI elements
    - _Requirements: 13.6_

- [x] 31. Frontend Responsive Design
  - [x] 31.1 Implement responsive layouts
    - Create mobile layout (< 768px) with stacked/scrollable sections
    - Create tablet layout (768-1024px) with adjusted spacing
    - Create desktop layout (> 1024px) with full board view
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [x] 31.2 Implement touch-friendly interactions
    - Ensure tap targets are at least 44x44 pixels
    - Handle orientation changes within 200ms
    - Optimize touch gestures for mobile
    - _Requirements: 17.5, 17.6_

- [x] 32. Frontend Data Export
  - [x] 32.1 Create ExportDataButton component
    - Add export option in settings screen
    - Implement single board export
    - Implement all boards export
    - Trigger file download on web, share sheet on mobile
    - _Requirements: 20.1, 20.2, 20.3_

- [x] 33. Checkpoint - Frontend Feature Complete
  - Ensure all UI features work correctly
  - Test real-time sync between multiple clients
  - Verify offline mode and reconnection
  - Test responsive design on different screen sizes
  - Ask the user if questions arise

- [x] 34. Performance Optimization
  - [x] 34.1 Optimize frontend performance
    - Implement virtualized lists for large task lists
    - Add memoization for expensive selectors
    - Optimize re-renders with React.memo
    - Ensure transitions complete within 300ms
    - _Requirements: 13.2, 13.5_

  - [x] 34.2 Optimize backend performance
    - Add MongoDB query optimization with proper indexes
    - Implement response caching where appropriate
    - Ensure API responses under 200ms (p95)
    - _Requirements: 15.2_

- [x] 35. Accessibility Compliance
  - [x] 35.1 Implement accessibility features
    - Add proper ARIA labels to all interactive elements
    - Ensure color contrast meets WCAG 2.1 AA
    - Test with screen readers
    - Implement focus indicators
    - _Requirements: 13.6_

- [x] 36. Integration Testing
  - [ ]* 36.1 Write API integration tests
    - Test complete user registration and login flow
    - Test board creation with default sections
    - Test task CRUD with epic associations
    - Test filtering and search endpoints
    - _Requirements: All API requirements_

  - [ ]* 36.2 Write WebSocket integration tests
    - Test real-time event broadcasting
    - Test multi-client synchronization
    - Test reconnection handling
    - _Requirements: 15.3, 15.4, 15.6_

- [x] 37. End-to-End Testing
  - [ ]* 37.1 Write E2E tests for critical flows
    - Test user registration and login
    - Test board and task management
    - Test drag-and-drop operations
    - Test filtering and search
    - Test offline mode and sync
    - _Requirements: All user-facing requirements_

- [x] 38. Deployment to Free Tier Services
  - [x] 38.1 Deploy backend to Render
    - Create Render web service for Node.js backend
    - Configure environment variables (MongoDB URI, Cloudinary, JWT secret)
    - Set up health check endpoint
    - Note: Free tier auto-sleeps after 15min inactivity, wakes on request
    - _Requirements: Deployment_

  - [x] 38.2 Deploy frontend to Vercel
    - Configure Vercel project for React Native Web
    - Set up environment variables for API URL
    - Configure build settings for Expo web export
    - _Requirements: Deployment_

  - [x] 38.3 Configure production services
    - Set up MongoDB Atlas M0 free cluster (512MB storage)
    - Configure Cloudinary free tier (25GB storage, 25GB bandwidth/month)
    - Update environment variables with production credentials
    - _Requirements: Deployment_

- [x] 39. Final Checkpoint - Application Complete
  - Ensure all tests pass
  - Verify all requirements are implemented
  - Test on web browser and Android device
  - Verify deployment works on free tier services
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout for type safety

### Technology Stack (Zero-Cost)

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Backend Hosting | Render | 750 hours/month, auto-sleep |
| Frontend Hosting | Vercel | 100GB bandwidth, unlimited sites |
| Database | MongoDB Atlas M0 | 512MB storage, shared cluster |
| File Storage | Cloudinary | 25GB storage, 25GB bandwidth/month |
| Local Dev Storage | MinIO | Self-hosted in Docker |

### Real-Time Sync Architecture

- Uses Socket.io with in-memory adapter (sufficient for single server)
- For horizontal scaling, add `@socket.io/redis-adapter` and a Redis instance (Upstash free tier available)
- This is a drop-in change that doesn't affect application code

### Offline Support

- Local queue with timestamp-based conflict resolution
- Changes persisted to AsyncStorage
- Automatic sync on reconnection
