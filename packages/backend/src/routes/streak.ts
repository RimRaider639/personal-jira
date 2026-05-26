import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import User from '../models/User';
import type { UserStreak, StreakMilestone, CheckInResponse } from '@kanban/shared';

const router = Router();

/**
 * Streak milestones - achievements for reaching certain streak lengths
 */
const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 1, title: 'First Step', emoji: '🌱', message: 'You started your streak! Keep it going!' },
  { days: 3, title: 'Getting Started', emoji: '🔥', message: '3 days strong! You\'re building momentum!' },
  { days: 7, title: 'Week Warrior', emoji: '⚡', message: 'A full week! You\'re on fire!' },
  { days: 14, title: 'Two Week Champion', emoji: '🏆', message: '2 weeks of consistency! Amazing!' },
  { days: 21, title: 'Habit Former', emoji: '💪', message: '21 days - a habit is forming!' },
  { days: 30, title: 'Monthly Master', emoji: '🌟', message: 'A whole month! You\'re unstoppable!' },
  { days: 50, title: 'Fifty & Fierce', emoji: '💎', message: '50 days! You\'re a productivity legend!' },
  { days: 100, title: 'Century Club', emoji: '👑', message: '100 days! You\'ve achieved greatness!' },
  { days: 365, title: 'Year of Excellence', emoji: '🎯', message: 'A full year! Absolutely incredible!' },
];

/**
 * Get the milestone for a given streak count (if any)
 */
function getMilestoneForStreak(days: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.days === days) || null;
}

/**
 * Check if two dates are the same day (in UTC)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Check if date1 is exactly one day before date2 (consecutive days)
 */
function isConsecutiveDay(previousDate: Date, currentDate: Date): boolean {
  const prev = new Date(previousDate);
  prev.setUTCDate(prev.getUTCDate() + 1);
  return isSameDay(prev, currentDate);
}

/**
 * GET /api/streak
 * Get current user's streak information
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

      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Check if user has checked in today
      const todayCheckedIn = user.lastCheckInDate 
        ? isSameDay(user.lastCheckInDate, today)
        : false;

      // Check if streak is still valid (checked in yesterday or today)
      let currentStreak = user.currentStreak;
      if (user.lastCheckInDate && !todayCheckedIn) {
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        if (!isSameDay(user.lastCheckInDate, yesterday)) {
          // Streak is broken - reset it
          currentStreak = 0;
        }
      }

      const streak: UserStreak = {
        currentStreak,
        longestStreak: user.longestStreak,
        lastCheckInDate: user.lastCheckInDate?.toISOString() || null,
        totalCheckIns: user.totalCheckIns,
        todayCheckedIn,
      };

      res.status(200).json({
        success: true,
        data: streak,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/streak/checkin
 * Record a daily check-in and update streak
 */
router.post(
  '/checkin',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Check if already checked in today
      if (user.lastCheckInDate && isSameDay(user.lastCheckInDate, today)) {
        const streak: UserStreak = {
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          lastCheckInDate: user.lastCheckInDate.toISOString(),
          totalCheckIns: user.totalCheckIns,
          todayCheckedIn: true,
        };

        const response: CheckInResponse = {
          streak,
          milestone: null,
          isNewStreak: false,
          streakBroken: false,
        };

        res.status(200).json({
          success: true,
          data: response,
          message: 'Already checked in today',
        });
        return;
      }

      let newStreak: number;
      let streakBroken = false;
      let isNewStreak = false;

      if (!user.lastCheckInDate) {
        // First ever check-in
        newStreak = 1;
        isNewStreak = true;
      } else if (isConsecutiveDay(user.lastCheckInDate, today)) {
        // Consecutive day - increment streak
        newStreak = user.currentStreak + 1;
      } else {
        // Streak broken - start fresh
        newStreak = 1;
        streakBroken = user.currentStreak > 0;
        isNewStreak = true;
      }

      // Update longest streak if needed
      const newLongestStreak = Math.max(user.longestStreak, newStreak);

      // Update user
      user.currentStreak = newStreak;
      user.longestStreak = newLongestStreak;
      user.lastCheckInDate = today;
      user.totalCheckIns = (user.totalCheckIns || 0) + 1;
      await user.save();

      // Check for milestone
      const milestone = getMilestoneForStreak(newStreak);

      const streak: UserStreak = {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: today.toISOString(),
        totalCheckIns: user.totalCheckIns,
        todayCheckedIn: true,
      };

      const response: CheckInResponse = {
        streak,
        milestone,
        isNewStreak,
        streakBroken,
      };

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
