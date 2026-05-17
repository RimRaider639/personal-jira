import fc from 'fast-check';

/**
 * Example test file to verify Jest and fast-check setup for shared package
 */
describe('Shared Package Test Setup', () => {
  describe('Jest Configuration', () => {
    it('should run basic unit tests', () => {
      expect(true).toBe(true);
    });

    it('should support TypeScript types', () => {
      // Example type validation test
      interface Task {
        id: string;
        title: string;
        priority: 'low' | 'medium' | 'high' | 'critical' | null;
      }

      const task: Task = {
        id: '123',
        title: 'Test Task',
        priority: 'high',
      };

      expect(task.id).toBe('123');
      expect(task.title).toBe('Test Task');
      expect(task.priority).toBe('high');
    });

    it('should validate priority enum values', () => {
      const validPriorities = ['low', 'medium', 'high', 'critical', null];
      
      validPriorities.forEach((priority) => {
        expect(validPriorities).toContain(priority);
      });
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

    it('should support record arbitraries for task-like objects', () => {
      const taskArbitrary = fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 255 }),
        description: fc.option(fc.string({ maxLength: 1000 })),
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
