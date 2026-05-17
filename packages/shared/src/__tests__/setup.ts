// Jest setup file for shared package tests
import fc from 'fast-check';

// Configure fast-check defaults
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as per design doc
  verbose: true,
  seed: Date.now(), // Log seed for reproducibility
});

// Extend Jest timeout for property-based tests
jest.setTimeout(30000);

// Global test utilities
beforeAll(() => {
  // Suppress console logs during tests unless explicitly needed
  if (process.env.DEBUG !== 'true') {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  }
});

afterAll(() => {
  jest.restoreAllMocks();
});
