import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Board from '../models/Board';
import Task, { ITaskDocument, IComment } from '../models/Task';
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
 * Returns the task if the user owns the board
 */
async function verifyTaskOwnership(
  taskId: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<ITaskDocument> {
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

  await verifyBoardOwnership(task.boardId.toString(), userId, session);

  return task;
}

/**
 * Helper function to find a task containing a specific comment
 * Returns the task and comment if found and user has access
 */
async function findTaskByCommentId(
  commentId: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<{ task: ITaskDocument; comment: IComment }> {
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw createError('Invalid comment ID', 400);
  }

  // Find the task containing this comment
  const query = Task.findOne({ 'comments._id': new mongoose.Types.ObjectId(commentId) });
  if (session) {
    query.session(session);
  }
  const task = await query;

  if (!task) {
    throw createError('Comment not found', 404);
  }

  // Verify board ownership
  await verifyBoardOwnership(task.boardId.toString(), userId, session);

  // Find the specific comment
  const comment = task.comments.find(
    (c) => c._id.toString() === commentId
  );

  if (!comment) {
    throw createError('Comment not found', 404);
  }

  return { task, comment };
}

/**
 * Validate comment content
 */
function validateCommentContent(content: unknown): string {
  if (content === undefined || content === null) {
    throw createError('Comment content is required', 400);
  }

  if (typeof content !== 'string') {
    throw createError('Comment content must be a string', 400);
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    throw createError('Comment content cannot be empty', 400);
  }

  if (trimmedContent.length > 2000) {
    throw createError('Comment content cannot exceed 2000 characters', 400);
  }

  return trimmedContent;
}

/**
 * GET /api/tasks/:taskId/comments
 * List all comments for a task in chronological order
 */
router.get(
  '/tasks/:taskId/comments',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.taskId as string;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      // Verify task ownership through board
      const task = await verifyTaskOwnership(taskId, userId);

      // Return comments sorted by createdAt in ascending order (chronological)
      const comments = [...task.comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      res.status(200).json({
        success: true,
        data: comments,
        count: comments.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tasks/:taskId/comments
 * Add a new comment to a task
 * Request body:
 * - content: The comment text (required, 1-2000 chars)
 */
router.post(
  '/tasks/:taskId/comments',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const taskId = req.params.taskId as string;

      if (!taskId) {
        throw createError('Task ID is required', 400);
      }

      const { content } = req.body;

      // Validate content
      const validatedContent = validateCommentContent(content);

      // Verify task ownership through board
      const task = await verifyTaskOwnership(taskId, userId, session);

      // Add the comment using the instance method
      const comment = task.addComment(validatedContent);

      await task.save({ session });

      // Log activity
      await Activity.create([{
        boardId: task.boardId,
        userId: new mongoose.Types.ObjectId(userId),
        type: 'comment_added',
        entityId: comment._id,
        entityType: 'comment',
        metadata: {
          taskId,
          contentPreview: validatedContent.substring(0, 100),
        },
      }], { session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment added successfully',
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
 * PUT /api/comments/:id
 * Update a comment's content
 * Request body:
 * - content: The updated comment text (required, 1-2000 chars)
 */
router.put(
  '/comments/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const commentId = req.params.id as string;

      if (!commentId) {
        throw createError('Comment ID is required', 400);
      }

      const { content } = req.body;

      // Validate content
      const validatedContent = validateCommentContent(content);

      // Find the task containing this comment and verify ownership
      const { task } = await findTaskByCommentId(commentId, userId, session);

      // Update the comment content
      // Since comments is an embedded array, we need to find and update the specific comment
      const commentIndex = task.comments.findIndex(
        (c) => c._id.toString() === commentId
      );

      if (commentIndex === -1) {
        throw createError('Comment not found', 404);
      }

      // Update the content (createdAt remains unchanged)
      task.comments[commentIndex]!.content = validatedContent;

      await task.save({ session });

      await session.commitTransaction();

      // Return the updated comment
      const updatedComment = task.comments[commentIndex];

      res.status(200).json({
        success: true,
        data: updatedComment,
        message: 'Comment updated successfully',
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
 * DELETE /api/comments/:id
 * Delete a comment from a task
 */
router.delete(
  '/comments/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const commentId = req.params.id as string;

      if (!commentId) {
        throw createError('Comment ID is required', 400);
      }

      // Find the task containing this comment and verify ownership
      const { task } = await findTaskByCommentId(commentId, userId, session);

      // Remove the comment using the instance method
      const removed = task.removeComment(new mongoose.Types.ObjectId(commentId));

      if (!removed) {
        throw createError('Failed to remove comment', 500);
      }

      await task.save({ session });

      // Log activity
      await Activity.create([{
        boardId: task.boardId,
        userId: new mongoose.Types.ObjectId(userId),
        type: 'comment_deleted',
        entityId: new mongoose.Types.ObjectId(commentId),
        entityType: 'comment',
        metadata: {
          taskId: task._id.toString(),
        },
      }], { session });

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
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
