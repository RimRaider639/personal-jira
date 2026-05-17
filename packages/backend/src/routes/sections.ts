import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Board from '../models/Board';
import Section from '../models/Section';
import Task from '../models/Task';

const router = Router();

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
 * Helper function to verify section ownership through board
 * Returns the section and board if the user owns the board
 */
async function verifySectionOwnership(
  sectionId: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<{ section: mongoose.Document; board: mongoose.Document }> {
  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    throw createError('Invalid section ID', 400);
  }

  const query = Section.findById(sectionId);
  if (session) {
    query.session(session);
  }
  const section = await query;

  if (!section) {
    throw createError('Section not found', 404);
  }

  const board = await verifyBoardOwnership(
    (section as unknown as { boardId: mongoose.Types.ObjectId }).boardId.toString(),
    userId,
    session
  );

  return { section, board };
}

/**
 * GET /api/boards/:boardId/sections
 * List all sections for a board, ordered by position
 */
router.get(
  '/boards/:boardId/sections',
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

      // Get sections ordered by position
      const sections = await Section.findByBoardId(boardId);

      res.status(200).json({
        success: true,
        data: sections,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/boards/:boardId/sections
 * Create a new section in a board
 */
router.post(
  '/boards/:boardId/sections',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.boardId as string;
      const { name } = req.body;

      if (!boardId) {
        throw createError('Board ID is required', 400);
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw createError('Section name is required', 400);
      }

      // Verify board ownership
      const board = await verifyBoardOwnership(boardId, userId, session);

      // Get the next position for the new section
      const position = await Section.getNextPosition(boardId);

      // Create the section
      const section = new Section({
        boardId,
        name: name.trim(),
        position,
      });

      await section.save({ session });

      // Add section to board's sectionOrder
      const boardDoc = board as unknown as {
        sectionOrder: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };
      boardDoc.sectionOrder.push(section._id as mongoose.Types.ObjectId);
      await boardDoc.save({ session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        data: section,
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
);

/**
 * PUT /api/sections/:id
 * Update a section (rename)
 */
router.put(
  '/sections/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const id = req.params.id as string;
      const { name } = req.body;

      if (!id) {
        throw createError('Section ID is required', 400);
      }

      // Verify section ownership through board
      const { section } = await verifySectionOwnership(id, userId);

      // Update name if provided
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          throw createError('Section name cannot be empty', 400);
        }
        (section as unknown as { name: string }).name = name.trim();
      }

      await (section as mongoose.Document).save();

      res.status(200).json({
        success: true,
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/sections/:id
 * Delete a section
 * Query params:
 * - targetSectionId: ID of section to move tasks to (optional)
 * - deleteTasks: if 'true', delete all tasks in the section (optional)
 * 
 * If neither is provided and section has tasks, returns error
 */
router.delete(
  '/sections/:id',
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
      const targetSectionId = req.query.targetSectionId as string | undefined;
      const deleteTasks = req.query.deleteTasks as string | undefined;

      if (!id) {
        throw createError('Section ID is required', 400);
      }

      // Verify section ownership through board
      const { section, board } = await verifySectionOwnership(id, userId, session);

      const sectionDoc = section as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
      };

      // Check if section has tasks
      const taskCount = await Task.countDocuments({ sectionId: new mongoose.Types.ObjectId(id) }).session(session);

      if (taskCount > 0) {
        if (targetSectionId) {
          // Move tasks to target section
          if (!mongoose.Types.ObjectId.isValid(targetSectionId)) {
            throw createError('Invalid target section ID', 400);
          }

          // Verify target section exists and belongs to the same board
          const targetSection = await Section.findById(targetSectionId).session(session);
          if (!targetSection) {
            throw createError('Target section not found', 404);
          }

          if (targetSection.boardId.toString() !== sectionDoc.boardId.toString()) {
            throw createError('Target section must be in the same board', 400);
          }

          if (targetSection._id.toString() === id) {
            throw createError('Cannot move tasks to the same section being deleted', 400);
          }

          // Get the next position in the target section
          const nextPosition = await Task.getNextPosition(targetSectionId);

          // Move all tasks to target section, updating their positions
          const tasks = await Task.find({ sectionId: new mongoose.Types.ObjectId(id) }).sort({ position: 1 }).session(session);
          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (task) {
              task.sectionId = new mongoose.Types.ObjectId(targetSectionId);
              task.position = nextPosition + i;
              await task.save({ session });
            }
          }
        } else if (deleteTasks === 'true') {
          // Delete all tasks in the section
          await Task.deleteMany({ sectionId: new mongoose.Types.ObjectId(id) }).session(session);
        } else {
          // Section has tasks but no action specified
          throw createError(
            'Section contains tasks. Specify targetSectionId to move tasks or deleteTasks=true to delete them',
            400
          );
        }
      }

      // Remove section from board's sectionOrder
      const boardDoc = board as unknown as {
        sectionOrder: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };
      boardDoc.sectionOrder = boardDoc.sectionOrder.filter(
        (sId) => sId.toString() !== id
      );
      await boardDoc.save({ session });

      // Delete the section
      await Section.findByIdAndDelete(id).session(session);

      // Reorder remaining sections to maintain contiguous positions
      const remainingSections = await Section.find({ boardId: sectionDoc.boardId })
        .sort({ position: 1 })
        .session(session);

      for (let i = 0; i < remainingSections.length; i++) {
        const remainingSection = remainingSections[i];
        if (remainingSection && remainingSection.position !== i) {
          remainingSection.position = i;
          await remainingSection.save({ session });
        }
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Section deleted successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }
);

/**
 * PUT /api/boards/:boardId/sections/reorder
 * Reorder sections within a board
 * Body: { sectionOrder: string[] } - Array of section IDs in the new order
 */
router.put(
  '/boards/:boardId/sections/reorder',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.boardId as string;
      const { sectionOrder } = req.body;

      if (!boardId) {
        throw createError('Board ID is required', 400);
      }

      if (!Array.isArray(sectionOrder)) {
        throw createError('sectionOrder must be an array of section IDs', 400);
      }

      // Verify board ownership
      const board = await verifyBoardOwnership(boardId, userId, session);

      // Validate all section IDs
      for (const sectionId of sectionOrder) {
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
          throw createError(`Invalid section ID: ${sectionId}`, 400);
        }
      }

      // Get all sections for this board
      const existingSections = await Section.find({ boardId: new mongoose.Types.ObjectId(boardId) }).session(session);
      const existingSectionIds = existingSections.map((s) => s._id.toString());

      // Verify all provided section IDs belong to this board
      for (const sectionId of sectionOrder) {
        if (!existingSectionIds.includes(sectionId)) {
          throw createError(`Section ${sectionId} does not belong to this board`, 400);
        }
      }

      // Verify all board sections are included in the new order
      if (sectionOrder.length !== existingSections.length) {
        throw createError(
          'sectionOrder must include all sections in the board',
          400
        );
      }

      // Check for duplicates
      const uniqueIds = new Set(sectionOrder);
      if (uniqueIds.size !== sectionOrder.length) {
        throw createError('sectionOrder contains duplicate section IDs', 400);
      }

      // Update section positions
      for (let i = 0; i < sectionOrder.length; i++) {
        await Section.findByIdAndUpdate(
          sectionOrder[i],
          { position: i },
          { session }
        );
      }

      // Update board's sectionOrder
      const boardDoc = board as unknown as {
        sectionOrder: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };
      boardDoc.sectionOrder = sectionOrder.map(
        (id: string) => new mongoose.Types.ObjectId(id)
      );
      await boardDoc.save({ session });

      await session.commitTransaction();

      // Fetch updated sections
      const updatedSections = await Section.findByBoardId(boardId);

      res.status(200).json({
        success: true,
        data: updatedSections,
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
