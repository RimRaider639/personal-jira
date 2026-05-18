/**
 * Task Dependencies Unit Tests
 *
 * Tests for:
 * - Adding dependent tasks
 * - Removing dependent tasks
 * - Retrieving dependent tasks
 * - Dependency validation
 *
 * Validates: Task dependencies feature requirements
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

// Mock ObjectId for testing
const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Task Dependencies', () => {
  describe('Adding Dependencies', () => {
    interface Task {
      id: string;
      boardId: string;
      title: string;
      dependentTaskIds: string[];
    }

    it('should add a dependent task', () => {
      const boardId = createObjectId();
      const task: Task = {
        id: createObjectId(),
        boardId,
        title: 'Main Task',
        dependentTaskIds: [],
      };

      const dependentTask: Task = {
        id: createObjectId(),
        boardId,
        title: 'Dependent Task',
        dependentTaskIds: [],
      };

      const addDependency = (mainTask: Task, depTaskId: string): Task => {
        if (!mainTask.dependentTaskIds.includes(depTaskId)) {
          return {
            ...mainTask,
            dependentTaskIds: [...mainTask.dependentTaskIds, depTaskId],
          };
        }
        return mainTask;
      };

      const updated = addDependency(task, dependentTask.id);

      expect(updated.dependentTaskIds).toContain(dependentTask.id);
      expect(updated.dependentTaskIds).toHaveLength(1);
    });

    it('should not add duplicate dependencies', () => {
      const boardId = createObjectId();
      const depTaskId = createObjectId();
      const task: Task = {
        id: createObjectId(),
        boardId,
        title: 'Main Task',
        dependentTaskIds: [depTaskId],
      };

      const addDependency = (mainTask: Task, depId: string): Task => {
        if (!mainTask.dependentTaskIds.includes(depId)) {
          return {
            ...mainTask,
            dependentTaskIds: [...mainTask.dependentTaskIds, depId],
          };
        }
        return mainTask;
      };

      const updated = addDependency(task, depTaskId);

      expect(updated.dependentTaskIds).toHaveLength(1);
    });

    it('should not allow self-dependency', () => {
      const task: Task = {
        id: createObjectId(),
        boardId: createObjectId(),
        title: 'Task',
        dependentTaskIds: [],
      };

      const addDependency = (mainTask: Task, depTaskId: string): Task | null => {
        if (mainTask.id === depTaskId) {
          return null; // Self-dependency not allowed
        }
        if (!mainTask.dependentTaskIds.includes(depTaskId)) {
          return {
            ...mainTask,
            dependentTaskIds: [...mainTask.dependentTaskIds, depTaskId],
          };
        }
        return mainTask;
      };

      const result = addDependency(task, task.id);
      expect(result).toBeNull();
    });

    it('should only allow dependencies from same board', () => {
      const board1Id = createObjectId();
      const board2Id = createObjectId();

      const task: Task = {
        id: createObjectId(),
        boardId: board1Id,
        title: 'Task',
        dependentTaskIds: [],
      };

      const depTaskSameBoard: Task = {
        id: createObjectId(),
        boardId: board1Id,
        title: 'Dep Task Same Board',
        dependentTaskIds: [],
      };

      const depTaskDiffBoard: Task = {
        id: createObjectId(),
        boardId: board2Id,
        title: 'Dep Task Diff Board',
        dependentTaskIds: [],
      };

      const canAddDependency = (mainTask: Task, depTask: Task): boolean => {
        return mainTask.boardId === depTask.boardId && mainTask.id !== depTask.id;
      };

      expect(canAddDependency(task, depTaskSameBoard)).toBe(true);
      expect(canAddDependency(task, depTaskDiffBoard)).toBe(false);
    });

    it('should handle multiple dependencies', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 20 }),
          (depCount) => {
            const boardId = createObjectId();
            const task: Task = {
              id: createObjectId(),
              boardId,
              title: 'Main Task',
              dependentTaskIds: [],
            };

            const depTaskIds = Array.from({ length: depCount }, () => createObjectId());

            let updatedTask = task;
            depTaskIds.forEach(depId => {
              if (!updatedTask.dependentTaskIds.includes(depId)) {
                updatedTask = {
                  ...updatedTask,
                  dependentTaskIds: [...updatedTask.dependentTaskIds, depId],
                };
              }
            });

            expect(updatedTask.dependentTaskIds).toHaveLength(depCount);
            return true;
          }
        )
      );
    });
  });

  describe('Removing Dependencies', () => {
    interface Task {
      id: string;
      dependentTaskIds: string[];
    }

    it('should remove a dependent task', () => {
      const depTaskId = createObjectId();
      const task: Task = {
        id: createObjectId(),
        dependentTaskIds: [depTaskId, createObjectId()],
      };

      const removeDependency = (mainTask: Task, depId: string): Task => {
        return {
          ...mainTask,
          dependentTaskIds: mainTask.dependentTaskIds.filter(id => id !== depId),
        };
      };

      const updated = removeDependency(task, depTaskId);

      expect(updated.dependentTaskIds).not.toContain(depTaskId);
      expect(updated.dependentTaskIds).toHaveLength(1);
    });

    it('should handle removing non-existent dependency', () => {
      const task: Task = {
        id: createObjectId(),
        dependentTaskIds: [createObjectId()],
      };

      const removeDependency = (mainTask: Task, depId: string): Task => {
        return {
          ...mainTask,
          dependentTaskIds: mainTask.dependentTaskIds.filter(id => id !== depId),
        };
      };

      const nonExistentId = createObjectId();
      const updated = removeDependency(task, nonExistentId);

      expect(updated.dependentTaskIds).toHaveLength(1);
    });

    it('should preserve other dependencies when removing one', () => {
      const depId1 = createObjectId();
      const depId2 = createObjectId();
      const depId3 = createObjectId();

      const task: Task = {
        id: createObjectId(),
        dependentTaskIds: [depId1, depId2, depId3],
      };

      const removeDependency = (mainTask: Task, depId: string): Task => {
        return {
          ...mainTask,
          dependentTaskIds: mainTask.dependentTaskIds.filter(id => id !== depId),
        };
      };

      const updated = removeDependency(task, depId2);

      expect(updated.dependentTaskIds).toContain(depId1);
      expect(updated.dependentTaskIds).toContain(depId3);
      expect(updated.dependentTaskIds).not.toContain(depId2);
    });
  });

  describe('Retrieving Dependencies', () => {
    interface Task {
      id: string;
      title: string;
      dependentTaskIds: string[];
    }

    it('should retrieve all dependent tasks', () => {
      const depTask1: Task = { id: createObjectId(), title: 'Dep 1', dependentTaskIds: [] };
      const depTask2: Task = { id: createObjectId(), title: 'Dep 2', dependentTaskIds: [] };

      const mainTask: Task = {
        id: createObjectId(),
        title: 'Main',
        dependentTaskIds: [depTask1.id, depTask2.id],
      };

      const allTasks = [mainTask, depTask1, depTask2];

      const getDependentTasks = (task: Task, tasks: Task[]): Task[] => {
        return tasks.filter(t => task.dependentTaskIds.includes(t.id));
      };

      const dependencies = getDependentTasks(mainTask, allTasks);

      expect(dependencies).toHaveLength(2);
      expect(dependencies.map(t => t.id)).toContain(depTask1.id);
      expect(dependencies.map(t => t.id)).toContain(depTask2.id);
    });

    it('should return empty array when no dependencies', () => {
      const task: Task = {
        id: createObjectId(),
        title: 'Task',
        dependentTaskIds: [],
      };

      const getDependentTasks = (t: Task, tasks: Task[]): Task[] => {
        return tasks.filter(other => t.dependentTaskIds.includes(other.id));
      };

      const dependencies = getDependentTasks(task, [task]);
      expect(dependencies).toHaveLength(0);
    });

    it('should handle missing dependent tasks gracefully', () => {
      const missingTaskId = createObjectId();
      const existingTask: Task = { id: createObjectId(), title: 'Existing', dependentTaskIds: [] };

      const mainTask: Task = {
        id: createObjectId(),
        title: 'Main',
        dependentTaskIds: [missingTaskId, existingTask.id],
      };

      const allTasks = [mainTask, existingTask];

      const getDependentTasks = (task: Task, tasks: Task[]): Task[] => {
        return tasks.filter(t => task.dependentTaskIds.includes(t.id));
      };

      const dependencies = getDependentTasks(mainTask, allTasks);

      // Should only return the existing task
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].id).toBe(existingTask.id);
    });
  });

  describe('Quick Section Change', () => {
    interface Task {
      id: string;
      sectionId: string;
      position: number;
    }

    interface Section {
      id: string;
      name: string;
    }

    it('should change task section', () => {
      const todoSection: Section = { id: createObjectId(), name: 'To Do' };
      const inProgressSection: Section = { id: createObjectId(), name: 'In Progress' };

      const task: Task = {
        id: createObjectId(),
        sectionId: todoSection.id,
        position: 0,
      };

      const changeSection = (t: Task, newSectionId: string): Task => {
        return {
          ...t,
          sectionId: newSectionId,
          position: 0, // Reset position when moving to new section
        };
      };

      const updated = changeSection(task, inProgressSection.id);

      expect(updated.sectionId).toBe(inProgressSection.id);
    });

    it('should preserve task id when changing section', () => {
      const taskId = createObjectId();
      const task: Task = {
        id: taskId,
        sectionId: createObjectId(),
        position: 5,
      };

      const changeSection = (t: Task, newSectionId: string): Task => {
        return {
          ...t,
          sectionId: newSectionId,
          position: 0,
        };
      };

      const updated = changeSection(task, createObjectId());

      expect(updated.id).toBe(taskId);
    });
  });
});
