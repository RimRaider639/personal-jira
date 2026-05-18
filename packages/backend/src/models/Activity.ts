import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Activity types for tracking
 */
export const ACTIVITY_TYPES = [
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

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * Activity document interface
 */
export interface IActivity {
  boardId: Types.ObjectId;
  userId: Types.ObjectId;
  type: ActivityType;
  entityId: Types.ObjectId;
  entityType: 'task' | 'section' | 'epic' | 'comment' | 'attachment' | 'board';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Activity document with Mongoose methods
 */
export interface IActivityDocument extends IActivity, Document {}

/**
 * Activity model interface
 */
export interface IActivityModel extends Model<IActivityDocument> {
  findByBoardId(boardId: Types.ObjectId | string, days?: number): Promise<IActivityDocument[]>;
  getActivityHeatmap(boardId: Types.ObjectId | string, days: number): Promise<{ date: string; count: number }[]>;
}

/**
 * Activity Schema
 * Tracks all activity on a board for heatmap visualization
 */
const activitySchema = new Schema<IActivityDocument, IActivityModel>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: {
        values: ACTIVITY_TYPES,
        message: 'Invalid activity type',
      },
      required: [true, 'Activity type is required'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },
    entityType: {
      type: String,
      enum: ['task', 'section', 'epic', 'comment', 'attachment', 'board'],
      required: [true, 'Entity type is required'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient querying by board and date
activitySchema.index({ boardId: 1, createdAt: -1 });

// Index for heatmap aggregation
activitySchema.index({ boardId: 1, createdAt: 1 });

/**
 * Static method to find activities by board ID
 */
activitySchema.statics.findByBoardId = function (
  boardId: Types.ObjectId | string,
  days: number = 30
): Promise<IActivityDocument[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    boardId,
    createdAt: { $gte: startDate },
  }).sort({ createdAt: -1 });
};

/**
 * Static method to get activity heatmap data
 */
activitySchema.statics.getActivityHeatmap = async function (
  boardId: Types.ObjectId | string,
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const result = await this.aggregate([
    {
      $match: {
        boardId: new mongoose.Types.ObjectId(boardId.toString()),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
      },
    },
  ]);

  return result;
};

// Transform _id to id and remove __v when converting to JSON
activitySchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return ret;
  },
});

export const Activity = mongoose.model<IActivityDocument, IActivityModel>('Activity', activitySchema);

export default Activity;
