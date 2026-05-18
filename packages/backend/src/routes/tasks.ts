import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Board from '../models/Board';
import Section from '../models/Section';
import Task, { PRIORITY_VALUES, Priority } from '../models/Task';
import Epic from '../models/Epic';
import Activity from '../models/Activity';

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
 * Helper function to verify task ownership through board
 * Returns the task and board if the user owns the board
 */
async function verifyTaskOwnership(
  taskId: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<{ task: mongoose.Document; board: mongoose.Document }> {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw createError('Invalid task ID', 400);
  }

  const query = Task.findById(taskId);
  if (session) {
    query.session(session);
  }
  const task = await query;

  if (!task) {
    throw createError('Task not found', 404);
  }

  const board = await verifyBoardOwnership(
    (task as unknown as { boardId: mongoose.Types.ObjectId }).boardId.toString(),
    userId,
    session
  );

  return { task, board };
}

/**
 * Validate priority value
 */
function isValidPriority(value: unknown): value is Priority | null {
  return value === null || value === undefined || PRIORITY_VALUES.includes(value as Priority);
}

/**
 * Validate story points value
 */
function isValidStoryPoints(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 && num <= 100;
}

/**
 * Validate epic IDs - ensure they exist and belong to the same board
 */
async function validateEpicIds(
  epicIds: string[],
  boardId: string,
  session?: mongoose.ClientSession
): Promise<void> {
  if (!epicIds || epicIds.length === 0) return;

  for (const epicId of epicIds) {
    if (!mongoose.Types.ObjectId.isValid(epicId)) {
      throw createError(`Invalid epic ID: ${epicId}`, 400);
    }
  }

  const query = Epic.find({
    _id: { $in: epicIds.map((id) => new mongoose.Types.ObjectId(id)) },
    boardId: new mongoose.Types.ObjectId(boardId),
  });
  if (session) {
    query.session(session);
  }
  const epics = await query;

  if (epics.length !== epicIds.length) {
    throw createError('One or more epic IDs are invalid or do not belong to this board', 400);
  }
}

/**
 * GET /api/tasks
 * List all tasks for the authenticated user (across all boards)
 */
