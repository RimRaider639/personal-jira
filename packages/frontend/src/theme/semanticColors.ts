/**
 * Semantic Color Palette
 * 
 * Centralized color definitions for consistent styling across the app.
 * All colors are defined here and should be imported from this file.
 * 
 * Usage:
 *   import { statusColors, priorityColors, getStatusColor } from '@/theme/semanticColors';
 */

// ==================== TYPE DEFINITIONS ====================

/** Color set with solid, background, and text variants */
export interface ColorSet {
  solid: string;
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
}

/** Extended color set with border variant */
export interface ColorSetWithBorder extends ColorSet {
  border: string;
}

/** Streak color set with glow effect */
export interface StreakColorSet extends ColorSetWithBorder {
  glow: string;
}

// ==================== STATUS COLORS ====================
// Used for task/section status indicators

/**
 * Status color mapping based on section/status names
 * These are the canonical colors for each status type
 */
export const statusColors: Record<string, ColorSet> = {
  // Done/Complete states - Green
  done: {
    solid: '#22c55e',      // green.500
    bg: '#f0fdf4',         // green.50
    bgDark: '#14532d',     // green.900
    text: '#15803d',       // green.700
    textDark: '#86efac',   // green.300
  },
  
  // In Progress/Doing states - Orange
  inProgress: {
    solid: '#f97316',      // orange.500
    bg: '#fff7ed',         // orange.50
    bgDark: '#7c2d12',     // orange.900
    text: '#c2410c',       // orange.700
    textDark: '#fdba74',   // orange.300
  },
  
  // Review/Testing states - Purple
  review: {
    solid: '#8b5cf6',      // purple.500
    bg: '#faf5ff',         // purple.50
    bgDark: '#581c87',     // purple.900
    text: '#7c3aed',       // purple.600
    textDark: '#c4b5fd',   // purple.300
  },
  
  // Blocked/On Hold states - Red
  blocked: {
    solid: '#ef4444',      // red.500
    bg: '#fef2f2',         // red.50
    bgDark: '#7f1d1d',     // red.900
    text: '#dc2626',       // red.600
    textDark: '#fca5a5',   // red.300
  },
  
  // To Do/Backlog/New states - Blue
  todo: {
    solid: '#3b82f6',      // blue.500
    bg: '#eff6ff',         // blue.50
    bgDark: '#1e3a8a',     // blue.900
    text: '#2563eb',       // blue.600
    textDark: '#93c5fd',   // blue.300
  },
  
  // Default/Unknown states - Gray
  default: {
    solid: '#6b7280',      // gray.500
    bg: '#f9fafb',         // gray.50
    bgDark: '#374151',     // gray.700
    text: '#4b5563',       // gray.600
    textDark: '#d1d5db',   // gray.300
  },
};

/**
 * Get status color based on section/status name
 * Matches common naming patterns for kanban columns
 */
export function getStatusColor(sectionName: string | undefined): string {
  if (!sectionName) return statusColors.default.solid;
  
  const name = sectionName.toLowerCase();
  
  // Done/Complete - Green
  if (name.includes('done') || name.includes('complete') || name.includes('finished') || name.includes('closed')) {
    return statusColors.done.solid;
  }
  
  // In Progress/Doing - Orange
  if (name.includes('progress') || name.includes('doing') || name.includes('working') || name.includes('active')) {
    return statusColors.inProgress.solid;
  }
  
  // Review/Testing - Purple
  if (name.includes('review') || name.includes('test') || name.includes('qa') || name.includes('verify')) {
    return statusColors.review.solid;
  }
  
  // Blocked/On Hold - Red
  if (name.includes('block') || name.includes('hold') || name.includes('stuck') || name.includes('wait')) {
    return statusColors.blocked.solid;
  }
  
  // To Do/Backlog - Blue
  if (name.includes('todo') || name.includes('to do') || name.includes('backlog') || name.includes('new') || name.includes('open')) {
    return statusColors.todo.solid;
  }
  
  return statusColors.default.solid;
}

/**
 * Get full status color object based on section/status name
 */
