import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Note from '../models/Note';

const router = Router();

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const notes = await Note.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ isDone: 1, position: 1, createdAt: -1 });

      res.status(200).json({
        success: true,
        data: notes,
        count: notes.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/notes
 * Create a new note
 */
router.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const { content, color } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw createError('Note content is required', 400);
      }

      if (content.length > 500) {
        throw createError('Note content cannot exceed 500 characters', 400);
      }

      const note = new Note({
        userId: new mongoose.Types.ObjectId(userId),
        content: content.trim(),
        color: color || '#fef08a',
      });

      await note.save();

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/notes/:id
 * Update a note
 */
router.put(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const noteId = req.params.id as string;
      if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
        throw createError('Invalid note ID', 400);
      }

      const note = await Note.findById(noteId);
      if (!note) {
        throw createError('Note not found', 404);
      }

      if (note.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      const { content, color, isDone } = req.body;

      if (content !== undefined) {
        if (typeof content !== 'string' || content.trim().length === 0) {
          throw createError('Note content cannot be empty', 400);
        }
        if (content.length > 500) {
          throw createError('Note content cannot exceed 500 characters', 400);
        }
        note.content = content.trim();
      }

      if (color !== undefined) {
        note.color = color;
      }

      if (isDone !== undefined) {
        note.isDone = Boolean(isDone);
      }

      await note.save();

      res.status(200).json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const noteId = req.params.id as string;
      if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
        throw createError('Invalid note ID', 400);
      }

      const note = await Note.findById(noteId);
      if (!note) {
        throw createError('Note not found', 404);
      }

      if (note.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      await Note.findByIdAndDelete(noteId);

      res.status(200).json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/notes/reorder
 * Reorder notes
 */
router.put(
  '/reorder',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const { noteIds } = req.body;

      if (!Array.isArray(noteIds)) {
        throw createError('noteIds must be an array', 400);
      }

      // Validate all note IDs
      for (const noteId of noteIds) {
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
          throw createError(`Invalid note ID: ${noteId}`, 400);
        }
      }

      // Verify all notes belong to the user
      const notes = await Note.find({
        _id: { $in: noteIds.map(id => new mongoose.Types.ObjectId(id)) },
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (notes.length !== noteIds.length) {
        throw createError('Some notes not found or access denied', 400);
      }

      // Update positions
      const bulkOps = noteIds.map((noteId: string, index: number) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(noteId) },
          update: { $set: { position: index } },
        },
      }));

      await Note.bulkWrite(bulkOps);

      // Fetch updated notes
      const updatedNotes = await Note.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ isDone: 1, position: 1, createdAt: -1 });

      res.status(200).json({
        success: true,
        data: updatedNotes,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
