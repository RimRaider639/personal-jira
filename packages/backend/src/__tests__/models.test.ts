/**
 * Mongoose Models Unit Tests
 *
 * These tests verify that the Mongoose models are correctly defined
 * and their validation logic works as expected.
 * Tests run without a database connection by testing schema validation.
 */

import mongoose from 'mongoose';
import { User, Board, Section, Epic, Task, PRIORITY_VALUES } from '../models';

describe('Mongoose Models', () => {
  describe('User Model', () => {
    it('should have required fields defined', () => {
      const userSchema = User.schema;
      expect(userSchema.path('email')).toBeDefined();
      expect(userSchema.path('passwordHash')).toBeDefined();
      expect(userSchema.path('displayName')).toBeDefined();
    });

    it('should have email as unique and required', () => {
      const emailPath = User.schema.path('email');
      expect(emailPath.options.required).toBeTruthy();
      expect(emailPath.options.unique).toBe(true);
    });

    it('should have timestamps enabled', () => {
      expect(User.schema.options.timestamps).toBe(true);
    });

    it('should validate email format', async () => {
      const user = new User({
        email: 'invalid-email',
        passwordHash: 'hash',
        displayName: 'Test User',
      });
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.email).toBeDefined();
    });

    it('should accept valid email format', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'hash',
        displayName: 'Test User',
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should have static method findByEmail', () => {
      expect(typeof User.findByEmail).toBe('function');
    });

    it('should have static method hashPassword', () => {
      expect(typeof User.hashPassword).toBe('function');
    });
  });

  describe('Board Model', () => {
    it('should have required fields defined', () => {
      const boardSchema = Board.schema;
      expect(boardSchema.path('userId')).toBeDefined();
      expect(boardSchema.path('name')).toBeDefined();
      expect(boardSchema.path('description')).toBeDefined();
      expect(boardSchema.path('color')).toBeDefined();
      expect(boardSchema.path('sectionOrder')).toBeDefined();
    });

    it('should require userId and name', () => {
      const board = new Board({});
      const error = board.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.userId).toBeDefined();
      expect(error?.errors.name).toBeDefined();
    });

    it('should have default color', () => {
      const board = new Board({
        userId: new mongoose.Types.ObjectId(),
        name: 'Test Board',
      });
      expect(board.color).toBe('#3b82f6');
    });

    it('should validate hex color format', () => {
      const board = new Board({
        userId: new mongoose.Types.ObjectId(),
        name: 'Test Board',
        color: 'invalid-color',
      });
      const error = board.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.color).toBeDefined();
    });

    it('should accept valid hex color', () => {
      const board = new Board({
        userId: new mongoose.Types.ObjectId(),
        name: 'Test Board',
        color: '#ff5733',
      });
      const error = board.validateSync();
      expect(error).toBeUndefined();
    });

    it('should have timestamps enabled', () => {
      expect(Board.schema.options.timestamps).toBe(true);
    });

    it('should have static method findByUserId', () => {
      expect(typeof Board.findByUserId).toBe('function');
    });
  });

  describe('Section Model', () => {
    it('should have required fields defined', () => {
      const sectionSchema = Section.schema;
      expect(sectionSchema.path('boardId')).toBeDefined();
      expect(sectionSchema.path('name')).toBeDefined();
      expect(sectionSchema.path('position')).toBeDefined();
    });

    it('should require boardId and name', () => {
      const section = new Section({});
      const error = section.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.boardId).toBeDefined();
      expect(error?.errors.name).toBeDefined();
    });

    it('should have default position of 0', () => {
      const section = new Section({
        boardId: new mongoose.Types.ObjectId(),
        name: 'Test Section',
      });
      expect(section.position).toBe(0);
    });

    it('should not allow negative position', () => {
      const section = new Section({
        boardId: new mongoose.Types.ObjectId(),
        name: 'Test Section',
        position: -1,
      });
      const error = section.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.position).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      expect(Section.schema.options.timestamps).toBe(true);
    });

    it('should have static method findByBoardId', () => {
      expect(typeof Section.findByBoardId).toBe('function');
    });

    it('should have static method getNextPosition', () => {
      expect(typeof Section.getNextPosition).toBe('function');
    });
  });

  describe('Epic Model', () => {
    it('should have required fields defined', () => {
      const epicSchema = Epic.schema;
      expect(epicSchema.path('boardId')).toBeDefined();
      expect(epicSchema.path('name')).toBeDefined();
      expect(epicSchema.path('description')).toBeDefined();
      expect(epicSchema.path('color')).toBeDefined();
    });

    it('should require boardId and name', () => {
      const epic = new Epic({});
      const error = epic.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.boardId).toBeDefined();
      expect(error?.errors.name).toBeDefined();
    });

    it('should have default color', () => {
      const epic = new Epic({
        boardId: new mongoose.Types.ObjectId(),
        name: 'Test Epic',
      });
      expect(epic.color).toBe('#6366f1');
    });

    it('should validate hex color format', () => {
      const epic = new Epic({
        boardId: new mongoose.Types.ObjectId(),
        name: 'Test Epic',
        color: 'not-a-color',
      });
      const error = epic.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.color).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      expect(Epic.schema.options.timestamps).toBe(true);
    });

    it('should have static method findByBoardId', () => {
      expect(typeof Epic.findByBoardId).toBe('function');
    });
  });

  describe('Task Model', () => {
    const validTaskData = {
      boardId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      title: 'Test Task',
    };

    it('should have required fields defined', () => {
      const taskSchema = Task.schema;
      expect(taskSchema.path('boardId')).toBeDefined();
      expect(taskSchema.path('sectionId')).toBeDefined();
      expect(taskSchema.path('title')).toBeDefined();
      expect(taskSchema.path('description')).toBeDefined();
      expect(taskSchema.path('priority')).toBeDefined();
      expect(taskSchema.path('storyPoints')).toBeDefined();
      expect(taskSchema.path('endDate')).toBeDefined();
      expect(taskSchema.path('position')).toBeDefined();
      expect(taskSchema.path('epicIds')).toBeDefined();
      expect(taskSchema.path('comments')).toBeDefined();
      expect(taskSchema.path('attachments')).toBeDefined();
    });

    it('should require boardId, sectionId, and title', () => {
      const task = new Task({});
      const error = task.validateSync();
      expect(error).toBeDefined();
      expect(error?.errors.boardId).toBeDefined();
      expect(error?.errors.sectionId).toBeDefined();
      expect(error?.errors.title).toBeDefined();
    });

    it('should have default position of 0', () => {
      const task = new Task(validTaskData);
      expect(task.position).toBe(0);
    });

    it('should have empty arrays for epicIds, comments, and attachments by default', () => {
      const task = new Task(validTaskData);
      expect(task.epicIds).toEqual([]);
      expect(task.comments).toEqual([]);
      expect(task.attachments).toEqual([]);
    });

    describe('Priority Validation', () => {
      it('should accept valid priority values', () => {
        PRIORITY_VALUES.forEach((priority) => {
          const task = new Task({ ...validTaskData, priority });
          const error = task.validateSync();
          expect(error).toBeUndefined();
        });
      });

      it('should accept null priority', () => {
        const task = new Task({ ...validTaskData, priority: null });
        const error = task.validateSync();
        expect(error).toBeUndefined();
      });

      it('should reject invalid priority values', () => {
        const task = new Task({ ...validTaskData, priority: 'invalid' });
        const error = task.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors.priority).toBeDefined();
      });

      it('should have all expected priority values', () => {
        expect(PRIORITY_VALUES).toEqual(['low', 'medium', 'high', 'critical']);
      });
    });

    describe('Story Points Validation', () => {
      it('should accept valid story points', () => {
        const task = new Task({ ...validTaskData, storyPoints: 5 });
        const error = task.validateSync();
        expect(error).toBeUndefined();
      });

      it('should accept null story points', () => {
        const task = new Task({ ...validTaskData, storyPoints: null });
        const error = task.validateSync();
        expect(error).toBeUndefined();
      });

      it('should accept zero story points', () => {
        const task = new Task({ ...validTaskData, storyPoints: 0 });
        const error = task.validateSync();
        expect(error).toBeUndefined();
      });

      it('should reject negative story points', () => {
        const task = new Task({ ...validTaskData, storyPoints: -1 });
        const error = task.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors.storyPoints).toBeDefined();
      });

      it('should reject story points over 100', () => {
        const task = new Task({ ...validTaskData, storyPoints: 101 });
        const error = task.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors.storyPoints).toBeDefined();
      });

      it('should reject non-integer story points', () => {
        const task = new Task({ ...validTaskData, storyPoints: 5.5 });
        const error = task.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors.storyPoints).toBeDefined();
      });
    });

    describe('Position Validation', () => {
      it('should accept valid position', () => {
        const task = new Task({ ...validTaskData, position: 5 });
        const error = task.validateSync();
        expect(error).toBeUndefined();
      });

      it('should reject negative position', () => {
        const task = new Task({ ...validTaskData, position: -1 });
        const error = task.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors.position).toBeDefined();
      });

      it('should reject non-integer position', () => {
        const task = new Task({ ...validTaskData, position: 1.5 });
        const error = task.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors.position).toBeDefined();
      });
    });

    describe('Embedded Comments', () => {
      it('should have addComment instance method', () => {
        const task = new Task(validTaskData);
        expect(typeof task.addComment).toBe('function');
      });

      it('should have removeComment instance method', () => {
        const task = new Task(validTaskData);
        expect(typeof task.removeComment).toBe('function');
      });

      it('should add comment with addComment method', () => {
        const task = new Task(validTaskData);
        const comment = task.addComment('Test comment');
        expect(comment).toBeDefined();
        expect(comment.content).toBe('Test comment');
        expect(comment._id).toBeDefined();
        expect(comment.createdAt).toBeDefined();
        expect(task.comments.length).toBe(1);
      });

      it('should remove comment with removeComment method', () => {
        const task = new Task(validTaskData);
        const comment = task.addComment('Test comment');
        const result = task.removeComment(comment._id);
        expect(result).toBe(true);
        expect(task.comments.length).toBe(0);
      });

      it('should return false when removing non-existent comment', () => {
        const task = new Task(validTaskData);
        const result = task.removeComment(new mongoose.Types.ObjectId());
        expect(result).toBe(false);
      });
    });

    describe('Embedded Attachments', () => {
      it('should have addAttachment instance method', () => {
        const task = new Task(validTaskData);
        expect(typeof task.addAttachment).toBe('function');
      });

      it('should have removeAttachment instance method', () => {
        const task = new Task(validTaskData);
        expect(typeof task.removeAttachment).toBe('function');
      });

      it('should add attachment with addAttachment method', () => {
        const task = new Task(validTaskData);
        const attachment = task.addAttachment({
          filename: 'test.pdf',
          url: 'https://example.com/test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          cloudinaryPublicId: 'kanban-attachments/test_123',
        });
        expect(attachment).toBeDefined();
        expect(attachment.filename).toBe('test.pdf');
        expect(attachment._id).toBeDefined();
        expect(attachment.createdAt).toBeDefined();
        expect(attachment.cloudinaryPublicId).toBe('kanban-attachments/test_123');
        expect(task.attachments.length).toBe(1);
      });

      it('should remove attachment with removeAttachment method', () => {
        const task = new Task(validTaskData);
        const attachment = task.addAttachment({
          filename: 'test.pdf',
          url: 'https://example.com/test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          cloudinaryPublicId: 'kanban-attachments/test_123',
        });
        const result = task.removeAttachment(attachment._id);
        expect(result).toBe(true);
        expect(task.attachments.length).toBe(0);
      });

      it('should return false when removing non-existent attachment', () => {
        const task = new Task(validTaskData);
        const result = task.removeAttachment(new mongoose.Types.ObjectId());
        expect(result).toBe(false);
      });
    });

    it('should have timestamps enabled', () => {
      expect(Task.schema.options.timestamps).toBe(true);
    });

    it('should have static method findBySectionId', () => {
      expect(typeof Task.findBySectionId).toBe('function');
    });

    it('should have static method findByBoardId', () => {
      expect(typeof Task.findByBoardId).toBe('function');
    });

    it('should have static method findByEpicIds', () => {
      expect(typeof Task.findByEpicIds).toBe('function');
    });

    it('should have static method getNextPosition', () => {
      expect(typeof Task.getNextPosition).toBe('function');
    });

    it('should have text index on title and description', () => {
      const indexes = Task.schema.indexes();
      const textIndex = indexes.find(
        (idx: [Record<string, unknown>, unknown]) => idx[0].title === 'text' && idx[0].description === 'text'
      );
      expect(textIndex).toBeDefined();
    });
  });

  describe('Model Relationships', () => {
    it('Board should reference User', () => {
      const userIdPath = Board.schema.path('userId');
      expect(userIdPath.options.ref).toBe('User');
    });

    it('Section should reference Board', () => {
      const boardIdPath = Section.schema.path('boardId');
      expect(boardIdPath.options.ref).toBe('Board');
    });

    it('Epic should reference Board', () => {
      const boardIdPath = Epic.schema.path('boardId');
      expect(boardIdPath.options.ref).toBe('Board');
    });

    it('Task should reference Board and Section', () => {
      const boardIdPath = Task.schema.path('boardId');
      const sectionIdPath = Task.schema.path('sectionId');
      expect(boardIdPath.options.ref).toBe('Board');
      expect(sectionIdPath.options.ref).toBe('Section');
    });

    it('Task epicIds should reference Epic', () => {
      const epicIdsPath = Task.schema.path('epicIds');
      // epicIds is an array, so we need to check the embeddedSchemaType
      expect(epicIdsPath).toBeDefined();
      // Access the embedded schema type which contains the ref
      const arrayPath = epicIdsPath as unknown as { embeddedSchemaType: { options: { ref: string } } };
      expect(arrayPath.embeddedSchemaType?.options?.ref).toBe('Epic');
    });
  });
});
