import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Board from '../models/Board';
import Task, { ITaskDocument, IAttachment } from '../models/Task';
import { uploadFile, deleteFile } from '../services/cloudinary.service';
import { isValidMimeType, ALLOWED_MIME_TYPES } from '@kanban/shared';

const router = Router();

/**
 * Configure multer for memory storage
 * Files are stored in memory as Buffer objects for upload to Cloudinary
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

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
 * Helper function to find a task containing a specific attachment
 * Returns the task and attachment if found and user has access
 */
async function findTaskByAttachmentId(
  attachmentId: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<{ task: ITaskDocument; attachment: IAttachment }> {
  if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
    throw createError('Invalid attachment ID', 400);
  }

  // Find the task containing this attachment
  const query = Task.findOne({ 'attachments._id': new mongoose.Types.ObjectId(attachmentId) });
  if (session) {
    query.session(session);
  }
  const task = await query;

  if (!task) {
    throw createError('Attachment not found', 404);
  }

  // Verify board ownership
  await verifyBoardOwnership(task.boardId.toString(), userId, session);

  // Find the specific attachment
  const attachment = task.attachments.find(
    (a) => a._id.toString() === attachmentId
  );

  if (!attachment) {
    throw createError('Attachment not found', 404);
  }

  return { task, attachment };
}

/**
 * Determine Cloudinary resource type based on MIME type
 */
function getResourceType(mimeType: string): 'image' | 'raw' {
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return imageMimeTypes.includes(mimeType) ? 'image' : 'raw';
}

/**
 * GET /api/tasks/:taskId/attachments
 * List all attachments for a task
 */
router.get(
  '/tasks/:taskId/attachments',
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

      // Return attachments sorted by createdAt in descending order (newest first)
      const attachments = [...task.attachments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.status(200).json({
        success: true,
        data: attachments,
        count: attachments.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tasks/:taskId/attachments
 * Upload an attachment to a task
 * Request: multipart/form-data with 'file' field
 */
router.post(
  '/tasks/:taskId/attachments',
  authenticate,
  upload.single('file'),
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

      // Check if file was uploaded
      const file = req.file;
      if (!file) {
        throw createError('No file uploaded. Please provide a file in the "file" field.', 400);
      }

      // Validate MIME type
      if (!isValidMimeType(file.mimetype)) {
        throw createError(
          `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
          400
        );
      }

      // Verify task ownership through board
      const task = await verifyTaskOwnership(taskId, userId, session);

      // Upload file to Cloudinary
      const uploadResult = await uploadFile(file.buffer, {
        folder: `kanban-attachments/${task.boardId}/${taskId}`,
        filename: file.originalname,
        mimeType: file.mimetype,
      });

      // Create attachment document
      const attachment = task.addAttachment({
        filename: file.originalname,
        url: uploadResult.secureUrl,
        mimeType: file.mimetype,
        size: file.size,
        cloudinaryPublicId: uploadResult.publicId,
      });

      await task.save({ session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        data: attachment,
        message: 'Attachment uploaded successfully',
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
 * DELETE /api/attachments/:id
 * Delete an attachment from a task (also deletes from Cloudinary)
 */
router.delete(
  '/attachments/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const attachmentId = req.params.id as string;

      if (!attachmentId) {
        throw createError('Attachment ID is required', 400);
      }

      // Find the task containing this attachment and verify ownership
      const { task, attachment } = await findTaskByAttachmentId(attachmentId, userId, session);

      // Delete from Cloudinary
      const resourceType = getResourceType(attachment.mimeType);
      await deleteFile(attachment.cloudinaryPublicId, resourceType);

      // Remove the attachment using the instance method
      const removed = task.removeAttachment(new mongoose.Types.ObjectId(attachmentId));

      if (!removed) {
        throw createError('Failed to remove attachment', 500);
      }

      await task.save({ session });

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Attachment deleted successfully',
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
