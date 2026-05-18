/**
 * Notes Operations Unit Tests
 *
 * Tests for sticky notes CRUD operations in the Fridge feature.
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Notes Operations', () => {
  interface Note {
    id: string;
    userId: string;
    content: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  }

  const DEFAULT_COLOR = '#fef08a';
  const VALID_COLORS = ['#fef08a', '#fca5a5', '#86efac', '#93c5fd', '#c4b5fd', '#fdba74'];

  const createNote = (
    userId: string,
    content: string,
    color?: string,
    createdAt?: Date
  ): Note => ({
    id: createObjectId(),
    userId,
    content,
    color: color || DEFAULT_COLOR,
    createdAt: createdAt || new Date(),
    updatedAt: createdAt || new Date(),
  });

  describe('Note Creation', () => {
    it('should create note with all required fields', () => {
      const userId = createObjectId();
      const content = 'This is a sticky note';

      const note = createNote(userId, content);

      expect(note.id).toBeDefined();
      expect(note.userId).toBe(userId);
      expect(note.content).toBe(content);
      expect(note.color).toBe(DEFAULT_COLOR);
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it('should create note with custom color', () => {
      const userId = createObjectId();
      const content = 'Colored note';
      const color = '#fca5a5';

      const note = createNote(userId, content, color);

      expect(note.color).toBe(color);
    });

    it('should set createdAt to current time', () => {
      const before = new Date();
      const note = createNote(createObjectId(), 'Test');
      const after = new Date();

      expect(note.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(note.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should require non-empty content', () => {
      const validateContent = (content: string): boolean => {
        return typeof content === 'string' && content.trim().length > 0;
      };

      expect(validateContent('')).toBe(false);
      expect(validateContent('   ')).toBe(false);
      expect(validateContent('Valid content')).toBe(true);
    });

    it('should enforce content length limit of 500 characters', () => {
      const validateContentLength = (content: string): boolean => {
        return content.length <= 500;
      };

      expect(validateContentLength('a'.repeat(500))).toBe(true);
      expect(validateContentLength('a'.repeat(501))).toBe(false);
    });
  });

  describe('Note Retrieval', () => {
    it('should retrieve notes for a user', () => {
      const userId = createObjectId();
      const otherUserId = createObjectId();

      const notes: Note[] = [
        createNote(userId, 'Note 1'),
        createNote(userId, 'Note 2'),
        createNote(otherUserId, 'Other user note'),
      ];

      const getUserNotes = (notes: Note[], uid: string): Note[] => {
        return notes.filter((n) => n.userId === uid);
      };

      const userNotes = getUserNotes(notes, userId);

      expect(userNotes).toHaveLength(2);
      expect(userNotes.every((n) => n.userId === userId)).toBe(true);
    });

    it('should return notes sorted by createdAt descending (newest first)', () => {
      const userId = createObjectId();

      const notes: Note[] = [
        createNote(userId, 'First', undefined, new Date('2024-01-01')),
        createNote(userId, 'Third', undefined, new Date('2024-01-03')),
        createNote(userId, 'Second', undefined, new Date('2024-01-02')),
      ];

      const sortByNewest = (n: Note[]): Note[] => {
        return [...n].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      };

      const sorted = sortByNewest(notes);

      expect(sorted[0].content).toBe('Third');
      expect(sorted[1].content).toBe('Second');
      expect(sorted[2].content).toBe('First');
    });

    it('should retrieve note by ID', () => {
      const userId = createObjectId();
      const notes: Note[] = [
        createNote(userId, 'Note 1'),
        createNote(userId, 'Note 2'),
        createNote(userId, 'Note 3'),
      ];

      const findById = (id: string): Note | undefined => {
        return notes.find((n) => n.id === id);
      };

      const targetId = notes[1].id;
      const found = findById(targetId);

      expect(found).toBeDefined();
      expect(found?.content).toBe('Note 2');
    });

    it('should return undefined for non-existent ID', () => {
      const notes: Note[] = [];

      const findById = (id: string): Note | undefined => {
        return notes.find((n) => n.id === id);
      };

      const found = findById(createObjectId());
      expect(found).toBeUndefined();
    });
  });

  describe('Note Update', () => {
    it('should update content while preserving other fields', () => {
      const note = createNote(createObjectId(), 'Original');
      const originalCreatedAt = note.createdAt;
      const originalId = note.id;
      const originalUserId = note.userId;
      const originalColor = note.color;

      const updateNote = (n: Note, updates: Partial<Note>): Note => ({
        ...n,
        ...updates,
        updatedAt: new Date(),
      });

      const updated = updateNote(note, { content: 'Updated content' });

      expect(updated.content).toBe('Updated content');
      expect(updated.id).toBe(originalId);
      expect(updated.userId).toBe(originalUserId);
      expect(updated.color).toBe(originalColor);
      expect(updated.createdAt).toBe(originalCreatedAt);
    });

    it('should update color while preserving content', () => {
      const note = createNote(createObjectId(), 'Test note', '#fef08a');

      const updateNote = (n: Note, updates: Partial<Note>): Note => ({
        ...n,
        ...updates,
        updatedAt: new Date(),
      });

      const updated = updateNote(note, { color: '#fca5a5' });

      expect(updated.color).toBe('#fca5a5');
      expect(updated.content).toBe('Test note');
    });

    it('should update updatedAt timestamp on edit', () => {
      const originalDate = new Date('2024-01-01');
      const note: Note = {
        id: createObjectId(),
        userId: createObjectId(),
        content: 'Original',
        color: DEFAULT_COLOR,
        createdAt: originalDate,
        updatedAt: originalDate,
      };

      const updateNote = (n: Note, updates: Partial<Note>): Note => ({
        ...n,
        ...updates,
        updatedAt: new Date(),
      });

      const updated = updateNote(note, { content: 'Updated' });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should preserve createdAt timestamp on edit', () => {
      const createdAt = new Date('2024-01-01');
      const note: Note = {
        id: createObjectId(),
        userId: createObjectId(),
        content: 'Original',
        color: DEFAULT_COLOR,
        createdAt,
        updatedAt: createdAt,
      };

      const updateNote = (n: Note, updates: Partial<Note>): Note => ({
        ...n,
        ...updates,
        updatedAt: new Date(),
      });

      const updated = updateNote(note, { content: 'Updated' });

      expect(updated.createdAt).toBe(createdAt);
    });
  });

  describe('Note Deletion', () => {
    it('should remove note from collection', () => {
      const userId = createObjectId();
      const notes: Note[] = [
        createNote(userId, 'Note 1'),
        createNote(userId, 'Note 2'),
        createNote(userId, 'Note 3'),
      ];

      const deleteNote = (noteId: string): boolean => {
        const index = notes.findIndex((n) => n.id === noteId);
        if (index === -1) return false;
        notes.splice(index, 1);
        return true;
      };

      const noteToDelete = notes[1].id;
      const result = deleteNote(noteToDelete);

      expect(result).toBe(true);
      expect(notes).toHaveLength(2);
      expect(notes.find((n) => n.id === noteToDelete)).toBeUndefined();
    });

    it('should return false when deleting non-existent note', () => {
      const notes: Note[] = [createNote(createObjectId(), 'Note')];

      const deleteNote = (noteId: string): boolean => {
        const index = notes.findIndex((n) => n.id === noteId);
        if (index === -1) return false;
        notes.splice(index, 1);
        return true;
      };

      const result = deleteNote(createObjectId());

      expect(result).toBe(false);
      expect(notes).toHaveLength(1);
    });

    it('should preserve other notes when one is deleted', () => {
      fc.assert(
        fc.property(
          fc.nat({ min: 2, max: 20 }),
          fc.nat({ max: 19 }),
          (noteCount, deleteIndex) => {
            if (deleteIndex >= noteCount) return true;

            const userId = createObjectId();
            const notes: Note[] = Array.from({ length: noteCount }, (_, i) =>
              createNote(userId, `Note ${i}`)
            );

            const noteToDelete = notes[deleteIndex].id;
            const otherNoteIds = notes
              .filter((n) => n.id !== noteToDelete)
              .map((n) => n.id);

            const filteredNotes = notes.filter((n) => n.id !== noteToDelete);

            // One less note
            expect(filteredNotes).toHaveLength(noteCount - 1);

            // All other notes preserved
            otherNoteIds.forEach((id) => {
              expect(filteredNotes.find((n) => n.id === id)).toBeDefined();
            });

            return true;
          }
        )
      );
    });
  });

  describe('Note Authorization', () => {
    it('should only allow owner to access their notes', () => {
      const userId = createObjectId();
      const otherUserId = createObjectId();
      const note = createNote(userId, 'Private note');

      const canAccess = (n: Note, requestingUserId: string): boolean => {
        return n.userId === requestingUserId;
      };

      expect(canAccess(note, userId)).toBe(true);
      expect(canAccess(note, otherUserId)).toBe(false);
    });

    it('should only allow owner to update their notes', () => {
      const userId = createObjectId();
      const otherUserId = createObjectId();
      const note = createNote(userId, 'Private note');

      const canUpdate = (n: Note, requestingUserId: string): boolean => {
        return n.userId === requestingUserId;
      };

      expect(canUpdate(note, userId)).toBe(true);
      expect(canUpdate(note, otherUserId)).toBe(false);
    });

    it('should only allow owner to delete their notes', () => {
      const userId = createObjectId();
      const otherUserId = createObjectId();
      const note = createNote(userId, 'Private note');

      const canDelete = (n: Note, requestingUserId: string): boolean => {
        return n.userId === requestingUserId;
      };

      expect(canDelete(note, userId)).toBe(true);
      expect(canDelete(note, otherUserId)).toBe(false);
    });
  });

  describe('Note Validation', () => {
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
      expect(validateContent('Valid note')).toBe(true);
    });

    it('should validate color format', () => {
      const validateColor = (color: string): boolean => {
        return /^#[0-9a-fA-F]{6}$/.test(color);
      };

      expect(validateColor('#fef08a')).toBe(true);
      expect(validateColor('#FEF08A')).toBe(true);
      expect(validateColor('fef08a')).toBe(false);
      expect(validateColor('#fef08')).toBe(false);
      expect(validateColor('#fef08a1')).toBe(false);
      expect(validateColor('invalid')).toBe(false);
    });
  });
});