export function getStatusColorSet(sectionName: string | undefined): ColorSet {
  if (!sectionName) return statusColors.default;
  
  const name = sectionName.toLowerCase();
  
  if (name.includes('done') || name.includes('complete') || name.includes('finished') || name.includes('closed')) {
    return statusColors.done;
  }
  if (name.includes('progress') || name.includes('doing') || name.includes('working') || name.includes('active')) {
    return statusColors.inProgress;
  }
  if (name.includes('review') || name.includes('test') || name.includes('qa') || name.includes('verify')) {
    return statusColors.review;
  }
  if (name.includes('block') || name.includes('hold') || name.includes('stuck') || name.includes('wait')) {
    return statusColors.blocked;
  }
  if (name.includes('todo') || name.includes('to do') || name.includes('backlog') || name.includes('new') || name.includes('open')) {
    return statusColors.todo;
  }
  
  return statusColors.default;
}


// ==================== PRIORITY COLORS ====================
// Used for task priority indicators

export const priorityColors: Record<string, ColorSet> = {
  critical: {
    solid: '#dc2626',      // red.600
    bg: '#fef2f2',         // red.50
    bgDark: '#450a0a',     // red.950
    text: '#dc2626',       // red.600
    textDark: '#fca5a5',   // red.300
  },
  high: {
    solid: '#f97316',      // orange.500
    bg: '#fff7ed',         // orange.50
    bgDark: '#431407',     // orange.950
    text: '#ea580c',       // orange.600
    textDark: '#fdba74',   // orange.300
  },
  medium: {
    solid: '#eab308',      // yellow.500
    bg: '#fefce8',         // yellow.50
    bgDark: '#422006',     // yellow.950
    text: '#ca8a04',       // yellow.600
    textDark: '#fde047',   // yellow.300
  },
  low: {
    solid: '#22c55e',      // green.500
    bg: '#f0fdf4',         // green.50
    bgDark: '#052e16',     // green.950
    text: '#16a34a',       // green.600
    textDark: '#86efac',   // green.300
  },
};

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Get priority color (solid) by priority level
 */
export function getPriorityColor(priority: string | null | undefined): string {
  if (!priority) return statusColors.default.solid;
  
  const level = priority.toLowerCase();
  return priorityColors[level]?.solid || statusColors.default.solid;
}

/**
 * Get full priority color object by priority level
 */
export function getPriorityColorSet(priority: string | null | undefined): ColorSet {
  if (!priority) return priorityColors.low;
  
  const level = priority.toLowerCase();
  return priorityColors[level] || priorityColors.low;
}


// ==================== DEADLINE COLORS ====================
// Used for due date indicators

export const deadlineColors: Record<string, ColorSet> = {
  overdue: {
    solid: '#ef4444',      // red.500
    bg: '#fef2f2',         // red.50
    bgDark: '#7f1d1d',     // red.900
    text: '#dc2626',       // red.600
    textDark: '#fca5a5',   // red.300
  },
  urgent: {
    solid: '#f97316',      // orange.500
    bg: '#fff7ed',         // orange.50
    bgDark: '#7c2d12',     // orange.900
    text: '#ea580c',       // orange.600
    textDark: '#fdba74',   // orange.300
  },
  upcoming: {
    solid: '#eab308',      // yellow.500
    bg: '#fefce8',         // yellow.50
    bgDark: '#713f12',     // yellow.900
    text: '#ca8a04',       // yellow.600
    textDark: '#fde047',   // yellow.300
  },
  normal: {
    solid: '#22c55e',      // green.500
    bg: '#f0fdf4',         // green.50
    bgDark: '#14532d',     // green.900
    text: '#16a34a',       // green.600
    textDark: '#86efac',   // green.300
  },
  none: {
    solid: '#6b7280',      // gray.500
    bg: '#f9fafb',         // gray.50
    bgDark: '#374151',     // gray.700
    text: '#4b5563',       // gray.600
    textDark: '#d1d5db',   // gray.300
  },
};

export interface DeadlineInfo {
  text: string;
  color: string;
  colorSet: ColorSet;
  isOverdue: boolean;
  isUrgent: boolean;
  daysRemaining: number;
}

/**
 * Calculate deadline info including color and display text
 */
