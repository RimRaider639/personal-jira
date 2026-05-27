import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import User from '../models/User';
import type { UserStreak, StreakMilestone, CheckInResponse } from '@kanban/shared';

const router = Router();

/**
 * Default timezone offset in minutes (IST = UTC+5:30 = -330 minutes)
 * Note: getTimezoneOffset() returns the opposite sign, so IST would be -330
 */
const DEFAULT_TIMEZONE_OFFSET = -330; // IST (UTC+5:30)

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
 * Get the date string (YYYY-MM-DD) in user's timezone
 */
function getDateStringInTimezone(date: Date, timezoneOffset: number): string {
  const utcTime = date.getTime();
  const localTime = utcTime - (timezoneOffset * 60 * 1000);
  const localDate = new Date(localTime);
  
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day in user's timezone
 */
function isSameDayInTimezone(date1: Date, date2: Date, timezoneOffset: number): boolean {
  return getDateStringInTimezone(date1, timezoneOffset) === getDateStringInTimezone(date2, timezoneOffset);
}

/**
 * Check if date1 is exactly one day before date2 (consecutive days) in user's timezone
 */
function isConsecutiveDayInTimezone(previousDate: Date, currentDate: Date, timezoneOffset: number): boolean {
  const prevDateStr = getDateStringInTimezone(previousDate, timezoneOffset);
  const currDateStr = getDateStringInTimezone(currentDate, timezoneOffset);
  
  // Parse the date strings and check if they're consecutive
  const prev = new Date(prevDateStr + 'T00:00:00Z');
  const curr = new Date(currDateStr + 'T00:00:00Z');
  
  // Add one day to previous date
  prev.setUTCDate(prev.getUTCDate() + 1);
  
  return prev.getTime() === curr.getTime();
}

/**
 * Parse timezone offset from request
 * Accepts: header 'x-timezone-offset' with value in minutes (e.g., -330 for IST)
 */
function getTimezoneOffset(req: AuthenticatedRequest): number {
  const headerValue = req.headers['x-timezone-offset'];
  if (headerValue) {
    const offset = parseInt(String(headerValue), 10);
    if (!isNaN(offset) && offset >= -720 && offset <= 840) {
      return offset;
    }
  }
  return DEFAULT_TIMEZONE_OFFSET; // Default to IST
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

      const timezoneOffset = getTimezoneOffset(req);
      const now = new Date();

      // Check if user has checked in today (in user's timezone)
      const todayCheckedIn = user.lastCheckInDate 
        ? isSameDayInTimezone(user.lastCheckInDate, now, timezoneOffset)
        : false;

      // Check if streak is still valid (checked in yesterday or today in user's timezone)
      let currentStreak = user.currentStreak;
      if (user.lastCheckInDate && !todayCheckedIn) {
        // Check if last check-in was yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!isSameDayInTimezone(user.lastCheckInDate, yesterday, timezoneOffset)) {
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

      const timezoneOffset = getTimezoneOffset(req);
      const now = new Date();

      // Check if already checked in today (in user's timezone)
      if (user.lastCheckInDate && isSameDayInTimezone(user.lastCheckInDate, now, timezoneOffset)) {
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
      } else if (isConsecutiveDayInTimezone(user.lastCheckInDate, now, timezoneOffset)) {
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

      // Update user - store the actual check-in time (not normalized)
      user.currentStreak = newStreak;
      user.longestStreak = newLongestStreak;
      user.lastCheckInDate = now;
      user.totalCheckIns = (user.totalCheckIns || 0) + 1;
      await user.save();

      // Check for milestone
      const milestone = getMilestoneForStreak(newStreak);

      const streak: UserStreak = {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: now.toISOString(),
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
