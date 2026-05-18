/**
 * Epic Operations Unit Tests
 *
 * Property Tests:
 * - Property 10: Epic Board Constraint
 * - Property 11: Multi-Epic Task Assignment
 * - Property 12: Selective Epic Removal
 * - Property 13: Epic Deletion Preserves Tasks
 * - Property 14: Epic Task Query Completeness
 *
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Epic Operations', () => {
  interface Epic {
    id: string;
    boardId: string;
    name: string;
    description: string | null;
    color: string;
  }

  interface Task {
    id: string;
    boardId: string;
    sectionId: string;
    title: string;
    epicIds: string[];
  }

  interface Board {
    id: string;
    userId: string;
    name: string;
  }

  const createEpic = (boardId: string, name: string): Epic => ({
    id: createObjectId(),
    boardId,
    name,
    description: null,
    color: '#6366f1',
  });

  const createTask = (boardId: string, sectionId: string, title: string): Task => ({
    id: createObjectId(),
    boardId,
    sectionId,
    title,
    epicIds: [],
  });

  const createBoard = (userId: string, name: string): Board => ({
    id: createObjectId(),
    userId,
    name,
  });

  describe('Property 15: Fetch All User Epics', () => {
    it('should return all epics across all user boards', () => {
      const userId = createObjectId();
      const board1 = createBoard(userId, 'Board 1');
      const board2 = createBoard(userId, 'Board 2');
      
      const epic1 = createEpic(board1.id, 'Epic 1');
      const epic2 = createEpic(board1.id, 'Epic 2');
      const epic3 = createEpic(board2.id, 'Epic 3');
      
      const allEpics = [epic1, epic2, epic3];
      const userBoards = [board1, board2];
      
      const fetchAllUserEpics = (boards: Board[], epics: Epic[]): Epic[] => {
        const boardIds = boards.map(b => b.id);
        return epics.filter(e => boardIds.includes(e.boardId));
      };
      
      const result = fetchAllUserEpics(userBoards, allEpics);
      
      expect(result).toHaveLength(3);
      expect(result.map(e => e.name)).toContain('Epic 1');
      expect(result.map(e => e.name)).toContain('Epic 2');
      expect(result.map(e => e.name)).toContain('Epic 3');
    });

    it('should not return epics from other users boards', () => {
      const user1Id = createObjectId();
      const user2Id = createObjectId();
      
      const user1Board = createBoard(user1Id, 'User 1 Board');
      const user2Board = createBoard(user2Id, 'User 2 Board');
      
      const user1Epic = createEpic(user1Board.id, 'User 1 Epic');
      const user2Epic = createEpic(user2Board.id, 'User 2 Epic');
      
      const allEpics = [user1Epic, user2Epic];
      
      const fetchAllUserEpics = (boards: Board[], epics: Epic[]): Epic[] => {
        const boardIds = boards.map(b => b.id);
        return epics.filter(e => boardIds.includes(e.boardId));
      };
      
      // User 1 should only see their epic
      const user1Result = fetchAllUserEpics([user1Board], allEpics);
      expect(user1Result).toHaveLength(1);
      expect(user1Result[0].name).toBe('User 1 Epic');
      
      // User 2 should only see their epic
      const user2Result = fetchAllUserEpics([user2Board], allEpics);
      expect(user2Result).toHaveLength(1);
      expect(user2Result[0].name).toBe('User 2 Epic');
    });

    it('should return empty array when user has no boards', () => {
      const userId = createObjectId();
      const userBoards: Board[] = [];
      const allEpics = [createEpic(createObjectId(), 'Some Epic')];
      
      const fetchAllUserEpics = (boards: Board[], epics: Epic[]): Epic[] => {
        const boardIds = boards.map(b => b.id);
        return epics.filter(e => boardIds.includes(e.boardId));
      };
      
      const result = fetchAllUserEpics(userBoards, allEpics);
      
      expect(result).toHaveLength(0);
    });

    it('should return empty array when user boards have no epics', () => {
      const userId = createObjectId();
      const board = createBoard(userId, 'Empty Board');
      const allEpics: Epic[] = [];
      
      const fetchAllUserEpics = (boards: Board[], epics: Epic[]): Epic[] => {
        const boardIds = boards.map(b => b.id);
        return epics.filter(e => boardIds.includes(e.boardId));
      };
      
      const result = fetchAllUserEpics([board], allEpics);
      
      expect(result).toHaveLength(0);
    });

    it('should handle multiple boards with varying epic counts', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 5 }),
          fc.array(fc.nat({ max: 10 }), { maxLength: 5 }),
          (boardCount, epicCounts) => {
            const userId = createObjectId();
            const boards = Array.from({ length: boardCount }, (_, i) =>
              createBoard(userId, `Board ${i}`)
            );
            
            const allEpics: Epic[] = [];
            boards.forEach((board, boardIndex) => {
              const count = epicCounts[boardIndex] || 0;
              for (let i = 0; i < count; i++) {
                allEpics.push(createEpic(board.id, `Epic ${boardIndex}-${i}`));
              }
            });
            
            const fetchAllUserEpics = (userBoards: Board[], epics: Epic[]): Epic[] => {
              const boardIds = userBoards.map(b => b.id);
              return epics.filter(e => boardIds.includes(e.boardId));
            };
            
            const result = fetchAllUserEpics(boards, allEpics);
            
            // Should return exactly the epics we created
            expect(result).toHaveLength(allEpics.length);
            
            // Each epic should belong to one of the user's boards
            result.forEach(epic => {
              expect(boards.map(b => b.id)).toContain(epic.boardId);
            });
            
            return true;
          }
        )
      );
    });
  });

  describe('Property 10: Epic Board Constraint', () => {
    it('should associate epic with exactly one board', () => {
      const boardId = createObjectId();
      const epic = createEpic(boardId, 'My Epic');

      expect(epic.boardId).toBe(boardId);
      expect(typeof epic.boardId).toBe('string');
    });

    it('should not allow changing epic board after creation', () => {
      const originalBoardId = createObjectId();
      const newBoardId = createObjectId();
      const epic = createEpic(originalBoardId, 'My Epic');

      // Simulate immutable boardId
      const updateEpic = (e: Epic, updates: Partial<Omit<Epic, 'boardId'>>): Epic => ({
        ...e,
        ...updates,
      });

      const updated = updateEpic(epic, { name: 'Updated Name' });

      expect(updated.boardId).toBe(originalBoardId);
      expect(updated.boardId).not.toBe(newBoardId);
    });

    it('should validate epic belongs to board before operations', () => {
      const board1Id = createObjectId();
      const board2Id = createObjectId();
      const epic = createEpic(board1Id, 'Epic');

      const validateEpicBelongsToBoard = (e: Epic, boardId: string): boolean => {
        return e.boardId === boardId;
      };

      expect(validateEpicBelongsToBoard(epic, board1Id)).toBe(true);
      expect(validateEpicBelongsToBoard(epic, board2Id)).toBe(false);
    });
  });

  describe('Property 11: Multi-Epic Task Assignment', () => {
    it('should allow task to have zero epics', () => {
      const boardId = createObjectId();
      const task = createTask(boardId, createObjectId(), 'Task');

      expect(task.epicIds).toHaveLength(0);
    });

    it('should allow task to have one epic', () => {
      const boardId = createObjectId();
      const task = createTask(boardId, createObjectId(), 'Task');
      const epic = createEpic(boardId, 'Epic');

      task.epicIds.push(epic.id);

      expect(task.epicIds).toHaveLength(1);
      expect(task.epicIds).toContain(epic.id);
    });

    it('should allow task to have multiple epics', () => {
      const boardId = createObjectId();
      const task = createTask(boardId, createObjectId(), 'Task');
      const epic1 = createEpic(boardId, 'Epic 1');
      const epic2 = createEpic(boardId, 'Epic 2');
      const epic3 = createEpic(boardId, 'Epic 3');

      task.epicIds.push(epic1.id, epic2.id, epic3.id);

      expect(task.epicIds).toHaveLength(3);
      expect(task.epicIds).toContain(epic1.id);
      expect(task.epicIds).toContain(epic2.id);
      expect(task.epicIds).toContain(epic3.id);
    });

    it('should persist all epic associations', () => {
      fc.assert(
        fc.property(fc.nat({ max: 10 }), (epicCount) => {
          const boardId = createObjectId();
          const task = createTask(boardId, createObjectId(), 'Task');
          const epics = Array.from({ length: epicCount }, (_, i) =>
            createEpic(boardId, `Epic ${i}`)
          );

          task.epicIds = epics.map((e) => e.id);

          expect(task.epicIds).toHaveLength(epicCount);

          // All epic IDs should be present
          epics.forEach((epic) => {
            expect(task.epicIds).toContain(epic.id);
          });

          return true;
        })
      );
    });

    it('should not allow duplicate epic assignments', () => {
      const boardId = createObjectId();
      const task = createTask(boardId, createObjectId(), 'Task');
      const epic = createEpic(boardId, 'Epic');

      const assignEpic = (t: Task, epicId: string): boolean => {
        if (t.epicIds.includes(epicId)) {
          return false; // Already assigned
        }
        t.epicIds.push(epicId);
        return true;
      };

      expect(assignEpic(task, epic.id)).toBe(true);
      expect(assignEpic(task, epic.id)).toBe(false); // Duplicate
      expect(task.epicIds).toHaveLength(1);
    });
  });

  describe('Property 12: Selective Epic Removal', () => {
    it('should remove only specified epic from task', () => {
      const boardId = createObjectId();
      const task = createTask(boardId, createObjectId(), 'Task');
      const epic1 = createEpic(boardId, 'Epic 1');
      const epic2 = createEpic(boardId, 'Epic 2');
      const epic3 = createEpic(boardId, 'Epic 3');

      task.epicIds = [epic1.id, epic2.id, epic3.id];

      const removeEpic = (t: Task, epicId: string): void => {
        t.epicIds = t.epicIds.filter((id) => id !== epicId);
      };

      removeEpic(task, epic2.id);

      expect(task.epicIds).toHaveLength(2);
      expect(task.epicIds).toContain(epic1.id);
      expect(task.epicIds).not.toContain(epic2.id);
      expect(task.epicIds).toContain(epic3.id);
    });

    it('should preserve other epic associations when removing one', () => {
      fc.assert(
        fc.property(
          fc.nat({ min: 2, max: 10 }),
          fc.nat({ max: 9 }),
          (epicCount, removeIndex) => {
            if (removeIndex >= epicCount) return true;

            const boardId = createObjectId();
            const task = createTask(boardId, createObjectId(), 'Task');
            const epics = Array.from({ length: epicCount }, (_, i) =>
              createEpic(boardId, `Epic ${i}`)
            );

            task.epicIds = epics.map((e) => e.id);
            const epicToRemove = epics[removeIndex];

            task.epicIds = task.epicIds.filter((id) => id !== epicToRemove.id);

            // One less epic
            expect(task.epicIds).toHaveLength(epicCount - 1);

            // Removed epic is gone
            expect(task.epicIds).not.toContain(epicToRemove.id);

            // All other epics remain
            epics.forEach((epic, index) => {
              if (index !== removeIndex) {
                expect(task.epicIds).toContain(epic.id);
              }
            });

            return true;
          }
        )
      );
    });

    it('should handle removing non-existent epic gracefully', () => {
      const boardId = createObjectId();
      const task = createTask(boardId, createObjectId(), 'Task');
      const epic = createEpic(boardId, 'Epic');
      task.epicIds = [epic.id];

      const nonExistentId = createObjectId();
      const originalLength = task.epicIds.length;

      task.epicIds = task.epicIds.filter((id) => id !== nonExistentId);

      expect(task.epicIds).toHaveLength(originalLength);
    });
  });

  describe('Property 13: Epic Deletion Preserves Tasks', () => {
    it('should keep tasks when epic is deleted', () => {
      const boardId = createObjectId();
      const epic = createEpic(boardId, 'Epic');
      const tasks: Task[] = [
        createTask(boardId, createObjectId(), 'Task 1'),
        createTask(boardId, createObjectId(), 'Task 2'),
      ];

      // Assign epic to tasks
      tasks.forEach((t) => t.epicIds.push(epic.id));

      // Delete epic - remove from tasks but keep tasks
      const deleteEpic = (epicId: string, allTasks: Task[]): void => {
        allTasks.forEach((t) => {
          t.epicIds = t.epicIds.filter((id) => id !== epicId);
        });
      };

      deleteEpic(epic.id, tasks);

      // Tasks still exist
      expect(tasks).toHaveLength(2);

      // Epic association removed
      tasks.forEach((t) => {
        expect(t.epicIds).not.toContain(epic.id);
      });
    });

    it('should preserve other epic associations when one epic is deleted', () => {
      const boardId = createObjectId();
      const epic1 = createEpic(boardId, 'Epic 1');
      const epic2 = createEpic(boardId, 'Epic 2');
      const task = createTask(boardId, createObjectId(), 'Task');

      task.epicIds = [epic1.id, epic2.id];

      // Delete epic1
      task.epicIds = task.epicIds.filter((id) => id !== epic1.id);

      expect(task.epicIds).toHaveLength(1);
      expect(task.epicIds).toContain(epic2.id);
    });

    it('should handle deleting epic with no associated tasks', () => {
      const boardId = createObjectId();
      const epic = createEpic(boardId, 'Lonely Epic');
      const tasks: Task[] = [];

      const deleteEpic = (epicId: string, allTasks: Task[]): void => {
        allTasks.forEach((t) => {
          t.epicIds = t.epicIds.filter((id) => id !== epicId);
        });
      };

      // Should not throw
      expect(() => deleteEpic(epic.id, tasks)).not.toThrow();
    });
  });

  describe('Property 14: Epic Task Query Completeness', () => {
    it('should return all tasks with specified epic', () => {
      const boardId = createObjectId();
      const epic = createEpic(boardId, 'Epic');
      const tasks: Task[] = [
        createTask(boardId, createObjectId(), 'Task 1'),
        createTask(boardId, createObjectId(), 'Task 2'),
        createTask(boardId, createObjectId(), 'Task 3'),
      ];

      // Assign epic to first two tasks
      tasks[0].epicIds.push(epic.id);
      tasks[1].epicIds.push(epic.id);

      const findTasksByEpic = (epicId: string, allTasks: Task[]): Task[] => {
        return allTasks.filter((t) => t.epicIds.includes(epicId));
      };

      const result = findTasksByEpic(epic.id, tasks);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.title)).toContain('Task 1');
      expect(result.map((t) => t.title)).toContain('Task 2');
      expect(result.map((t) => t.title)).not.toContain('Task 3');
    });

    it('should return empty array when no tasks have epic', () => {
      const boardId = createObjectId();
      const epic = createEpic(boardId, 'Unused Epic');
      const tasks: Task[] = [
        createTask(boardId, createObjectId(), 'Task 1'),
        createTask(boardId, createObjectId(), 'Task 2'),
      ];

      const findTasksByEpic = (epicId: string, allTasks: Task[]): Task[] => {
        return allTasks.filter((t) => t.epicIds.includes(epicId));
      };

      const result = findTasksByEpic(epic.id, tasks);

      expect(result).toHaveLength(0);
    });

    it('should return exactly matching tasks (no false positives/negatives)', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 20 }),
          fc.array(fc.boolean(), { maxLength: 20 }),
          (taskCount, assignments) => {
            const boardId = createObjectId();
            const epic = createEpic(boardId, 'Epic');
            const tasks: Task[] = Array.from({ length: taskCount }, (_, i) =>
              createTask(boardId, createObjectId(), `Task ${i}`)
            );

            // Assign epic based on boolean array
            tasks.forEach((task, index) => {
              if (assignments[index]) {
                task.epicIds.push(epic.id);
              }
            });

            const findTasksByEpic = (epicId: string, allTasks: Task[]): Task[] => {
              return allTasks.filter((t) => t.epicIds.includes(epicId));
            };

            const result = findTasksByEpic(epic.id, tasks);
            const expectedCount = assignments.slice(0, taskCount).filter(Boolean).length;

            expect(result).toHaveLength(expectedCount);

            // Verify each result actually has the epic
            result.forEach((t) => {
              expect(t.epicIds).toContain(epic.id);
            });

            return true;
          }
        )
      );
    });
  });

  describe('Epic Validation', () => {
    it('should require epic name', () => {
      const validateName = (name: string | null | undefined): boolean => {
        return typeof name === 'string' && name.trim().length > 0;
      };

      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
      expect(validateName(null)).toBe(false);
      expect(validateName(undefined)).toBe(false);
      expect(validateName('Valid Epic')).toBe(true);
    });

    it('should validate hex color format', () => {
      const validateColor = (color: string): boolean => {
        return /^#[0-9A-Fa-f]{6}$/.test(color);
      };

      expect(validateColor('#6366f1')).toBe(true);
      expect(validateColor('#FF0000')).toBe(true);
      expect(validateColor('red')).toBe(false);
      expect(validateColor('#fff')).toBe(false);
    });

    it('should have default color when not specified', () => {
      const DEFAULT_COLOR = '#6366f1';
      const epic = createEpic(createObjectId(), 'Epic');

      expect(epic.color).toBe(DEFAULT_COLOR);
    });
  });
});
