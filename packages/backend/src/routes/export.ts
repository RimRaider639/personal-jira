import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import Board from '../models/Board';
import Section from '../models/Section';
import Task from '../models/Task';
import Epic from '../models/Epic';

const router = Router();

/**
 * Interface for exported board data
 */
interface ExportedBoard {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sectionOrder: string[];
  createdAt: Date;
  updatedAt: Date;
  sections: ExportedSection[];
  tasks: ExportedTask[];
  epics: ExportedEpic[];
}

interface ExportedSection {
  id: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ExportedTask {
  id: string;
  sectionId: string;
  epicIds: string[];
  title: string;
  description: string | null;
  priority: string | null;
  storyPoints: number | null;
  endDate: Date | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  comments: ExportedComment[];
  attachments: ExportedAttachment[];
}

interface ExportedComment {
  id: string;
  content: string;
  createdAt: Date;
}

interface ExportedAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  cloudinaryPublicId: string;
  createdAt: Date;
}

interface ExportedEpic {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to export a single board with all its data
 */
async function exportBoardData(boardId: string): Promise<ExportedBoard> {
  const board = await Board.findById(boardId);
  if (!board) {
    throw createError('Board not found', 404);
  }

  // Fetch all related data in parallel
  const [sections, tasks, epics] = await Promise.all([
    Section.findByBoardId(boardId),
    Task.findByBoardId(boardId),
    Epic.findByBoardId(boardId),
  ]);

  // Transform sections
  const exportedSections: ExportedSection[] = sections.map((section) => ({
    id: section._id.toString(),
    name: section.name,
    position: section.position,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  }));

  // Transform tasks with comments and attachments
  const exportedTasks: ExportedTask[] = tasks.map((task) => ({
    id: task._id.toString(),
    sectionId: task.sectionId.toString(),
    epicIds: task.epicIds.map((id) => id.toString()),
    title: task.title,
    description: task.description || null,
    priority: task.priority || null,
    storyPoints: task.storyPoints ?? null,
    endDate: task.endDate || null,
    position: task.position,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    comments: task.comments.map((comment) => ({
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
    })),
    attachments: task.attachments.map((attachment) => ({
      id: attachment._id.toString(),
      filename: attachment.filename,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size,
      cloudinaryPublicId: attachment.cloudinaryPublicId,
      createdAt: attachment.createdAt,
    })),
  }));

  // Transform epics
  const exportedEpics: ExportedEpic[] = epics.map((epic) => ({
    id: epic._id.toString(),
    name: epic.name,
    description: epic.description || null,
    color: epic.color,
    createdAt: epic.createdAt,
    updatedAt: epic.updatedAt,
  }));

  return {
    id: board._id.toString(),
    name: board.name,
    description: board.description || null,
    color: board.color,
    sectionOrder: board.sectionOrder.map((id) => id.toString()),
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    sections: exportedSections,
    tasks: exportedTasks,
    epics: exportedEpics,
  };
}

/**
 * GET /api/boards/:id/export
 * Export a single board with all its data (sections, tasks, epics, comments, attachments)
 */
router.get(
  '/boards/:id/export',
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

      // Verify board exists and user owns it
      const board = await Board.findById(boardId);
      if (!board) {
        throw createError('Board not found', 404);
      }

      if (board.userId.toString() !== userId) {
        throw createError('Access denied', 403);
      }

      // Export the board data
      const exportedBoard = await exportBoardData(boardId);

      res.status(200).json({
        success: true,
        data: {
          exportedAt: new Date().toISOString(),
          boards: [exportedBoard],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/export/all
 * Export all boards for the authenticated user
 */
router.get(
  '/export/all',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Get all boards for the user
      const boards = await Board.findByUserId(userId);

      // Export all boards in parallel
      const exportedBoards = await Promise.all(
        boards.map((board) => exportBoardData(board._id.toString()))
      );

      res.status(200).json({
        success: true,
        data: {
          exportedAt: new Date().toISOString(),
          boards: exportedBoards,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
