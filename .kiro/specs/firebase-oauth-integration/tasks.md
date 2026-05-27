# Implementation Plan: Firebase OAuth Integration

## Overview

This implementation plan covers the integration of Firebase Authentication with Google OAuth into the Personal Kanban Board application. The approach follows a dual-token architecture where Firebase tokens are used for Google OAuth users while existing JWT tokens continue to work for email/password users. Implementation proceeds from shared types, through backend infrastructure, to frontend components, ensuring each step builds on the previous.

## Tasks

- [x] 1. Set up shared types and interfaces
  - [x] 1.1 Add Firebase authentication types to shared package
    - Add `AuthProvider` type ('email' | 'google' | 'linked')
    - Add `FirebaseAuthRequest` and `LinkGoogleRequest` interfaces
    - Add `FirebaseAuthErrorType` type for error handling
    - Update `User` interface with `authProvider` field
    - _Requirements: 3.4, 3.5, 7.1, 7.2_

- [x] 2. Configure Firebase Admin SDK on backend
  - [x] 2.1 Install Firebase Admin SDK and add configuration
    - Add `firebase-admin` dependency to backend package
    - Create `packages/backend/src/config/firebase.ts` with initialization logic
    - Add environment variables for `FIREBASE_SERVICE_ACCOUNT_KEY` and `FIREBASE_PROJECT_ID`
    - Implement `verifyFirebaseToken` function with audience and issuer validation
    - _Requirements: 1.2, 1.4, 1.6, 8.2, 8.3_

  - [ ]* 2.2 Write property test for Firebase token verification (Property 1)
    - **Property 1: Firebase Token Verification**
    - **Validates: Requirements 2.5, 4.5**

  - [ ]* 2.3 Write property test for error message sanitization (Property 9)
    - **Property 9: Error Message Sanitization**
    - **Validates: Requirements 8.6**

- [x] 3. Update User model with Firebase fields
  - [x] 3.1 Add Firebase-related fields to User model
    - Add `firebaseUid` field with sparse unique index
    - Add `authProvider` field with enum validation
    - Add `permissions` array field for future use
    - Add `credentials` embedded document for API keys and bot tokens
    - Add pre-save validation for firebaseUid requirement on google/linked providers
    - Add static methods `findByFirebaseUid` and update `findByEmail`
    - _Requirements: 3.4, 3.5, 3.7, 9.1, 9.2_

  - [ ]* 3.2 Write property test for Firebase UID invariant (Property 4)
    - **Property 4: Firebase UID Invariant**
    - **Validates: Requirements 3.7**

  - [ ]* 3.3 Write unit tests for User model Firebase fields
    - Test firebaseUid uniqueness constraint
    - Test authProvider enum validation
    - Test pre-save validation rejects null firebaseUid for google/linked
    - _Requirements: 3.4, 3.5, 3.7_

- [x] 4. Checkpoint - Backend foundation complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update authentication middleware for dual-token support
  - [x] 5.1 Implement token type detection and dual verification
    - Create `isFirebaseToken` function to detect token type by header structure
    - Update `authenticate` middleware to handle both Firebase and JWT tokens
    - Add Firebase token verification path using `verifyFirebaseToken`
    - Preserve existing JWT verification path
    - Add `authProvider` to authenticated request context
    - _Requirements: 5.2, 5.4, 8.1_

  - [ ]* 5.2 Write property test for dual token support (Property 6)
    - **Property 6: Dual Token Support**
    - **Validates: Requirements 5.2, 5.4**

  - [ ]* 5.3 Write unit tests for auth middleware
    - Test Firebase token detection logic
    - Test JWT token detection logic
    - Test rejection of malformed tokens
    - Test rejection of expired tokens
    - _Requirements: 5.2, 5.4, 8.1_