export function getDeadlineInfo(endDate: string | null | undefined): DeadlineInfo | null {
  if (!endDate) return null;
  
  const deadline = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 2;
  
  let text: string;
  let colorSet: ColorSet;
  
  if (isOverdue) {
    text = `${Math.abs(diffDays)}d overdue`;
    colorSet = deadlineColors.overdue;
  } else if (diffDays === 0) {
    text = 'Today';
    colorSet = deadlineColors.urgent;
  } else if (diffDays === 1) {
    text = '1d left';
    colorSet = deadlineColors.urgent;
  } else if (diffDays <= 7) {
    text = `${diffDays}d left`;
    colorSet = deadlineColors.upcoming;
  } else {
    text = `${diffDays}d left`;
    colorSet = deadlineColors.normal;
  }
  
  return {
    text,
    color: colorSet.solid,
    colorSet,
    isOverdue,
    isUrgent,
    daysRemaining: diffDays,
  };
}


// ==================== ACTIVITY/HEATMAP COLORS ====================
// Used for activity heatmaps

export const heatmapColors = {
  level0: '#e5e7eb',       // gray.200 - no activity
  level1: '#bbf7d0',       // green.200 - low activity (1-2)
  level2: '#4ade80',       // green.400 - medium activity (3-5)
  level3: '#22c55e',       // green.500 - high activity (6-10)
  level4: '#16a34a',       // green.600 - very high activity (10+)
};

/**
 * Get heatmap color based on activity count
 */
export function getHeatmapColor(count: number): string {
  if (count === 0) return heatmapColors.level0;
  if (count <= 2) return heatmapColors.level1;
  if (count <= 5) return heatmapColors.level2;
  if (count <= 10) return heatmapColors.level3;
  return heatmapColors.level4;
}


// ==================== CHART COLORS ====================
// Used for pie charts, bar charts, etc.

export const chartColors = [
  '#6366f1',  // indigo.500 (brand)
  '#22c55e',  // green.500
  '#f97316',  // orange.500
  '#ef4444',  // red.500
  '#8b5cf6',  // purple.500
  '#06b6d4',  // cyan.500
  '#ec4899',  // pink.500
  '#eab308',  // yellow.500
  '#14b8a6',  // teal.500
  '#3b82f6',  // blue.500
];

/**
 * Get chart color by index (cycles through palette)
 */
export function getChartColor(index: number): string {
  return chartColors[index % chartColors.length];
}


// ==================== FEEDBACK COLORS ====================
// Used for toasts, alerts, badges

export const feedbackColors: Record<string, ColorSetWithBorder> = {
  success: {
    solid: '#22c55e',
    bg: '#f0fdf4',
    bgDark: '#14532d',
    border: '#86efac',
    text: '#15803d',
    textDark: '#86efac',
  },
  warning: {
    solid: '#f59e0b',
    bg: '#fffbeb',
    bgDark: '#78350f',
    border: '#fcd34d',
    text: '#b45309',
    textDark: '#fcd34d',
  },
  error: {
    solid: '#ef4444',
    bg: '#fef2f2',
    bgDark: '#7f1d1d',
    border: '#fca5a5',
    text: '#dc2626',
    textDark: '#fca5a5',
  },
  info: {
    solid: '#3b82f6',
    bg: '#eff6ff',
    bgDark: '#1e3a8a',
    border: '#93c5fd',
    text: '#2563eb',
    textDark: '#93c5fd',
  },
};


// ==================== STREAK COLORS ====================
// Used for streak/gamification UI

export const streakColors: Record<string, StreakColorSet> = {
  active: {
    solid: '#f97316',      // orange.500
    bg: '#fff7ed',         // orange.50
    bgDark: '#7c2d12',     // orange.900
    border: '#fb923c',     // orange.400
    text: '#ea580c',       // orange.600
    textDark: '#fdba74',   // orange.300
    glow: 'rgba(249, 115, 22, 0.3)',
  },
  inactive: {
    solid: '#9ca3af',      // gray.400
    bg: '#f3f4f6',         // gray.100
    bgDark: '#374151',     // gray.700
    border: '#d1d5db',     // gray.300
    text: '#6b7280',       // gray.500
    textDark: '#9ca3af',   // gray.400
    glow: 'transparent',
  },
};


// ==================== EXPORT ALL ====================

export default {
  status: statusColors,
  priority: priorityColors,
  deadline: deadlineColors,
  heatmap: heatmapColors,
  chart: chartColors,
  feedback: feedbackColors,
  streak: streakColors,
};
