// Validation utilities
export {
  isValidPriority,
  isValidStoryPoints,
  isValidEndDate,
  isValidMimeType,
  ALLOWED_MIME_TYPES,
  MAX_STORY_POINTS,
} from './validation';

// Core Entity Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  sectionOrder: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Epic {
  id: string;
  boardId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  sectionId: string;
  boardId: string;
  title: string;
  description: string | null;
  priority: Priority | null;
  storyPoints: number | null;
  endDate: string | null;
  position: number;
  epicIds: string[];
  comments: Comment[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

// Filter Types
export type DueDateFilter = 'today' | 'week' | '7days' | 'overdue' | 'all';

export interface FilterState {
  epicIds: string[];
  priorities: Priority[];
  dueDateFilter: DueDateFilter | null;
  searchQuery: string;
}

// Sync Types
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface ConflictInfo {
  entityType: 'task' | 'section' | 'epic' | 'comment';
  entityId: string;
  localVersion: unknown;
  serverVersion: unknown;
  resolvedVersion: unknown;
  resolution: 'server_wins' | 'client_wins' | 'merged';
}

// API Types
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    requestId: string;
  };
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// WebSocket Event Types
export interface ClientEvents {
  'board:subscribe': { boardId: string };
  'board:unsubscribe': { boardId: string };
  'task:update': { taskId: string; changes: Partial<Task>; timestamp: number };
  'task:move': { taskId: string; sectionId: string; position: number; timestamp: number };
  'section:reorder': { boardId: string; sectionOrder: string[]; timestamp: number };
}

export interface ServerEvents {
  'sync:ack': { eventId: string; serverTimestamp: number };
  'task:updated': { task: Task; updatedBy: string };
  'task:created': { task: Task };
  'task:deleted': { taskId: string };
  'task:moved': { taskId: string; sectionId: string; position: number };
  'section:updated': { section: Section };
  'section:created': { section: Section };
  'section:deleted': { sectionId: string };
  'section:reordered': { boardId: string; sectionOrder: string[] };
  'epic:updated': { epic: Epic };
  'epic:created': { epic: Epic };
  'epic:deleted': { epicId: string };
  'comment:created': { comment: Comment };
  'comment:updated': { comment: Comment };
  'comment:deleted': { commentId: string };
  'conflict:detected': { conflictInfo: ConflictInfo };
}

// Request/Response Types
export interface CreateBoardRequest {
  name: string;
  description?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  sectionId?: string;
  priority?: Priority;
  storyPoints?: number;
  endDate?: string;
  epicIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  priority?: Priority | null;
  storyPoints?: number | null;
  endDate?: string | null;
  epicIds?: string[];
}

export interface MoveTaskRequest {
  sectionId: string;
  position: number;
}

export interface CreateEpicRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
