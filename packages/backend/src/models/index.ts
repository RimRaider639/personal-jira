/**
 * Mongoose Models Index
 *
 * This file exports all Mongoose models and their interfaces
 * for use throughout the application.
 */

// User model
export { User } from './User';
export type { IUser, IUserDocument, IUserModel } from './User';

// Board model
export { Board } from './Board';
export type { IBoard, IBoardDocument, IBoardModel } from './Board';

// Section model
export { Section } from './Section';
export type { ISection, ISectionDocument, ISectionModel } from './Section';

// Epic model
export { Epic } from './Epic';
export type { IEpic, IEpicDocument, IEpicModel } from './Epic';

// Task model with embedded documents
export { Task, PRIORITY_VALUES } from './Task';
export type {
  ITask,
  ITaskDocument,
  ITaskModel,
  IComment,
  IAttachment,
  Priority,
} from './Task';

// Activity model for tracking board activity
export { Activity, ACTIVITY_TYPES } from './Activity';
export type {
  IActivity,
  IActivityDocument,
  IActivityModel,
  ActivityType,
} from './Activity';

// Re-export mongoose Types for convenience
export { Types } from 'mongoose';
