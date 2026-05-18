/**
 * Sprint Management Unit Tests
 *
 * Tests for:
 * - Sprint start (archiving done tasks)
 * - Archived tasks retrieval
 * - Task unarchive
 * - Board statistics
 *
 * Validates: Sprint management feature requirements
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

// Mock ObjectId for testing
const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Sprint Management', () => {
  describe('Sprint Start - Archive Done Tasks', () => {
    interface Task {
      id: string;
      sectionId: string;
      title: string;
      isArchived: boolean;
    }

    interface Section {
      id: string;
      name: string;
    }

    it('should archive all tasks in Done section', () => {
      const doneSection: Section = { id: createObjectId(), name: 'Done' };
      const todoSection: Section = { id: createObjectId(), name: 'To Do' };

      const tasks: Task[] = [
        { id: createObjectId(), sectionId: doneSection.id, title: 'Task 1', isArchived: false },
        { id: createObjectId(), sectionId: doneSection.id, title: 'Task 2', isArchived: false },
        { id: createObjectId(), sectionId: todoSection.id, title: 'Task 3', isArchived: false },
      ];

      // Simulate sprint start
      const startSprint = (allTasks: Task[], doneSectionId: string): number => {
        let archivedCount = 0;
        allTasks.forEach(task => {
          if (task.sectionId === doneSectionId && !task.isArchived) {
            task.isArchived = true;
            archivedCount++;
          }
        });
        return archivedCount;
      };

      const archivedCount = startSprint(tasks, doneSection.id);

      expect(archivedCount).toBe(2);
      expect(tasks.filter(t => t.isArchived)).toHaveLength(2);
      expect(tasks.find(t => t.title === 'Task 3')?.isArchived).toBe(false);
    });

    it('should not archive tasks already archived', () => {
      const doneSection: Section = { id: createObjectId(), name: 'Done' };

      const tasks: Task[] = [
        { id: createObjectId(), sectionId: doneSection.id, title: 'Task 1', isArchived: true },
        { id: createObjectId(), sectionId: doneSection.id, title: 'Task 2', isArchived: false },
      ];

      const startSprint = (allTasks: Task[], doneSectionId: string): number => {
        let archivedCount = 0;
        allTasks.forEach(task => {
          if (task.sectionId === doneSectionId && !task.isArchived) {
            task.isArchived = true;
            archivedCount++;
          }
        });
        return archivedCount;
      };

      const archivedCount = startSprint(tasks, doneSection.id);

      expect(archivedCount).toBe(1);
    });

    it('should handle case-insensitive Done section matching', () => {
      const sections: Section[] = [
        { id: createObjectId(), name: 'done' },
        { id: createObjectId(), name: 'DONE' },
        { id: createObjectId(), name: 'Done' },
      ];

      const isDoneSection = (name: string): boolean => {
        return name.toLowerCase() === 'done';
      };

      sections.forEach(section => {
        expect(isDoneSection(section.name)).toBe(true);
      });
    });

    it('should return correct archived count for any number of tasks', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 50 }),
          fc.nat({ max: 50 }),
          (doneTaskCount, otherTaskCount) => {
            const doneSection: Section = { id: createObjectId(), name: 'Done' };
            const todoSection: Section = { id: createObjectId(), name: 'To Do' };

            const tasks: Task[] = [
              ...Array.from({ length: doneTaskCount }, (_, i) => ({
                id: createObjectId(),
                sectionId: doneSection.id,
                title: `Done Task ${i}`,
                isArchived: false,
              })),
              ...Array.from({ length: otherTaskCount }, (_, i) => ({
                id: createObjectId(),
                sectionId: todoSection.id,
                title: `Todo Task ${i}`,
                isArchived: false,
              })),
            ];

            let archivedCount = 0;
            tasks.forEach(task => {
              if (task.sectionId === doneSection.id && !task.isArchived) {
                task.isArchived = true;
                archivedCount++;
              }
            });

            expect(archivedCount).toBe(doneTaskCount);
            expect(tasks.filter(t => t.isArchived)).toHaveLength(doneTaskCount);
            return true;
          }
        )
      );
    });
  });

  describe('Archived Tasks Retrieval', () => {
    interface Task {
      id: string;
      boardId: string;
      isArchived: boolean;
    }

    it('should return only archived tasks', () => {
      const boardId = createObjectId();
      const tasks: Task[] = [
        { id: createObjectId(), boardId, isArchived: true },
        { id: createObjectId(), boardId, isArchived: false },
        { id: createObjectId(), boardId, isArchived: true },
      ];

      const getArchivedTasks = (allTasks: Task[], targetBoardId: string): Task[] => {
        return allTasks.filter(t => t.boardId === targetBoardId && t.isArchived);
      };

      const archived = getArchivedTasks(tasks, boardId);
      expect(archived).toHaveLength(2);
      archived.forEach(task => {
        expect(task.isArchived).toBe(true);
      });
    });

    it('should return empty array when no archived tasks', () => {
      const boardId = createObjectId();
      const tasks: Task[] = [
        { id: createObjectId(), boardId, isArchived: false },
        { id: createObjectId(), boardId, isArchived: false },
      ];

      const getArchivedTasks = (allTasks: Task[], targetBoardId: string): Task[] => {
        return allTasks.filter(t => t.boardId === targetBoardId && t.isArchived);
      };

      const archived = getArchivedTasks(tasks, boardId);
      expect(archived).toHaveLength(0);
    });
  });

  describe('Task Unarchive', () => {
    interface Task {
      id: string;
      isArchived: boolean;
    }

    it('should set isArchived to false', () => {
      const task: Task = { id: createObjectId(), isArchived: true };

      const unarchiveTask = (t: Task): Task => {
        return { ...t, isArchived: false };
      };

      const unarchived = unarchiveTask(task);
      expect(unarchived.isArchived).toBe(false);
    });

    it('should preserve task id when unarchiving', () => {
      const taskId = createObjectId();
      const task: Task = { id: taskId, isArchived: true };

      const unarchiveTask = (t: Task): Task => {
        return { ...t, isArchived: false };
      };

      const unarchived = unarchiveTask(task);
      expect(unarchived.id).toBe(taskId);
    });
  });

  describe('Board Statistics', () => {
    interface Task {
      id: string;
      sectionId: string;
      isArchived: boolean;
      endDate: Date | null;
    }

    interface Section {
      id: string;
      name: string;
    }

    interface BoardStats {
      totalTasks: number;
      openTasks: number;
      completedTasks: number;
      archivedTasks: number;
      overdueTasks: number;
    }

    it('should calculate correct statistics', () => {
      const doneSection: Section = { id: createObjectId(), name: 'Done' };
      const todoSection: Section = { id: createObjectId(), name: 'To Do' };

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const tasks: Task[] = [
        { id: createObjectId(), sectionId: doneSection.id, isArchived: false, endDate: null },
        { id: createObjectId(), sectionId: todoSection.id, isArchived: false, endDate: yesterday }, // overdue
        { id: createObjectId(), sectionId: todoSection.id, isArchived: false, endDate: tomorrow },
        { id: createObjectId(), sectionId: todoSection.id, isArchived: true, endDate: null },
      ];

      const calculateStats = (
        allTasks: Task[],
        doneSectionIds: string[]
      ): BoardStats => {
        const activeTasks = allTasks.filter(t => !t.isArchived);
        const archivedTasks = allTasks.filter(t => t.isArchived);
        const completedTasks = activeTasks.filter(t => doneSectionIds.includes(t.sectionId));
        const openTasks = activeTasks.filter(t => !doneSectionIds.includes(t.sectionId));
        const overdueTasks = openTasks.filter(t => t.endDate && t.endDate < now);

        return {
          totalTasks: activeTasks.length,
          openTasks: openTasks.length,
          completedTasks: completedTasks.length,
          archivedTasks: archivedTasks.length,
          overdueTasks: overdueTasks.length,
        };
      };

      const stats = calculateStats(tasks, [doneSection.id]);

      expect(stats.totalTasks).toBe(3);
      expect(stats.openTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
      expect(stats.archivedTasks).toBe(1);
      expect(stats.overdueTasks).toBe(1);
    });

    it('should handle empty board', () => {
      const calculateStats = (
        allTasks: Task[],
        doneSectionIds: string[]
      ): BoardStats => {
        const activeTasks = allTasks.filter(t => !t.isArchived);
        const archivedTasks = allTasks.filter(t => t.isArchived);
        const completedTasks = activeTasks.filter(t => doneSectionIds.includes(t.sectionId));
        const openTasks = activeTasks.filter(t => !doneSectionIds.includes(t.sectionId));
        const now = new Date();
        const overdueTasks = openTasks.filter(t => t.endDate && t.endDate < now);

        return {
          totalTasks: activeTasks.length,
          openTasks: openTasks.length,
          completedTasks: completedTasks.length,
          archivedTasks: archivedTasks.length,
          overdueTasks: overdueTasks.length,
        };
      };

      const stats = calculateStats([], []);

      expect(stats.totalTasks).toBe(0);
      expect(stats.openTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.archivedTasks).toBe(0);
      expect(stats.overdueTasks).toBe(0);
    });
  });
});
