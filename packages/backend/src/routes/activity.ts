import { Router, Response, NextFunction } from 'express';
import { Activity, Board } from '../models';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/boards/:boardId/activity/heatmap
 * Get activity heatmap data for a board
 */
router.get(
  '/boards/:boardId/activity/heatmap',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const boardId = req.params.boardId as string;
      const days = parseInt(req.query.days as string) || 30;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Verify board exists and belongs to user
      const board = await Board.findById(boardId);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      if (board.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const heatmap = await Activity.getActivityHeatmap(boardId, days);
      
      res.json({ heatmap, days });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/boards/:boardId/activity
 * Get recent activity for a board
 */
router.get(
  '/boards/:boardId/activity',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const boardId = req.params.boardId as string;
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 50;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Verify board exists and belongs to user
      const board = await Board.findById(boardId);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      if (board.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const activities = await Activity.findByBoardId(boardId, days);
      
      res.json(activities.slice(0, limit));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