- [x] 6. Implement Firebase authentication routes
  - [x] 6.1 Create POST /api/auth/firebase endpoint
    - Verify Firebase ID token using Admin SDK
    - Find existing user by firebaseUid or email
    - Create new user if none exists with authProvider 'google'
    - Link accounts if email matches existing user
    - Generate application JWT for API authentication
    - Return user data and token
    - _Requirements: 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.6_

  - [ ]* 6.2 Write property test for user creation from Google OAuth (Property 2)
    - **Property 2: User Creation from Google OAuth**
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 6.3 Write property test for account linking (Property 3)
    - **Property 3: Account Linking**
    - **Validates: Requirements 3.2, 3.6, 5.5**

  - [x] 6.4 Create POST /api/auth/link-google endpoint
    - Require existing authentication
    - Verify Firebase ID token
    - Validate Google email matches account email
    - Check Firebase UID not already linked to another account
    - Update user with firebaseUid and authProvider 'linked'
    - _Requirements: 3.2, 3.6, 5.5, 7.5_

  - [ ]* 6.5 Write unit tests for Firebase auth routes
    - Test successful Google sign-in creates new user
    - Test Google sign-in links to existing email account
    - Test rejection of invalid Firebase tokens
    - Test link-google endpoint validation
    - _Requirements: 2.5, 2.6, 3.1, 3.2_

- [x] 7. Checkpoint - Backend implementation complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Configure Firebase SDK on frontend
  - [x] 8.1 Install Firebase SDK and create configuration
    - Add `firebase` dependency to frontend package
    - Create `packages/frontend/src/config/firebase.ts`
    - Implement `initializeFirebase` function with environment variable config
    - Implement `getFirebaseAuth` accessor function
    - Add environment variables for Firebase web config
    - _Requirements: 1.1, 1.3, 1.5_

  - [ ]* 8.2 Write unit tests for Firebase configuration
    - Test initialization with valid config
    - Test initialization with missing config returns null
    - Test getFirebaseAuth returns auth instance after init
    - _Requirements: 1.3, 1.5_

- [x] 9. Implement Firebase auth service on frontend
  - [x] 9.1 Create Firebase authentication service
    - Create `packages/frontend/src/services/firebaseAuth.ts`
    - Implement `signInWithGoogle` using signInWithPopup
    - Implement `signOutFirebase` function
    - Implement `refreshFirebaseToken` function
    - Implement `subscribeToAuthState` for auth state changes
    - Implement `mapFirebaseError` for error type mapping
    - _Requirements: 2.2, 2.3, 4.3, 4.6, 6.3_

  - [ ]* 9.2 Write property test for authorization header inclusion (Property 5)
    - **Property 5: Authorization Header Inclusion**
    - **Validates: Requirements 4.2**

  - [ ]* 9.3 Write unit tests for Firebase auth service
    - Test signInWithGoogle returns user and token
    - Test signOutFirebase clears session
    - Test refreshFirebaseToken returns new token
    - Test error mapping for each Firebase error type
    - _Requirements: 2.2, 2.3, 4.3, 4.6_

- [x] 10. Update Redux auth slice for Firebase support
  - [x] 10.1 Add Firebase state and async thunks to auth slice
    - Add `firebaseInitialized`, `firebaseError`, `authProvider`, `isCheckingAuth` state fields
    - Create `loginWithGoogle` async thunk
    - Create `checkFirebaseSession` async thunk
    - Update reducers to handle new thunk states
    - Update logout action to call signOutFirebase
    - _Requirements: 4.1, 4.4, 4.6, 4.7, 6.1, 6.2, 6.3_

  - [ ]* 10.2 Write property test for authentication state synchronization (Property 7)
    - **Property 7: Authentication State Synchronization**
    - **Validates: Requirements 6.3**

  - [ ]* 10.3 Write unit tests for auth slice Firebase support
    - Test loginWithGoogle success updates state correctly
    - Test loginWithGoogle failure sets error state
    - Test checkFirebaseSession restores session
    - Test logout clears all auth state
    - _Requirements: 4.1, 4.6, 4.7, 6.1, 6.2_

- [x] 11. Checkpoint - Frontend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Update Login screen with Google sign-in
  - [x] 12.1 Add Google sign-in button and flow to Login screen
    - Add "Sign in with Google" button to login screen
    - Wire button to dispatch loginWithGoogle thunk
    - Handle loading state during Google OAuth flow
    - Display appropriate error messages for each error type
    - Handle popup blocked error with instructions
    - Handle user cancellation silently
    - _Requirements: 2.1, 2.7, 2.8, 7.1, 7.2, 7.4_

  - [ ]* 12.2 Write unit tests for Login screen Google sign-in
    - Test Google sign-in button renders
    - Test button click initiates OAuth flow
    - Test error messages display correctly
    - Test loading state during authentication
    - _Requirements: 2.1, 7.1, 7.2_

