import fc from 'fast-check';

/**
 * Example test file to verify Jest and fast-check setup
 */
describe('Backend Test Setup', () => {
  describe('Jest Configuration', () => {
    it('should run basic unit tests', () => {
      expect(1 + 1).toBe(2);
    });

    it('should support async tests', async () => {
      const result = await Promise.resolve('test');
      expect(result).toBe('test');
    });
  });

  describe('fast-check Property-Based Testing', () => {
    it('should run property-based tests with fast-check', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          // Commutative property of addition
          return a + b === b + a;
        }),
        { numRuns: 100 }
      );
    });

    it('should support string arbitraries', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          // String length is always non-negative
          return str.length >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should support array arbitraries', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          // Array length is always non-negative
          return arr.length >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should support record arbitraries for task-like objects', () => {
      const taskArbitrary = fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 255 }),
        priority: fc.option(fc.constantFrom('low', 'medium', 'high', 'critical')),
        storyPoints: fc.option(fc.integer({ min: 1, max: 100 })),
      });

      fc.assert(
        fc.property(taskArbitrary, (task) => {
          // Task should have required properties
          return (
            typeof task.id === 'string' &&
            typeof task.title === 'string' &&
            task.title.length >= 1 &&
            task.title.length <= 255
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
