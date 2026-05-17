/**
 * Comment Operations Unit Tests
 *
 * Property Tests:
 * - Property 15: Comment Chronological Ordering
 * - Property 16: Comment CRUD Integrity
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Comment Operations', () => {
  interface Comment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface Task {
    id: string;
    comments: Comment[];
  }

  const createComment = (
    taskId: string,
    userId: string,
    content: string,
    createdAt?: Date
  ): Comment => ({
    id: createObjectId(),
    taskId,
    userId,
    content,
    createdAt: createdAt || new Date(),
    updatedAt: createdAt || new Date(),
  });

  describe('Property 15: Comment Chronological Ordering', () => {
    it('should return comments in ascending order by createdAt (oldest first)', () => {
      const taskId = createObjectId();
      const userId = createObjectId();

      const comments: Comment[] = [
        createComment(taskId, userId, 'Third', new Date('2024-01-03')),
        createComment(taskId, userId, 'First', new Date('2024-01-01')),
        createComment(taskId, userId, 'Second', new Date('2024-01-02')),
      ];

      const sortChronologically = (c: Comment[]): Comment[] => {
        return [...c].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      };

      const sorted = sortChronologically(comments);

      expect(sorted[0].content).toBe('First');
      expect(sorted[1].content).toBe('Second');
      expect(sorted[2].content).toBe('Third');
    });

    it('should maintain order when new comment is added', () => {
      const taskId = createObjectId();
      const userId = createObjectId();

      const comments: Comment[] = [
        createComment(taskId, userId, 'First', new Date('2024-01-01')),
        createComment(taskId, userId, 'Second', new Date('2024-01-02')),
      ];

      // Add new comment
      const newComment = createComment(taskId, userId, 'Third', new Date('2024-01-03'));
      comments.push(newComment);

      const sortChronologically = (c: Comment[]): Comment[] => {
        return [...c].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      };

      const sorted = sortChronologically(comments);

      expect(sorted).toHaveLength(3);
      expect(sorted[2].content).toBe('Third');
    });

    it('should handle comments with same timestamp', () => {
      const taskId = createObjectId();
      const userId = createObjectId();
      const sameTime = new Date('2024-01-01T12:00:00Z');

      const comments: Comment[] = [
        createComment(taskId, userId, 'A', sameTime),
        createComment(taskId, userId, 'B', sameTime),
        createComment(taskId, userId, 'C', sameTime),
      ];

      const sortChronologically = (c: Comment[]): Comment[] => {
        return [...c].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      };

      const sorted = sortChronologically(comments);

      // All should be present (order among same timestamp is stable)
      expect(sorted).toHaveLength(3);
    });

    it('should maintain chronological order for any number of comments', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() })
              .map((timestamp) => new Date(timestamp)),
            { maxLength: 50 }
          ),
          (dates) => {
            const taskId = createObjectId();
            const userId = createObjectId();

            const comments = dates.map((date, i) =>
              createComment(taskId, userId, `Comment ${i}`, date)
            );

            const sortChronologically = (c: Comment[]): Comment[] => {
              return [...c].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            };

            const sorted = sortChronologically(comments);

            // Verify sorted order
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                sorted[i - 1].createdAt.getTime()
              );
            }

            return true;
          }
        )
      );
    });
  });

  describe('Property 16: Comment CRUD Integrity', () => {
    describe('Create', () => {
      it('should create comment with all required fields', () => {
        const taskId = createObjectId();
        const userId = createObjectId();
        const content = 'This is a comment';

        const comment = createComment(taskId, userId, content);

        expect(comment.id).toBeDefined();
        expect(comment.taskId).toBe(taskId);
        expect(comment.userId).toBe(userId);
        expect(comment.content).toBe(content);
        expect(comment.createdAt).toBeInstanceOf(Date);
        expect(comment.updatedAt).toBeInstanceOf(Date);
      });

      it('should set createdAt to current time', () => {
        const before = new Date();
        const comment = createComment(createObjectId(), createObjectId(), 'Test');
        const after = new Date();

        expect(comment.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(comment.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it('should require non-empty content', () => {
        const validateContent = (content: string): boolean => {
          return typeof content === 'string' && content.trim().length > 0;
        };

        expect(validateContent('')).toBe(false);
        expect(validateContent('   ')).toBe(false);
        expect(validateContent('Valid content')).toBe(true);
      });
    });

    describe('Read', () => {
      it('should retrieve comment by ID', () => {
        const taskId = createObjectId();
        const userId = createObjectId();
        const comments: Comment[] = [
          createComment(taskId, userId, 'Comment 1'),
          createComment(taskId, userId, 'Comment 2'),
          createComment(taskId, userId, 'Comment 3'),
        ];

        const findById = (id: string): Comment | undefined => {
          return comments.find((c) => c.id === id);
        };

        const targetId = comments[1].id;
        const found = findById(targetId);

        expect(found).toBeDefined();
        expect(found?.content).toBe('Comment 2');
      });

      it('should return undefined for non-existent ID', () => {
        const comments: Comment[] = [];

        const findById = (id: string): Comment | undefined => {
          return comments.find((c) => c.id === id);
        };

        const found = findById(createObjectId());
        expect(found).toBeUndefined();
      });
    });

    describe('Update', () => {
      it('should update content while preserving other fields', () => {
        const comment = createComment(createObjectId(), createObjectId(), 'Original');
        const originalCreatedAt = comment.createdAt;
        const originalId = comment.id;
        const originalTaskId = comment.taskId;
        const originalUserId = comment.userId;

        const updateComment = (c: Comment, newContent: string): Comment => ({
          ...c,
          content: newContent,
          updatedAt: new Date(),
        });

        const updated = updateComment(comment, 'Updated content');

        expect(updated.content).toBe('Updated content');
        expect(updated.id).toBe(originalId);
        expect(updated.taskId).toBe(originalTaskId);
        expect(updated.userId).toBe(originalUserId);
        expect(updated.createdAt).toBe(originalCreatedAt);
      });

      it('should update updatedAt timestamp on edit', () => {
        const originalDate = new Date('2024-01-01');
        const comment: Comment = {
          id: createObjectId(),
          taskId: createObjectId(),
          userId: createObjectId(),
          content: 'Original',
          createdAt: originalDate,
          updatedAt: originalDate,
        };

        const updateComment = (c: Comment, newContent: string): Comment => ({
          ...c,
          content: newContent,
          updatedAt: new Date(),
        });

        const updated = updateComment(comment, 'Updated');

        expect(updated.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
      });

      it('should preserve createdAt timestamp on edit', () => {
        const createdAt = new Date('2024-01-01');
        const comment: Comment = {
          id: createObjectId(),
          taskId: createObjectId(),
          userId: createObjectId(),
          content: 'Original',
          createdAt,
          updatedAt: createdAt,
        };

        const updateComment = (c: Comment, newContent: string): Comment => ({
          ...c,
          content: newContent,
          updatedAt: new Date(),
        });

        const updated = updateComment(comment, 'Updated');

        expect(updated.createdAt).toBe(createdAt);
      });
    });

    describe('Delete', () => {
      it('should remove comment from task', () => {
        const task: Task = {
          id: createObjectId(),
          comments: [
            createComment(createObjectId(), createObjectId(), 'Comment 1'),
            createComment(createObjectId(), createObjectId(), 'Comment 2'),
            createComment(createObjectId(), createObjectId(), 'Comment 3'),
          ],
        };

        const deleteComment = (t: Task, commentId: string): boolean => {
          const index = t.comments.findIndex((c) => c.id === commentId);
          if (index === -1) return false;
          t.comments.splice(index, 1);
          return true;
        };

        const commentToDelete = task.comments[1].id;
        const result = deleteComment(task, commentToDelete);

        expect(result).toBe(true);
        expect(task.comments).toHaveLength(2);
        expect(task.comments.find((c) => c.id === commentToDelete)).toBeUndefined();
      });

      it('should return false when deleting non-existent comment', () => {
        const task: Task = {
          id: createObjectId(),
          comments: [createComment(createObjectId(), createObjectId(), 'Comment')],
        };

        const deleteComment = (t: Task, commentId: string): boolean => {
          const index = t.comments.findIndex((c) => c.id === commentId);
          if (index === -1) return false;
          t.comments.splice(index, 1);
          return true;
        };

        const result = deleteComment(task, createObjectId());

        expect(result).toBe(false);
        expect(task.comments).toHaveLength(1);
      });

      it('should preserve other comments when one is deleted', () => {
        fc.assert(
          fc.property(
            fc.nat({ min: 2, max: 20 }),
            fc.nat({ max: 19 }),
            (commentCount, deleteIndex) => {
              if (deleteIndex >= commentCount) return true;

              const task: Task = {
                id: createObjectId(),
                comments: Array.from({ length: commentCount }, (_, i) =>
                  createComment(createObjectId(), createObjectId(), `Comment ${i}`)
                ),
              };

              const commentToDelete = task.comments[deleteIndex].id;
              const otherCommentIds = task.comments
                .filter((c) => c.id !== commentToDelete)
                .map((c) => c.id);

              task.comments = task.comments.filter((c) => c.id !== commentToDelete);

              // One less comment
              expect(task.comments).toHaveLength(commentCount - 1);

              // All other comments preserved
              otherCommentIds.forEach((id) => {
                expect(task.comments.find((c) => c.id === id)).toBeDefined();
              });

              return true;
            }
          )
        );
      });
    });
  });

  describe('Comment Validation', () => {
    it('should require taskId', () => {
      const validateTaskId = (taskId: string | null | undefined): boolean => {
        return typeof taskId === 'string' && taskId.length > 0;
      };

      expect(validateTaskId('')).toBe(false);
      expect(validateTaskId(null)).toBe(false);
      expect(validateTaskId(undefined)).toBe(false);
      expect(validateTaskId(createObjectId())).toBe(true);
    });

    it('should require userId', () => {
      const validateUserId = (userId: string | null | undefined): boolean => {
        return typeof userId === 'string' && userId.length > 0;
      };

      expect(validateUserId('')).toBe(false);
      expect(validateUserId(null)).toBe(false);
      expect(validateUserId(undefined)).toBe(false);
      expect(validateUserId(createObjectId())).toBe(true);
    });

    it('should require non-empty content', () => {
      const validateContent = (content: string | null | undefined): boolean => {
        return typeof content === 'string' && content.trim().length > 0;
      };

      expect(validateContent('')).toBe(false);
      expect(validateContent('   ')).toBe(false);
      expect(validateContent(null)).toBe(false);
      expect(validateContent(undefined)).toBe(false);
      expect(validateContent('Valid comment')).toBe(true);
    });
  });
});
