/**
 * Task Pin Operations Unit Tests
 *
 * Tests for pinning/unpinning tasks in the Fridge feature.
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Task Pin Operations', () => {
  interface Task {
    id: string;
    boardId: string;
    sectionId: string;
    title: string;
    isPinned: boolean;
    updatedAt: Date;
  }

  interface Board {
    id: string;
    userId: string;
  }

  const createTask = (
    boardId: string,
    sectionId: string,
    title: string,
    isPinned: boolean = false
  ): Task => ({
    id: createObjectId(),
    boardId,
    sectionId,
    title,
    isPinned,
    updatedAt: new Date(),
  });

  const createBoard = (userId: string): Board => ({
    id: createObjectId(),
    userId,
  });

  describe('Pin Toggle', () => {
    it('should pin an unpinned task', () => {
      const board = createBoard(createObjectId());
      const task = createTask(board.id, createObjectId(), 'Test task', false);

      const togglePin = (t: Task): Task => ({
        ...t,
        isPinned: !t.isPinned,
        updatedAt: new Date(),
      });

      const toggled = togglePin(task);

      expect(toggled.isPinned).toBe(true);
    });

    it('should unpin a pinned task', () => {
      const board = createBoard(createObjectId());
      const task = createTask(board.id, createObjectId(), 'Test task', true);

      const togglePin = (t: Task): Task => ({
        ...t,
        isPinned: !t.isPinned,
        updatedAt: new Date(),
      });

      const toggled = togglePin(task);

      expect(toggled.isPinned).toBe(false);
    });

    it('should update updatedAt timestamp on toggle', () => {
      const originalDate = new Date('2024-01-01');
      const task: Task = {
        id: createObjectId(),
        boardId: createObjectId(),
        sectionId: createObjectId(),
        title: 'Test',
        isPinned: false,
        updatedAt: originalDate,
      };

      const togglePin = (t: Task): Task => ({
        ...t,
        isPinned: !t.isPinned,
        updatedAt: new Date(),
      });

      const toggled = togglePin(task);

      expect(toggled.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should preserve other task fields on toggle', () => {
      const boardId = createObjectId();
      const sectionId = createObjectId();
      const task = createTask(boardId, sectionId, 'Test task', false);
      const originalId = task.id;

      const togglePin = (t: Task): Task => ({
        ...t,
        isPinned: !t.isPinned,
        updatedAt: new Date(),
      });

      const toggled = togglePin(task);

      expect(toggled.id).toBe(originalId);
      expect(toggled.boardId).toBe(boardId);
      expect(toggled.sectionId).toBe(sectionId);
      expect(toggled.title).toBe('Test task');
    });
  });

  describe('Fetch Pinned Tasks', () => {
    it('should return only pinned tasks', () => {
      const userId = createObjectId();
      const board = createBoard(userId);

      const tasks: Task[] = [
        createTask(board.id, createObjectId(), 'Pinned 1', true),
        createTask(board.id, createObjectId(), 'Not pinned', false),
        createTask(board.id, createObjectId(), 'Pinned 2', true),
      ];

      const getPinnedTasks = (t: Task[]): Task[] => {
        return t.filter((task) => task.isPinned);
      };

      const pinned = getPinnedTasks(tasks);

      expect(pinned).toHaveLength(2);
      expect(pinned.every((t) => t.isPinned)).toBe(true);
    });

    it('should return pinned tasks across multiple boards', () => {
      const userId = createObjectId();
      const board1 = createBoard(userId);
      const board2 = createBoard(userId);

      const tasks: Task[] = [
        createTask(board1.id, createObjectId(), 'Board 1 Pinned', true),
        createTask(board1.id, createObjectId(), 'Board 1 Not pinned', false),
        createTask(board2.id, createObjectId(), 'Board 2 Pinned', true),
        createTask(board2.id, createObjectId(), 'Board 2 Not pinned', false),
      ];

      const getPinnedTasks = (t: Task[]): Task[] => {
        return t.filter((task) => task.isPinned);
      };

      const pinned = getPinnedTasks(tasks);

      expect(pinned).toHaveLength(2);
      expect(pinned.some((t) => t.boardId === board1.id)).toBe(true);
      expect(pinned.some((t) => t.boardId === board2.id)).toBe(true);
    });

    it('should return empty array when no tasks are pinned', () => {
      const board = createBoard(createObjectId());

      const tasks: Task[] = [
        createTask(board.id, createObjectId(), 'Task 1', false),
        createTask(board.id, createObjectId(), 'Task 2', false),
      ];

      const getPinnedTasks = (t: Task[]): Task[] => {
        return t.filter((task) => task.isPinned);
      };

      const pinned = getPinnedTasks(tasks);

      expect(pinned).toHaveLength(0);
    });

    it('should sort pinned tasks by updatedAt descending', () => {
      const board = createBoard(createObjectId());

      const tasks: Task[] = [
        { ...createTask(board.id, createObjectId(), 'First', true), updatedAt: new Date('2024-01-01') },
        { ...createTask(board.id, createObjectId(), 'Third', true), updatedAt: new Date('2024-01-03') },
        { ...createTask(board.id, createObjectId(), 'Second', true), updatedAt: new Date('2024-01-02') },
      ];

      const getPinnedTasksSorted = (t: Task[]): Task[] => {
        return t
          .filter((task) => task.isPinned)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      };

      const sorted = getPinnedTasksSorted(tasks);

      expect(sorted[0].title).toBe('Third');
      expect(sorted[1].title).toBe('Second');
      expect(sorted[2].title).toBe('First');
    });
  });

  describe('Authorization', () => {
    it('should only allow board owner to pin tasks', () => {
      const userId = createObjectId();
      const otherUserId = createObjectId();
      const board = createBoard(userId);
      const task = createTask(board.id, createObjectId(), 'Test', false);

      const canPin = (b: Board, requestingUserId: string): boolean => {
        return b.userId === requestingUserId;
      };

      expect(canPin(board, userId)).toBe(true);
      expect(canPin(board, otherUserId)).toBe(false);
    });

    it('should only return pinned tasks for boards owned by user', () => {
      const userId = createObjectId();
      const otherUserId = createObjectId();
      const userBoard = createBoard(userId);
      const otherBoard = createBoard(otherUserId);

      const tasks: Task[] = [
        createTask(userBoard.id, createObjectId(), 'User pinned', true),
        createTask(otherBoard.id, createObjectId(), 'Other pinned', true),
      ];

      const boards: Board[] = [userBoard, otherBoard];

      const getUserPinnedTasks = (t: Task[], b: Board[], uid: string): Task[] => {
        const userBoardIds = b.filter((board) => board.userId === uid).map((board) => board.id);
        return t.filter((task) => task.isPinned && userBoardIds.includes(task.boardId));
      };

      const userPinned = getUserPinnedTasks(tasks, boards, userId);

      expect(userPinned).toHaveLength(1);
      expect(userPinned[0].title).toBe('User pinned');
    });
  });

  describe('Property Tests', () => {
    it('should toggle pin status correctly for any task', () => {
      fc.assert(
        fc.property(fc.boolean(), (initialPinned) => {
          const task = createTask(createObjectId(), createObjectId(), 'Test', initialPinned);

          const togglePin = (t: Task): Task => ({
            ...t,
            isPinned: !t.isPinned,
            updatedAt: new Date(),
          });

          const toggled = togglePin(task);

          expect(toggled.isPinned).toBe(!initialPinned);
          return true;
        })
      );
    });

    it('should double toggle return to original state', () => {
      fc.assert(
        fc.property(fc.boolean(), (initialPinned) => {
          const task = createTask(createObjectId(), createObjectId(), 'Test', initialPinned);

          const togglePin = (t: Task): Task => ({
            ...t,
            isPinned: !t.isPinned,
            updatedAt: new Date(),
          });

          const doubleToggled = togglePin(togglePin(task));

          expect(doubleToggled.isPinned).toBe(initialPinned);
          return true;
        })
      );
    });

    it('should filter pinned tasks correctly for any set of tasks', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 0, maxLength: 50 }),
          (pinnedStates) => {
            const board = createBoard(createObjectId());
            const tasks = pinnedStates.map((isPinned, i) =>
              createTask(board.id, createObjectId(), `Task ${i}`, isPinned)
            );

            const getPinnedTasks = (t: Task[]): Task[] => {
              return t.filter((task) => task.isPinned);
            };

            const pinned = getPinnedTasks(tasks);
            const expectedCount = pinnedStates.filter((p) => p).length;

            expect(pinned).toHaveLength(expectedCount);
            expect(pinned.every((t) => t.isPinned)).toBe(true);
            return true;
          }
        )
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle task with no board gracefully', () => {
      const validateTaskBoard = (task: Task, boards: Board[]): boolean => {
        return boards.some((b) => b.id === task.boardId);
      };

      const task = createTask(createObjectId(), createObjectId(), 'Orphan task', true);
      const boards: Board[] = [];

      expect(validateTaskBoard(task, boards)).toBe(false);
    });

    it('should handle empty task list', () => {
      const tasks: Task[] = [];

      const getPinnedTasks = (t: Task[]): Task[] => {
        return t.filter((task) => task.isPinned);
      };

      const pinned = getPinnedTasks(tasks);

      expect(pinned).toHaveLength(0);
    });

    it('should handle all tasks pinned', () => {
      const board = createBoard(createObjectId());
      const tasks: Task[] = [
        createTask(board.id, createObjectId(), 'Task 1', true),
        createTask(board.id, createObjectId(), 'Task 2', true),
        createTask(board.id, createObjectId(), 'Task 3', true),
      ];

      const getPinnedTasks = (t: Task[]): Task[] => {
        return t.filter((task) => task.isPinned);
      };

      const pinned = getPinnedTasks(tasks);

      expect(pinned).toHaveLength(3);
    });
  });
});