router.get(
  '/tasks',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Get all boards for the user
      const boards = await Board.find({ userId: new mongoose.Types.ObjectId(userId) });
      const boardIds = boards.map(b => b._id);

      // Get all tasks for those boards
      const tasks = await Task.find({ boardId: { $in: boardIds } }).sort({ boardId: 1, sectionId: 1, position: 1 });

      res.status(200).json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tasks/pinned
 * Get all pinned tasks for the authenticated user (across all boards)
 */
router.get(
  '/tasks/pinned',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Get all boards for the user
      const boards = await Board.find({ userId: new mongoose.Types.ObjectId(userId) });
      const boardIds = boards.map(b => b._id);

      // Get all pinned tasks for those boards
      const tasks = await Task.find({ 
        boardId: { $in: boardIds },
        isPinned: true,
      }).sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/tasks/:id/pin
 * Toggle pin status of a task
 */
router.put(
  '/tasks/:id/pin',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;
      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw createError('Invalid task ID', 400);
      }

      // Verify task ownership through board
      const { task } = await verifyTaskOwnership(taskId, userId);

      const taskDoc = task as unknown as {
        isPinned: boolean;
        save: () => Promise<void>;
      };

      // Toggle pin status
      taskDoc.isPinned = !taskDoc.isPinned;
      await taskDoc.save();

      // Fetch updated task
      const updatedTask = await Task.findById(taskId);

      res.status(200).json({
        success: true,
        data: updatedTask,
        message: taskDoc.isPinned ? 'Task pinned' : 'Task unpinned',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/boards/:boardId/tasks
 * List all tasks for a board with optional filtering
 * Query params:
 * - sectionId: Filter by section
 * - priority: Filter by priority (can be comma-separated for multiple)
 * - epicIds: Filter by epic IDs (comma-separated, AND logic - task must have ALL epics)
 * - dueDate: Filter by due date ('today', 'week', '7days', 'overdue')
 * - search: Search in title and description
 */
router.get(
  '/boards/:boardId/tasks',
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

      // Build query - exclude archived tasks by default
      const query: Record<string, unknown> = {
        boardId: new mongoose.Types.ObjectId(boardId),
        isArchived: { $ne: true },
      };

      // Filter by section
      const sectionId = req.query.sectionId as string | undefined;
      if (sectionId) {
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
          throw createError('Invalid section ID', 400);
        }
        query.sectionId = new mongoose.Types.ObjectId(sectionId);
      }

      // Filter by priority (OR logic - any of the selected priorities)
      const priorityParam = req.query.priority as string | undefined;
      if (priorityParam) {
        const priorities = priorityParam.split(',').map((p) => p.trim());
        for (const p of priorities) {
          if (!isValidPriority(p)) {
            throw createError(`Invalid priority value: ${p}`, 400);
          }
        }
        query.priority = { $in: priorities };
      }

      // Filter by epic IDs (AND logic - task must have ALL specified epics)
      const epicIdsParam = req.query.epicIds as string | undefined;
      if (epicIdsParam) {
        const epicIds = epicIdsParam.split(',').map((id) => id.trim());
        for (const epicId of epicIds) {
          if (!mongoose.Types.ObjectId.isValid(epicId)) {
            throw createError(`Invalid epic ID: ${epicId}`, 400);
          }
        }
        query.epicIds = { $all: epicIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }

      // Filter by due date
      const dueDateFilter = req.query.dueDate as string | undefined;
      if (dueDateFilter) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);

        switch (dueDateFilter) {
          case 'today':
            query.endDate = {
              $gte: startOfToday,
              $lt: endOfToday,
            };
            break;
          case 'week': {
            // Current calendar week (Sunday to Saturday)
            const dayOfWeek = now.getDay();
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);
            query.endDate = {
              $gte: startOfWeek,
              $lt: endOfWeek,
            };
            break;
          }
          case '7days': {
            const sevenDaysFromNow = new Date(startOfToday);
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            query.endDate = {
              $gte: startOfToday,
              $lt: sevenDaysFromNow,
            };
            break;
          }
          case 'overdue':
            query.endDate = {
              $lt: startOfToday,
              $ne: null,
            };
            break;
          default:
            throw createError(
              `Invalid dueDate filter: ${dueDateFilter}. Valid values: today, week, 7days, overdue`,
              400
            );
        }
      }

      // Search in title and description
      const searchQuery = req.query.search as string | undefined;
      if (searchQuery && searchQuery.trim()) {
        query.$text = { $search: searchQuery.trim() };
      }

      // Execute query
      const tasks = await Task.find(query).sort({ sectionId: 1, position: 1 });

      res.status(200).json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/boards/:boardId/tasks
 * Create a new task in a board
 */
router.post(
  '/boards/:boardId/tasks',
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

      if (!boardId) {
        throw createError('Board ID is required', 400);
      }

      // Verify board ownership
      const board = await verifyBoardOwnership(boardId, userId, session);

      const { title, description, sectionId, priority, storyPoints, endDate, epicIds } = req.body;

      // Validate title
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw createError('Task title is required', 400);
      }

      if (title.trim().length > 200) {
        throw createError('Task title cannot exceed 200 characters', 400);
      }

      // Validate description
      if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
          throw createError('Description must be a string', 400);
        }
        if (description.length > 5000) {
          throw createError('Description cannot exceed 5000 characters', 400);
        }
      }

      // Determine section ID
      let targetSectionId: string;
      if (sectionId) {
        if (!mongoose.Types.ObjectId.isValid(sectionId)) {
          throw createError('Invalid section ID', 400);
        }
        // Verify section belongs to this board
        const section = await Section.findById(sectionId).session(session);
        if (!section) {
          throw createError('Section not found', 404);
        }
        if (section.boardId.toString() !== boardId) {
          throw createError('Section does not belong to this board', 400);
        }
        targetSectionId = sectionId;
      } else {
        // Use first section of the board
        const boardDoc = board as unknown as { sectionOrder: mongoose.Types.ObjectId[] };
        if (!boardDoc.sectionOrder || boardDoc.sectionOrder.length === 0) {
          throw createError('Board has no sections', 400);
        }
        const firstSection = boardDoc.sectionOrder[0];
        if (!firstSection) {
          throw createError('Board has no sections', 400);
        }
        targetSectionId = firstSection.toString();
      }

      // Validate priority
      if (priority !== undefined && !isValidPriority(priority)) {
        throw createError(
          `Invalid priority value. Valid values: ${PRIORITY_VALUES.join(', ')}, or null`,
          400
        );
      }

      // Validate story points
      if (storyPoints !== undefined && !isValidStoryPoints(storyPoints)) {
        throw createError('Story points must be an integer between 0 and 100', 400);
      }

      // Validate end date
      let parsedEndDate: Date | null = null;
      if (endDate !== undefined && endDate !== null) {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          throw createError('Invalid end date format', 400);
        }
      }

      // Validate epic IDs
      if (epicIds !== undefined && epicIds !== null) {
        if (!Array.isArray(epicIds)) {
          throw createError('epicIds must be an array', 400);
        }
        await validateEpicIds(epicIds, boardId, session);
      }

      // Get next position in the section
      const position = await Task.getNextPosition(targetSectionId);

      // Create the task
      const task = new Task({
        boardId: new mongoose.Types.ObjectId(boardId),
        sectionId: new mongoose.Types.ObjectId(targetSectionId),
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || null,
        storyPoints: storyPoints !== undefined ? storyPoints : null,
        endDate: parsedEndDate,
        epicIds: epicIds
          ? epicIds.map((id: string) => new mongoose.Types.ObjectId(id))
          : [],
        position,
        comments: [],
        attachments: [],
      });

      await task.save({ session });

      // Log activity
      await Activity.create([{
        boardId: new mongoose.Types.ObjectId(boardId),
        userId: new mongoose.Types.ObjectId(userId),
        type: 'task_created',
        entityId: task._id,
        entityType: 'task',
        metadata: {
          title: task.title,
          sectionId: targetSectionId,
        },
      }], { session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        data: task,
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
 * GET /api/tasks/:id
 * Get a single task by ID
 */
router.get(
  '/tasks/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const id = req.params.id as string;

      if (!id) {
        throw createError('Task ID is required', 400);
      }

      // Verify task ownership through board
      const { task } = await verifyTaskOwnership(id, userId);

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
 * PUT /api/tasks/:id
 * Update a task
 */
router.put(
  '/tasks/:id',
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
        throw createError('Task ID is required', 400);
      }

      // Verify task ownership through board
      const { task } = await verifyTaskOwnership(id, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
        title: string;
        description: string | null;
        priority: Priority | null;
        storyPoints: number | null;
        endDate: Date | null;
        epicIds: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };

      const { title, description, priority, storyPoints, endDate, epicIds } = req.body;

      // Update title if provided
      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
          throw createError('Task title cannot be empty', 400);
        }
        if (title.trim().length > 200) {
          throw createError('Task title cannot exceed 200 characters', 400);
        }
        taskDoc.title = title.trim();
      }

      // Update description if provided
      if (description !== undefined) {
        if (description !== null && typeof description !== 'string') {
          throw createError('Description must be a string or null', 400);
        }
        if (description && description.length > 5000) {
          throw createError('Description cannot exceed 5000 characters', 400);
        }
        taskDoc.description = description?.trim() || null;
      }

      // Update priority if provided
      if (priority !== undefined) {
        if (!isValidPriority(priority)) {
          throw createError(
            `Invalid priority value. Valid values: ${PRIORITY_VALUES.join(', ')}, or null`,
            400
          );
        }
        taskDoc.priority = priority || null;
      }

      // Update story points if provided
      if (storyPoints !== undefined) {
        if (!isValidStoryPoints(storyPoints)) {
          throw createError('Story points must be an integer between 0 and 100', 400);
        }
        taskDoc.storyPoints = storyPoints !== null ? Number(storyPoints) : null;
      }

      // Update end date if provided
      if (endDate !== undefined) {
        if (endDate === null) {
          taskDoc.endDate = null;
        } else {
          const parsedEndDate = new Date(endDate);
          if (isNaN(parsedEndDate.getTime())) {
            throw createError('Invalid end date format', 400);
          }
          taskDoc.endDate = parsedEndDate;
        }
      }

      // Update epic IDs if provided
      if (epicIds !== undefined) {
        if (epicIds === null) {
          taskDoc.epicIds = [];
        } else {
          if (!Array.isArray(epicIds)) {
            throw createError('epicIds must be an array', 400);
          }
          await validateEpicIds(epicIds, taskDoc.boardId.toString(), session);
          taskDoc.epicIds = epicIds.map((id: string) => new mongoose.Types.ObjectId(id));
        }
      }

      await taskDoc.save({ session });

      // Log activity
      await Activity.create([{
        boardId: taskDoc.boardId,
        userId: new mongoose.Types.ObjectId(userId),
        type: 'task_updated',
        entityId: taskDoc._id,
        entityType: 'task',
        metadata: {
          updatedFields: Object.keys(req.body),
        },
      }], { session });

      await session.commitTransaction();

      // Fetch updated task
      const updatedTask = await Task.findById(id);

      res.status(200).json({
        success: true,
        data: updatedTask,
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
 * DELETE /api/tasks/:id
 * Delete a task and all associated comments and attachments
 */
router.delete(
  '/tasks/:id',
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
        throw createError('Task ID is required', 400);
      }

      // Verify task ownership through board
      const { task } = await verifyTaskOwnership(id, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
        sectionId: mongoose.Types.ObjectId;
        position: number;
        title: string;
      };

      // Get the section ID for reordering
      const sectionId = taskDoc.sectionId;
      const boardId = taskDoc.boardId;
      const taskTitle = taskDoc.title;

      // Delete the task (comments and attachments are embedded, so they're deleted automatically)
      await Task.findByIdAndDelete(id).session(session);

      // Log activity
      await Activity.create([{
        boardId,
        userId: new mongoose.Types.ObjectId(userId),
        type: 'task_deleted',
        entityId: taskDoc._id,
        entityType: 'task',
        metadata: {
          title: taskTitle,
        },
      }], { session });

      // Reorder remaining tasks in the section to maintain contiguous positions
      const remainingTasks = await Task.find({ sectionId })
        .sort({ position: 1 })
        .session(session);

      for (let i = 0; i < remainingTasks.length; i++) {
        const remainingTask = remainingTasks[i];
        if (remainingTask && remainingTask.position !== i) {
          remainingTask.position = i;
          await remainingTask.save({ session });
        }
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
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
 * PUT /api/tasks/:id/move
 * Move a task to a different section and/or reorder within a section
 * Request body:
 * - sectionId: Target section ID (required)
 * - position: Target position in the section (required)
 */
router.put(
  '/tasks/:id/move',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      const { sectionId: targetSectionId, position: targetPosition } = req.body;

      // Validate required fields
      if (!targetSectionId) {
        throw createError('Target section ID is required', 400);
      }

      if (targetPosition === undefined || targetPosition === null) {
        throw createError('Target position is required', 400);
      }

      // Validate target section ID format
      if (!mongoose.Types.ObjectId.isValid(targetSectionId)) {
        throw createError('Invalid target section ID', 400);
      }

      // Validate position is a non-negative integer
      const positionNum = Number(targetPosition);
      if (!Number.isInteger(positionNum) || positionNum < 0) {
        throw createError('Position must be a non-negative integer', 400);
      }

      // Verify task ownership through board
      const { task } = await verifyTaskOwnership(taskId, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
        sectionId: mongoose.Types.ObjectId;
        position: number;
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };

      const sourceSectionId = taskDoc.sectionId;
      const sourcePosition = taskDoc.position;

      // Verify target section exists and belongs to the same board
      const targetSection = await Section.findById(targetSectionId).session(session);
      if (!targetSection) {
        throw createError('Target section not found', 404);
      }

      if (targetSection.boardId.toString() !== taskDoc.boardId.toString()) {
        throw createError('Target section does not belong to the same board', 400);
      }

      const isMovingToSameSection = sourceSectionId.toString() === targetSectionId;

      if (isMovingToSameSection) {
        // Reordering within the same section
        if (sourcePosition === positionNum) {
          // No change needed
          await session.commitTransaction();
          const updatedTask = await Task.findById(taskId);
          res.status(200).json({
            success: true,
            data: updatedTask,
          });
          return;
        }

        // Get all tasks in the section except the moving task
        const tasksInSection = await Task.find({
          sectionId: sourceSectionId,
          _id: { $ne: taskDoc._id },
        })
          .sort({ position: 1 })
          .session(session);

        // Clamp target position to valid range
        const maxPosition = tasksInSection.length;
        const clampedPosition = Math.min(positionNum, maxPosition);

        // Insert the task at the new position and reorder
        // First, update all other tasks' positions
        for (let i = 0; i < tasksInSection.length; i++) {
          const t = tasksInSection[i];
          if (t) {
            // Calculate new position: if index >= target position, shift by 1
            const newPos = i >= clampedPosition ? i + 1 : i;
            if (t.position !== newPos) {
              t.position = newPos;
              await t.save({ session });
            }
          }
        }

        // Update the moving task's position
        taskDoc.position = clampedPosition;
        await taskDoc.save({ session });
      } else {
        // Moving to a different section

        // Step 1: Remove task from source section and reorder remaining tasks
        const tasksInSourceSection = await Task.find({
          sectionId: sourceSectionId,
          _id: { $ne: taskDoc._id },
        })
          .sort({ position: 1 })
          .session(session);

        // Reorder source section tasks to fill the gap
        for (let i = 0; i < tasksInSourceSection.length; i++) {
          const t = tasksInSourceSection[i];
          if (t && t.position !== i) {
            t.position = i;
            await t.save({ session });
          }
        }

        // Step 2: Get tasks in target section and make room for the new task
        const tasksInTargetSection = await Task.find({
          sectionId: new mongoose.Types.ObjectId(targetSectionId),
        })
          .sort({ position: 1 })
          .session(session);

        // Clamp target position to valid range
        const maxPosition = tasksInTargetSection.length;
        const clampedPosition = Math.min(positionNum, maxPosition);

        // Shift tasks at and after the target position
        for (let i = tasksInTargetSection.length - 1; i >= clampedPosition; i--) {
          const t = tasksInTargetSection[i];
          if (t) {
            t.position = i + 1;
            await t.save({ session });
          }
        }

        // Step 3: Update the moving task
        taskDoc.sectionId = new mongoose.Types.ObjectId(targetSectionId);
        taskDoc.position = clampedPosition;
        await taskDoc.save({ session });

        // Log activity for cross-section move
        await Activity.create([{
          boardId: taskDoc.boardId,
          userId: new mongoose.Types.ObjectId(userId),
          type: 'task_moved',
          entityId: taskDoc._id,
          entityType: 'task',
          metadata: {
            fromSectionId: sourceSectionId.toString(),
            toSectionId: targetSectionId,
          },
        }], { session });
      }

      await session.commitTransaction();

      // Fetch the updated task
      const updatedTask = await Task.findById(taskId);

      res.status(200).json({
        success: true,
        data: updatedTask,
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
 * POST /api/tasks/:id/epics
 * Assign an epic to a task
 * Request body:
 * - epicId: The ID of the epic to assign (required)
 */
router.post(
  '/tasks/:id/epics',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      const { epicId } = req.body;

      // Validate epicId is provided
      if (!epicId) {
        throw createError('Epic ID is required', 400);
      }

      // Validate epicId format
      if (!mongoose.Types.ObjectId.isValid(epicId)) {
        throw createError('Invalid epic ID', 400);
      }

      // Verify task ownership through board
      const { task } = await verifyTaskOwnership(taskId, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
        epicIds: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };

      // Verify epic exists and belongs to the same board as the task
      const epic = await Epic.findById(epicId).session(session);
      if (!epic) {
        throw createError('Epic not found', 404);
      }

      if (epic.boardId.toString() !== taskDoc.boardId.toString()) {
        throw createError('Epic does not belong to the same board as the task', 400);
      }

      // Check if epic is already assigned to the task (prevent duplicates)
      const epicObjectId = new mongoose.Types.ObjectId(epicId);
      const isAlreadyAssigned = taskDoc.epicIds.some(
        (id) => id.toString() === epicObjectId.toString()
      );

      if (isAlreadyAssigned) {
        throw createError('Epic is already assigned to this task', 400);
      }

      // Add the epic to the task's epicIds array
      taskDoc.epicIds.push(epicObjectId);
      await taskDoc.save({ session });

      // Log activity
      await Activity.create([{
        boardId: taskDoc.boardId,
        userId: new mongoose.Types.ObjectId(userId),
        type: 'epic_assigned',
        entityId: taskDoc._id,
        entityType: 'task',
        metadata: {
          epicId,
          epicName: epic.name,
        },
      }], { session });

      await session.commitTransaction();

      // Fetch updated task
      const updatedTask = await Task.findById(taskId);

      res.status(200).json({
        success: true,
        data: updatedTask,
        message: 'Epic assigned to task successfully',
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
 * DELETE /api/tasks/:id/epics/:epicId
 * Remove an epic from a task
 */
router.delete(
  '/tasks/:id/epics/:epicId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;
      const epicId = req.params.epicId as string;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      if (!epicId) {
        throw createError('Epic ID is required', 400);
      }

      // Validate epicId format
      if (!mongoose.Types.ObjectId.isValid(epicId)) {
        throw createError('Invalid epic ID', 400);
      }

      // Verify task ownership through board
      const { task } = await verifyTaskOwnership(taskId, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
        epicIds: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };

      // Check if epic is assigned to the task
      const epicIndex = taskDoc.epicIds.findIndex(
        (id) => id.toString() === epicId
      );

      if (epicIndex === -1) {
        throw createError('Epic is not assigned to this task', 404);
      }

      // Remove the epic from the task's epicIds array
      taskDoc.epicIds.splice(epicIndex, 1);
      await taskDoc.save({ session });

      // Log activity
      await Activity.create([{
        boardId: taskDoc.boardId,
        userId: new mongoose.Types.ObjectId(userId),
        type: 'epic_removed',
        entityId: taskDoc._id,
        entityType: 'task',
        metadata: {
          epicId,
        },
      }], { session });

      await session.commitTransaction();

      // Fetch updated task
      const updatedTask = await Task.findById(taskId);

      res.status(200).json({
        success: true,
        data: updatedTask,
        message: 'Epic removed from task successfully',
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
 * POST /api/tasks/:id/dependencies
 * Add a dependent task
 * Request body:
 * - dependentTaskId: The ID of the task that depends on this task (required)
 */
router.post(
  '/tasks/:id/dependencies',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;
      const { dependentTaskId } = req.body;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      if (!dependentTaskId) {
        throw createError('Dependent task ID is required', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(dependentTaskId)) {
        throw createError('Invalid dependent task ID', 400);
      }

      // Prevent self-dependency
      if (taskId === dependentTaskId) {
        throw createError('A task cannot depend on itself', 400);
      }

      // Verify task ownership
      const { task } = await verifyTaskOwnership(taskId, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
        dependentTaskIds: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };

      // Verify dependent task exists and belongs to the same board
      const dependentTask = await Task.findById(dependentTaskId).session(session);
      if (!dependentTask) {
        throw createError('Dependent task not found', 404);
      }

      if (dependentTask.boardId.toString() !== taskDoc.boardId.toString()) {
        throw createError('Dependent task must belong to the same board', 400);
      }

      // Check if already a dependency
      const dependentObjectId = new mongoose.Types.ObjectId(dependentTaskId);
      const isAlreadyDependent = taskDoc.dependentTaskIds?.some(
        (id) => id.toString() === dependentObjectId.toString()
      );

      if (isAlreadyDependent) {
        throw createError('Task is already a dependency', 400);
      }

      // Add the dependency
      if (!taskDoc.dependentTaskIds) {
        taskDoc.dependentTaskIds = [];
      }
      taskDoc.dependentTaskIds.push(dependentObjectId);
      await taskDoc.save({ session });

      await session.commitTransaction();

      const updatedTask = await Task.findById(taskId);

      res.status(200).json({
        success: true,
        data: updatedTask,
        message: 'Dependency added successfully',
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
 * DELETE /api/tasks/:id/dependencies/:dependentTaskId
 * Remove a dependent task
 */
router.delete(
  '/tasks/:id/dependencies/:dependentTaskId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;
      const dependentTaskId = req.params.dependentTaskId as string;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      if (!dependentTaskId) {
        throw createError('Dependent task ID is required', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(dependentTaskId)) {
        throw createError('Invalid dependent task ID', 400);
      }

      // Verify task ownership
      const { task } = await verifyTaskOwnership(taskId, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        dependentTaskIds: mongoose.Types.ObjectId[];
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };

      // Check if dependency exists
      const depIndex = taskDoc.dependentTaskIds?.findIndex(
        (id) => id.toString() === dependentTaskId
      );

      if (depIndex === undefined || depIndex === -1) {
        throw createError('Dependency not found', 404);
      }

      // Remove the dependency
      taskDoc.dependentTaskIds.splice(depIndex, 1);
      await taskDoc.save({ session });

      await session.commitTransaction();

      const updatedTask = await Task.findById(taskId);

      res.status(200).json({
        success: true,
        data: updatedTask,
        message: 'Dependency removed successfully',
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
 * GET /api/tasks/:id/dependencies
 * Get all dependent tasks for a task
 */
router.get(
  '/tasks/:id/dependencies',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      // Verify task ownership
      const { task } = await verifyTaskOwnership(taskId, userId);

      const taskDoc = task as unknown as {
        dependentTaskIds: mongoose.Types.ObjectId[];
      };

      // Get all dependent tasks
      const dependentTasks = await Task.find({
        _id: { $in: taskDoc.dependentTaskIds || [] },
      });

      res.status(200).json({
        success: true,
        data: dependentTasks,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/tasks/:id/section
 * Quick status change - move task to a different section
 * Request body:
 * - sectionId: Target section ID (required)
 */
router.put(
  '/tasks/:id/section',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.id as string;
      const { sectionId: targetSectionId } = req.body;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      if (!targetSectionId) {
        throw createError('Section ID is required', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(targetSectionId)) {
        throw createError('Invalid section ID', 400);
      }

      // Verify task ownership
      const { task } = await verifyTaskOwnership(taskId, userId, session);

      const taskDoc = task as unknown as {
        _id: mongoose.Types.ObjectId;
        boardId: mongoose.Types.ObjectId;
        sectionId: mongoose.Types.ObjectId;
        position: number;
        save: (options?: { session?: mongoose.ClientSession }) => Promise<void>;
      };

      // Verify target section exists and belongs to the same board
      const targetSection = await Section.findById(targetSectionId).session(session);
      if (!targetSection) {
        throw createError('Section not found', 404);
      }

      if (targetSection.boardId.toString() !== taskDoc.boardId.toString()) {
        throw createError('Section does not belong to the same board', 400);
      }

      // If already in the target section, no change needed
      if (taskDoc.sectionId.toString() === targetSectionId) {
        await session.commitTransaction();
        const updatedTask = await Task.findById(taskId);
        res.status(200).json({
          success: true,
          data: updatedTask,
        });
        return;
      }

      const sourceSectionId = taskDoc.sectionId;

      // Reorder source section
      const tasksInSourceSection = await Task.find({
        sectionId: sourceSectionId,
        _id: { $ne: taskDoc._id },
      })
        .sort({ position: 1 })
        .session(session);

      for (let i = 0; i < tasksInSourceSection.length; i++) {
        const t = tasksInSourceSection[i];
        if (t && t.position !== i) {
          t.position = i;
          await t.save({ session });
        }
      }

      // Get next position in target section
      const nextPosition = await Task.getNextPosition(targetSectionId);

      // Update task
      taskDoc.sectionId = new mongoose.Types.ObjectId(targetSectionId);
      taskDoc.position = nextPosition;
      await taskDoc.save({ session });

      await session.commitTransaction();

      const updatedTask = await Task.findById(taskId);

      res.status(200).json({
        success: true,
        data: updatedTask,
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
