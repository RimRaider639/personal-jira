// Jest setup file for frontend tests
import '@testing-library/jest-native/extend-expect';
import fc from 'fast-check';

// Configure fast-check defaults
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as per design doc
  verbose: true,
  seed: Date.now(), // Log seed for reproducibility
});

// Extend Jest timeout for property-based tests
jest.setTimeout(30000);

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Global test utilities
beforeAll(() => {
  // Suppress console warnings during tests unless explicitly needed
  if (process.env.DEBUG !== 'true') {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterAll(() => {
  jest.restoreAllMocks();
});
