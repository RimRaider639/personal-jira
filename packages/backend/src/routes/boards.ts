import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Board from '../models/Board';
import Section from '../models/Section';
import Task from '../models/Task';
import Epic from '../models/Epic';
import { Activity } from '../models';

const router = Router();

/**
 * Default sections created for every new board
 */
const DEFAULT_SECTIONS = ['To Do', 'In Progress', 'Done'];

/**
 * GET /api/boards
 * List all boards for the authenticated user
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

      const boards = await Board.findByUserId(userId);

      res.status(200).json({
        success: true,
        data: boards,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/boards
 * Create a new board with default sections (To Do, In Progress, Done)
 */
router.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const { name, description, color } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw createError('Board name is required', 400);
      }

      // Create the board
      const board = new Board({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || undefined,
        sectionOrder: [],
      });

      await board.save({ session });

      // Create default sections
      const sectionIds: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < DEFAULT_SECTIONS.length; i++) {
        const section = new Section({
          boardId: board._id,
          name: DEFAULT_SECTIONS[i],
          position: i,
        });
        await section.save({ session });
        sectionIds.push(section._id as mongoose.Types.ObjectId);
      }

      // Update board with section order
      board.sectionOrder = sectionIds;
      await board.save({ session });

      await session.commitTransaction();

      // Fetch the board with populated data
      const populatedBoard = await Board.findById(board._id);

      res.status(201).json({
        success: true,
        data: populatedBoard,
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
 * GET /api/boards/:id
 * Get a single board by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createError('Invalid board ID', 400);
      }

      const board = await Board.findById(id);

      if (!board) {
        throw createError('Board not found', 404);
      }

      // Check ownership
      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      res.status(200).json({
        success: true,
        data: board,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/boards/:id
 * Update a board (name, description, color)
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

      const id = req.params.id as string;
      const { name, description, color } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createError('Invalid board ID', 400);
      }

      const board = await Board.findById(id);

      if (!board) {
        throw createError('Board not found', 404);
      }

      // Check ownership
      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      // Update fields if provided
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          throw createError('Board name cannot be empty', 400);
        }
        board.name = name.trim();
      }

      if (description !== undefined) {
        board.description = description?.trim() || null;
      }

      if (color !== undefined) {
        board.color = color;
      }

      await board.save();

      res.status(200).json({
        success: true,
        data: board,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/boards/:id
 * Delete a board and all related data (sections, tasks, epics)
 */
router.delete(
  '/:id',
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

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createError('Invalid board ID', 400);
      }

      const board = await Board.findById(id).session(session);

      if (!board) {
        throw createError('Board not found', 404);
      }

      // Check ownership
      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      // Delete all tasks associated with this board
      await Task.deleteMany({ boardId: new mongoose.Types.ObjectId(id) }).session(session);

      // Delete all sections associated with this board
      await Section.deleteMany({ boardId: new mongoose.Types.ObjectId(id) }).session(session);

      // Delete all epics associated with this board
      await Epic.deleteMany({ boardId: new mongoose.Types.ObjectId(id) }).session(session);

      // Delete the board itself
      await Board.findByIdAndDelete(id).session(session);

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Board and all related data deleted successfully',
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
 * POST /api/boards/:id/sprint/start
 * Start a new sprint - archives all tasks in "Done" sections
 */
router.post(
  '/:id/sprint/start',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.id as string;

      if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
        throw createError('Invalid board ID', 400);
      }

      const board = await Board.findById(boardId).session(session);

      if (!board) {
        throw createError('Board not found', 404);
      }

      // Check ownership
      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      // Find all "Done" sections (case-insensitive)
      const doneSections = await Section.find({
        boardId: new mongoose.Types.ObjectId(boardId),
        name: { $regex: /^done$/i },
      }).session(session);

      const doneSectionIds = doneSections.map(s => s._id);

      // Archive all tasks in done sections
      const result = await Task.updateMany(
        {
          boardId: new mongoose.Types.ObjectId(boardId),
          sectionId: { $in: doneSectionIds },
          isArchived: false,
        },
        { $set: { isArchived: true } },
        { session }
      );

      // Log activity
      await Activity.create([{
        boardId: new mongoose.Types.ObjectId(boardId),
        userId: new mongoose.Types.ObjectId(userId),
        type: 'sprint_started',
        entityId: new mongoose.Types.ObjectId(boardId),
        entityType: 'board',
        metadata: {
          archivedCount: result.modifiedCount,
        },
      }], { session });

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: `Sprint started. ${result.modifiedCount} tasks archived.`,
        archivedCount: result.modifiedCount,
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
 * GET /api/boards/:id/archived
 * Get all archived tasks for a board
 */
router.get(
  '/:id/archived',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.id as string;

      if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
        throw createError('Invalid board ID', 400);
      }

      const board = await Board.findById(boardId);

      if (!board) {
        throw createError('Board not found', 404);
      }

      // Check ownership
      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      const archivedTasks = await Task.find({
        boardId: new mongoose.Types.ObjectId(boardId),
        isArchived: true,
      }).sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        data: archivedTasks,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/boards/:id/tasks/:taskId/unarchive
 * Unarchive a task (restore from archive)
 */
router.post(
  '/:id/tasks/:taskId/unarchive',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.id as string;
      const taskId = req.params.taskId as string;

      if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
        throw createError('Invalid board ID', 400);
      }

      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw createError('Invalid task ID', 400);
      }

      const board = await Board.findById(boardId);

      if (!board) {
        throw createError('Board not found', 404);
      }

      // Check ownership
      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      const task = await Task.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        boardId: new mongoose.Types.ObjectId(boardId),
      });

      if (!task) {
        throw createError('Task not found', 404);
      }

      task.isArchived = false;
      await task.save();

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/boards/:id/stats
 * Get board statistics (open tasks, completed tasks, etc.)
 */
router.get(
  '/:id/stats',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const boardId = req.params.id as string;

      if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
        throw createError('Invalid board ID', 400);
      }

      const board = await Board.findById(boardId);

      if (!board) {
        throw createError('Board not found', 404);
      }

      // Check ownership
      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      // Get all sections
      const sections = await Section.find({ boardId: new mongoose.Types.ObjectId(boardId) });
      const doneSectionIds = sections
        .filter(s => s.name.toLowerCase() === 'done')
        .map(s => s._id);

      // Count tasks
      const totalTasks = await Task.countDocuments({
        boardId: new mongoose.Types.ObjectId(boardId),
        isArchived: false,
      });

      const completedTasks = await Task.countDocuments({
        boardId: new mongoose.Types.ObjectId(boardId),
        sectionId: { $in: doneSectionIds },
        isArchived: false,
      });

      const openTasks = totalTasks - completedTasks;

      const archivedTasks = await Task.countDocuments({
        boardId: new mongoose.Types.ObjectId(boardId),
        isArchived: true,
      });

      // Get overdue tasks
      const now = new Date();
      const overdueTasks = await Task.countDocuments({
        boardId: new mongoose.Types.ObjectId(boardId),
        isArchived: false,
        sectionId: { $nin: doneSectionIds },
        endDate: { $lt: now, $ne: null },
      });

      res.status(200).json({
        success: true,
        data: {
          totalTasks,
          openTasks,
          completedTasks,
          archivedTasks,
          overdueTasks,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
