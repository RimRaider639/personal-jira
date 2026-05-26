import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import boardRoutes from './boards';
import sectionRoutes from './sections';
import taskRoutes from './tasks';
import epicRoutes from './epics';
import commentRoutes from './comments';
import attachmentRoutes from './attachments';
import exportRoutes from './export';
import activityRoutes from './activity';
import notesRoutes from './notes';
import streakRoutes from './streak';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Board routes
router.use('/boards', boardRoutes);

// Section routes (includes both /boards/:boardId/sections and /sections/:id endpoints)
router.use('/', sectionRoutes);

// Task routes (includes both /boards/:boardId/tasks and /tasks/:id endpoints)
router.use('/', taskRoutes);

// Epic routes (includes both /boards/:boardId/epics and /epics/:id endpoints)
router.use('/', epicRoutes);

// Comment routes (includes /tasks/:taskId/comments and /comments/:id endpoints)
router.use('/', commentRoutes);

// Attachment routes (includes /tasks/:taskId/attachments and /attachments/:id endpoints)
router.use('/', attachmentRoutes);

// Export routes (includes /boards/:id/export and /export/all endpoints)
router.use('/', exportRoutes);

// Activity routes (includes /boards/:boardId/activity endpoints)
router.use('/', activityRoutes);

// Notes routes (sticky notes for the fridge)
router.use('/notes', notesRoutes);

// Streak routes (gamification and daily check-ins)
router.use('/streak', streakRoutes);

export default router;