- [x] 13. Implement authentication state check on app startup
  - [x] 13.1 Add Firebase session check to app initialization
    - Initialize Firebase on app startup
    - Check for existing Firebase session
    - Dispatch checkFirebaseSession if session exists
    - Display loading indicator during auth check
    - Implement 10-second timeout for auth state determination
    - Redirect to login if auth check fails or times out
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 13.2 Write unit tests for app startup auth check
    - Test Firebase initialization on startup
    - Test automatic authentication with valid session
    - Test redirect to login on timeout
    - Test loading indicator displays during check
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 14. Implement token refresh and API client updates
  - [x] 14.1 Update API client for Firebase token handling
    - Update API client to detect token type
    - Implement automatic token refresh for Firebase tokens
    - Add token refresh on 401 response
    - Redirect to login on refresh failure
    - Ensure Authorization header format is correct
    - _Requirements: 4.2, 4.3, 4.4, 8.4_

  - [ ]* 14.2 Write property test for comprehensive token validation (Property 8)
    - **Property 8: Comprehensive Token Validation**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 14.3 Write unit tests for API client token handling
    - Test Authorization header includes Bearer token
    - Test token refresh on expiration
    - Test redirect to login on refresh failure
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 15. Checkpoint - Core integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement account linking UI (optional enhancement)
  - [x] 16.1 Add account linking option in user settings
    - Add "Link Google Account" button in settings/profile
    - Implement link flow using link-google endpoint
    - Display warning if Google email differs from account email
    - Show success/error feedback after linking attempt
    - _Requirements: 3.2, 3.6, 7.5_

  - [ ]* 16.2 Write unit tests for account linking UI
    - Test link button renders for email-only users
    - Test link button hidden for already-linked users
    - Test warning displays for email mismatch
    - _Requirements: 3.2, 7.5_

- [x] 17. Implement credential cleanup on user deletion
  - [x] 17.1 Update user deletion to revoke credentials
    - Update user deletion endpoint to clear permissions array
    - Clear all API keys from credentials.apiKeys
    - Clear all bot tokens from credentials.botTokens
    - Log credential revocation for audit trail
    - _Requirements: 9.4, 9.5_

  - [ ]* 17.2 Write property test for credential cleanup on deletion (Property 10)
    - **Property 10: Credential Cleanup on Deletion**
    - **Validates: Requirements 9.5**

  - [ ]* 17.3 Write unit tests for credential cleanup
    - Test deletion clears permissions array
    - Test deletion clears API keys
    - Test deletion clears bot tokens
    - _Requirements: 9.5_

- [x] 18. Add security logging for authentication events
  - [x] 18.1 Implement authentication event logging
    - Log successful Firebase authentications
    - Log failed authentication attempts with sanitized details
    - Include request ID, timestamp, IP address, user agent
    - Ensure internal error details are not exposed in responses
    - _Requirements: 8.5, 8.6_

  - [ ]* 18.2 Write unit tests for security logging
    - Test successful auth events are logged
    - Test failed auth events are logged with context
    - Test internal details not included in client responses
    - _Requirements: 8.5, 8.6_

- [x] 19. Final checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout, matching the existing codebase
- Firebase SDK is used on frontend, Firebase Admin SDK on backend
- Dual-token architecture maintains backward compatibility with existing JWT authentication

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["6.5", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3", "12.1"] },
    { "id": 10, "tasks": ["12.2", "13.1"] },
    { "id": 11, "tasks": ["13.2", "14.1"] },
    { "id": 12, "tasks": ["14.2", "14.3", "16.1"] },
    { "id": 13, "tasks": ["16.2", "17.1"] },
    { "id": 14, "tasks": ["17.2", "17.3", "18.1"] },
    { "id": 15, "tasks": ["18.2"] }
  ]
}
```
