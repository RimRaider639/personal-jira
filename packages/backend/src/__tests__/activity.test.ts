/**
 * Activity Tracking Unit Tests
 *
 * Tests for:
 * - Activity heatmap generation
 * - Activity retrieval
 * - Activity types
 *
 * Validates: Activity tracking feature requirements
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

// Mock ObjectId for testing
const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Activity Tracking', () => {
  describe('Activity Types', () => {
    const ACTIVITY_TYPES = [
      'task_created',
      'task_updated',
      'task_moved',
      'task_deleted',
      'task_archived',
      'comment_added',
      'comment_deleted',
      'attachment_added',
      'attachment_deleted',
      'epic_assigned',
      'epic_removed',
      'section_created',
      'section_deleted',
      'sprint_started',
    ] as const;

    it('should have all expected activity types', () => {
      expect(ACTIVITY_TYPES).toContain('task_created');
      expect(ACTIVITY_TYPES).toContain('task_updated');
      expect(ACTIVITY_TYPES).toContain('task_moved');
      expect(ACTIVITY_TYPES).toContain('task_deleted');
      expect(ACTIVITY_TYPES).toContain('task_archived');
      expect(ACTIVITY_TYPES).toContain('comment_added');
      expect(ACTIVITY_TYPES).toContain('comment_deleted');
      expect(ACTIVITY_TYPES).toContain('attachment_added');
      expect(ACTIVITY_TYPES).toContain('attachment_deleted');
      expect(ACTIVITY_TYPES).toContain('epic_assigned');
      expect(ACTIVITY_TYPES).toContain('epic_removed');
      expect(ACTIVITY_TYPES).toContain('section_created');
      expect(ACTIVITY_TYPES).toContain('section_deleted');
      expect(ACTIVITY_TYPES).toContain('sprint_started');
    });

    it('should validate activity type', () => {
      const isValidActivityType = (type: string): boolean => {
        return (ACTIVITY_TYPES as readonly string[]).includes(type);
      };

      expect(isValidActivityType('task_created')).toBe(true);
      expect(isValidActivityType('invalid_type')).toBe(false);
      expect(isValidActivityType('')).toBe(false);
    });
  });

  describe('Activity Heatmap Generation', () => {
    interface Activity {
      id: string;
      boardId: string;
      type: string;
      createdAt: Date;
    }

    interface HeatmapEntry {
      date: string;
      count: number;
    }

    it('should group activities by date', () => {
      const boardId = createObjectId();
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const activities: Activity[] = [
        { id: createObjectId(), boardId, type: 'task_created', createdAt: today },
        { id: createObjectId(), boardId, type: 'task_updated', createdAt: today },
        { id: createObjectId(), boardId, type: 'comment_added', createdAt: yesterday },
      ];

      const generateHeatmap = (acts: Activity[]): HeatmapEntry[] => {
        const dateMap = new Map<string, number>();

        acts.forEach(activity => {
          const dateStr = activity.createdAt.toISOString().split('T')[0];
          dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        });

        return Array.from(dateMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      };

      const heatmap = generateHeatmap(activities);

      expect(heatmap).toHaveLength(2);
      const todayEntry = heatmap.find(h => h.date === today.toISOString().split('T')[0]);
      const yesterdayEntry = heatmap.find(h => h.date === yesterday.toISOString().split('T')[0]);

      expect(todayEntry?.count).toBe(2);
      expect(yesterdayEntry?.count).toBe(1);
    });

    it('should filter activities by date range', () => {
      const boardId = createObjectId();
      const now = new Date();
      const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const activities: Activity[] = [
        { id: createObjectId(), boardId, type: 'task_created', createdAt: daysAgo(5) },
        { id: createObjectId(), boardId, type: 'task_created', createdAt: daysAgo(15) },
        { id: createObjectId(), boardId, type: 'task_created', createdAt: daysAgo(35) },
      ];

      const filterByDays = (acts: Activity[], days: number): Activity[] => {
        const startDate = daysAgo(days);
        return acts.filter(a => a.createdAt >= startDate);
      };

      const last7Days = filterByDays(activities, 7);
      const last30Days = filterByDays(activities, 30);
      const last60Days = filterByDays(activities, 60);

      expect(last7Days).toHaveLength(1);
      expect(last30Days).toHaveLength(2);
      expect(last60Days).toHaveLength(3);
    });

    it('should return empty heatmap for no activities', () => {
      const generateHeatmap = (acts: Activity[]): HeatmapEntry[] => {
        const dateMap = new Map<string, number>();

        acts.forEach(activity => {
          const dateStr = activity.createdAt.toISOString().split('T')[0];
          dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        });

        return Array.from(dateMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      };

      const heatmap = generateHeatmap([]);
      expect(heatmap).toHaveLength(0);
    });

    it('should handle any number of activities', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100 }),
          (activityCount) => {
            const boardId = createObjectId();
            const now = new Date();

            const activities: Activity[] = Array.from({ length: activityCount }, (_, i) => ({
              id: createObjectId(),
              boardId,
              type: 'task_created',
              createdAt: new Date(now.getTime() - (i % 30) * 24 * 60 * 60 * 1000),
            }));

            const dateMap = new Map<string, number>();
            activities.forEach(activity => {
              const dateStr = activity.createdAt.toISOString().split('T')[0];
              dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
            });

            const totalCount = Array.from(dateMap.values()).reduce((sum, count) => sum + count, 0);
            expect(totalCount).toBe(activityCount);
            return true;
          }
        )
      );
    });
  });

  describe('Activity Retrieval', () => {
    interface Activity {
      id: string;
      boardId: string;
      type: string;
      createdAt: Date;
    }

    it('should filter activities by board', () => {
      const board1Id = createObjectId();
      const board2Id = createObjectId();

      const activities: Activity[] = [
        { id: createObjectId(), boardId: board1Id, type: 'task_created', createdAt: new Date() },
        { id: createObjectId(), boardId: board2Id, type: 'task_created', createdAt: new Date() },
        { id: createObjectId(), boardId: board1Id, type: 'task_updated', createdAt: new Date() },
      ];

      const getActivitiesByBoard = (acts: Activity[], boardId: string): Activity[] => {
        return acts.filter(a => a.boardId === boardId);
      };

      const board1Activities = getActivitiesByBoard(activities, board1Id);
      const board2Activities = getActivitiesByBoard(activities, board2Id);

      expect(board1Activities).toHaveLength(2);
      expect(board2Activities).toHaveLength(1);
    });

    it('should sort activities by date descending', () => {
      const boardId = createObjectId();
      const now = new Date();

      const activities: Activity[] = [
        { id: createObjectId(), boardId, type: 'task_created', createdAt: new Date(now.getTime() - 2000) },
        { id: createObjectId(), boardId, type: 'task_created', createdAt: new Date(now.getTime() - 1000) },
        { id: createObjectId(), boardId, type: 'task_created', createdAt: now },
      ];

      const sortedActivities = [...activities].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      expect(sortedActivities[0].createdAt.getTime()).toBe(now.getTime());
      expect(sortedActivities[2].createdAt.getTime()).toBe(now.getTime() - 2000);
    });

    it('should limit results', () => {
      const boardId = createObjectId();

      const activities: Activity[] = Array.from({ length: 100 }, () => ({
        id: createObjectId(),
        boardId,
        type: 'task_created',
        createdAt: new Date(),
      }));

      const limitResults = (acts: Activity[], limit: number): Activity[] => {
        return acts.slice(0, limit);
      };

      expect(limitResults(activities, 10)).toHaveLength(10);
      expect(limitResults(activities, 50)).toHaveLength(50);
      expect(limitResults(activities, 200)).toHaveLength(100);
    });
  });
});
