import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Board from '../models/Board';
import Epic from '../models/Epic';
import Task from '../models/Task';

const router = Router();

/**
 * Hex color validation regex
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Helper function to verify board ownership
 * Returns the board if the user owns it, throws an error otherwise
 */
async function verifyBoardOwnership(
  boardId: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<mongoose.Document> {
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    throw createError('Invalid board ID', 400);
  }

  const query = Board.findById(boardId);
  if (session) {
    query.session(session);
  }
  const board = await query;

  if (!board) {
    throw createError('Board not found', 404);
  }

  if (board.userId.toString() !== userId) {
    throw createError('Access denied', 403);
  }

  return board;
}

/**
 * Helper function to verify epic ownership through board
 * Returns the epic and board if the user owns the board
 */
async function verifyEpicOwnership(
  epicId: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<{ epic: mongoose.Document; board: mongoose.Document }> {
  if (!mongoose.Types.ObjectId.isValid(epicId)) {
    throw createError('Invalid epic ID', 400);
  }

  const query = Epic.findById(epicId);
  if (session) {
    query.session(session);
  }
  const epic = await query;

  if (!epic) {
    throw createError('Epic not found', 404);
  }

  const board = await verifyBoardOwnership(
    (epic as unknown as { boardId: mongoose.Types.ObjectId }).boardId.toString(),
    userId,
    session
  );

  return { epic, board };
}

/**
 * GET /api/boards/:boardId/epics
 * List all epics for a board
 */
router.get(
  '/boards/:boardId/epics',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.boardId as string;

      if (!boardId) {
        throw createError('Board ID is required', 400);
      }

      // Verify board ownership
      await verifyBoardOwnership(boardId, userId);

      // Get epics for the board
      const epics = await Epic.findByBoardId(boardId);

      res.status(200).json({
        success: true,
        data: epics,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/boards/:boardId/epics
 * Create a new epic in a board
 */
router.post(
  '/boards/:boardId/epics',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.boardId as string;
      const { name, description, color } = req.body;

      if (!boardId) {
        throw createError('Board ID is required', 400);
      }

      // Validate name
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw createError('Epic name is required', 400);
      }

      if (name.trim().length > 100) {
        throw createError('Epic name cannot exceed 100 characters', 400);
      }

      // Validate description
      if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
          throw createError('Description must be a string', 400);
        }
        if (description.length > 500) {
          throw createError('Epic description cannot exceed 500 characters', 400);
        }
      }

      // Validate color
      if (color !== undefined && color !== null) {
        if (typeof color !== 'string' || !HEX_COLOR_REGEX.test(color)) {
          throw createError('Color must be a valid hex color (e.g., #6366f1)', 400);
        }
      }

      // Verify board ownership
      await verifyBoardOwnership(boardId, userId);

      // Create the epic
      const epic = new Epic({
        boardId: new mongoose.Types.ObjectId(boardId),
        name: name.trim(),
        description: description?.trim() || null,
        color: color || undefined, // Let the model use default if not provided
      });

      await epic.save();

      res.status(201).json({
        success: true,
        data: epic,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/epics/:id
 * Update an epic (name, description, color)
 */
router.put(
  '/epics/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const id = req.params.id as string;
      const { name, description, color } = req.body;

      if (!id) {
        throw createError('Epic ID is required', 400);
      }

      // Verify epic ownership through board
      const { epic } = await verifyEpicOwnership(id, userId);

      const epicDoc = epic as unknown as {
        name: string;
        description: string | null;
        color: string;
        save: () => Promise<void>;
      };

      // Update name if provided
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          throw createError('Epic name cannot be empty', 400);
        }
        if (name.trim().length > 100) {
          throw createError('Epic name cannot exceed 100 characters', 400);
        }
        epicDoc.name = name.trim();
      }

      // Update description if provided
      if (description !== undefined) {
        if (description !== null && typeof description !== 'string') {
          throw createError('Description must be a string or null', 400);
        }
        if (description && description.length > 500) {
          throw createError('Epic description cannot exceed 500 characters', 400);
        }
        epicDoc.description = description?.trim() || null;
      }

      // Update color if provided
      if (color !== undefined) {
        if (color !== null && (typeof color !== 'string' || !HEX_COLOR_REGEX.test(color))) {
          throw createError('Color must be a valid hex color (e.g., #6366f1)', 400);
        }
        if (color) {
          epicDoc.color = color;
        }
      }

      await epicDoc.save();

      res.status(200).json({
        success: true,
        data: epic,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/epics/:id
 * Delete an epic
 * Tasks are preserved - the epic ID is removed from tasks' epicIds array
 */
router.delete(
  '/epics/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const id = req.params.id as string;

      if (!id) {
        throw createError('Epic ID is required', 400);
      }

      // Verify epic ownership through board
      await verifyEpicOwnership(id, userId, session);

      // Remove the epic ID from all tasks that reference it
      await Task.updateMany(
        { epicIds: new mongoose.Types.ObjectId(id) },
        { $pull: { epicIds: new mongoose.Types.ObjectId(id) } },
        { session }
      );

      // Delete the epic
      await Epic.findByIdAndDelete(id).session(session);

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Epic deleted successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
);

export default router;
