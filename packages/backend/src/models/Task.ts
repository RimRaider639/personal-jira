import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Priority enum values
 */
export const PRIORITY_VALUES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITY_VALUES)[number];

/**
 * Comment sub-document interface (embedded in Task)
 */
export interface IComment {
  _id: Types.ObjectId;
  content: string;
  createdAt: Date;
}

/**
 * Attachment sub-document interface (embedded in Task)
 */
export interface IAttachment {
  _id: Types.ObjectId;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  cloudinaryPublicId: string;
  createdAt: Date;
}

/**
 * Task document interface
 */
export interface ITask {
  boardId: Types.ObjectId;
  sectionId: Types.ObjectId;
  epicIds: Types.ObjectId[];
  dependentTaskIds: Types.ObjectId[];
  title: string;
  description?: string | null;
  priority?: Priority | null;
  storyPoints?: number | null;
  endDate?: Date | null;
  position: number;
  isArchived: boolean;
  comments: IComment[];
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task document with Mongoose methods
 */
export interface ITaskDocument extends ITask, Document {
  addComment(content: string): IComment;
  removeComment(commentId: Types.ObjectId): boolean;
  addAttachment(attachment: Omit<IAttachment, '_id' | 'createdAt'>): IAttachment;
  removeAttachment(attachmentId: Types.ObjectId): boolean;
}

/**
 * Task model interface
 */
export interface ITaskModel extends Model<ITaskDocument> {
  findBySectionId(sectionId: Types.ObjectId | string): Promise<ITaskDocument[]>;
  findByBoardId(boardId: Types.ObjectId | string): Promise<ITaskDocument[]>;
  findByEpicIds(
    epicIds: (Types.ObjectId | string)[],
    matchAll?: boolean
  ): Promise<ITaskDocument[]>;
  getNextPosition(sectionId: Types.ObjectId | string): Promise<number>;
}

/**
 * Comment Sub-document Schema (embedded in Task)
 */
const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment must be at least 1 character'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

/**
 * Attachment Sub-document Schema (embedded in Task)
 */
const attachmentSchema = new Schema<IAttachment>(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

/**
 * Task Schema
 * Represents a task/work item within a section
 */
const taskSchema = new Schema<ITaskDocument, ITaskModel>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section ID is required'],
      index: true,
    },
    epicIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Epic',
      },
    ],
    dependentTaskIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Task title must be at least 1 character'],
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: null,
    },
    priority: {
      type: String,
      enum: {
        values: [...PRIORITY_VALUES, null],
        message: 'Priority must be one of: low, medium, high, critical, or null',
      },
      default: null,
    },
    storyPoints: {
      type: Number,
      default: null,
      min: [0, 'Story points cannot be negative'],
      max: [100, 'Story points cannot exceed 100'],
      validate: {
        validator: function (v: number | null) {
          return v === null || (Number.isInteger(v) && v >= 0 && v <= 100);
        },
        message: 'Story points must be an integer between 0 and 100',
      },
    },
    endDate: {
      type: Date,
      default: null,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Position cannot be negative'],
      validate: {
        validator: function (v: number) {
          return Number.isInteger(v) && v >= 0;
        },
        message: 'Position must be a non-negative integer',
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    comments: [commentSchema],
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search on title and description
taskSchema.index({ title: 'text', description: 'text' });

// Index for filtering by board
taskSchema.index({ boardId: 1 });

// Index for filtering by section and position
taskSchema.index({ sectionId: 1, position: 1 });

// Index for filtering by epic
taskSchema.index({ epicIds: 1 });

// Index for filtering by end date
taskSchema.index({ endDate: 1 });

// Index for filtering by priority
taskSchema.index({ priority: 1 });

// Compound index for board tasks ordered by section and position
taskSchema.index({ boardId: 1, sectionId: 1, position: 1 });

/**
 * Static method to find tasks by section ID, ordered by position
 */
taskSchema.statics.findBySectionId = function (
  sectionId: Types.ObjectId | string
): Promise<ITaskDocument[]> {
  return this.find({ sectionId }).sort({ position: 1 });
};

/**
 * Static method to find all tasks in a board
 */
taskSchema.statics.findByBoardId = function (
  boardId: Types.ObjectId | string
): Promise<ITaskDocument[]> {
  return this.find({ boardId }).sort({ sectionId: 1, position: 1 });
};

/**
 * Static method to find tasks by epic IDs with AND/OR logic
 * @param epicIds - Array of epic IDs to filter by
 * @param matchAll - If true, returns tasks that have ALL specified epics (AND logic).
 *                   If false, returns tasks that have ANY of the specified epics (OR logic).
 *                   Defaults to false (OR logic).
 */
taskSchema.statics.findByEpicIds = function (
  epicIds: (Types.ObjectId | string)[],
  matchAll: boolean = false
): Promise<ITaskDocument[]> {
  if (epicIds.length === 0) {
    return Promise.resolve([]);
  }

  if (matchAll) {
    // AND logic: task must have ALL specified epics
    return this.find({ epicIds: { $all: epicIds } }).sort({ createdAt: -1 });
  } else {
    // OR logic: task must have ANY of the specified epics
    return this.find({ epicIds: { $in: epicIds } }).sort({ createdAt: -1 });
  }
};

/**
 * Static method to get the next available position for a new task in a section
 */
taskSchema.statics.getNextPosition = async function (
  sectionId: Types.ObjectId | string
): Promise<number> {
  const lastTask = await this.findOne({ sectionId }).sort({ position: -1 });
  return lastTask ? lastTask.position + 1 : 0;
};

/**
 * Instance method to add a comment
 */
taskSchema.methods.addComment = function (content: string): IComment {
  const comment = {
    _id: new mongoose.Types.ObjectId(),
    content,
    createdAt: new Date(),
  };
  this.comments.push(comment);
  return comment;
};

/**
 * Instance method to remove a comment
 */
taskSchema.methods.removeComment = function (commentId: Types.ObjectId): boolean {
  const index = this.comments.findIndex(
    (c: IComment) => c._id.toString() === commentId.toString()
  );
  if (index === -1) return false;
  this.comments.splice(index, 1);
  return true;
};

/**
 * Instance method to add an attachment
 */
taskSchema.methods.addAttachment = function (
  attachment: Omit<IAttachment, '_id' | 'createdAt'>
): IAttachment {
  const newAttachment = {
    _id: new mongoose.Types.ObjectId(),
    ...attachment,
    createdAt: new Date(),
  };
  this.attachments.push(newAttachment);
  return newAttachment;
};

/**
 * Instance method to remove an attachment
 */
taskSchema.methods.removeAttachment = function (attachmentId: Types.ObjectId): boolean {
  const index = this.attachments.findIndex(
    (a: IAttachment) => a._id.toString() === attachmentId.toString()
  );
  if (index === -1) return false;
  this.attachments.splice(index, 1);
  return true;
};

// Transform _id to id and remove __v when converting to JSON
// Also transform nested comments and attachments _id to id
taskSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    
    // Transform comments _id to id
    if (Array.isArray(obj.comments)) {
      obj.comments = (obj.comments as Record<string, unknown>[]).map((comment) => ({
        ...comment,
        id: comment._id,
        _id: undefined,
      }));
    }
    
    // Transform attachments _id to id and rename fields to match shared types
    if (Array.isArray(obj.attachments)) {
      obj.attachments = (obj.attachments as Record<string, unknown>[]).map((attachment) => ({
        id: attachment._id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        fileSize: attachment.size,
        cloudinaryPublicId: attachment.cloudinaryPublicId,
        cloudinaryUrl: attachment.url,
        thumbnailUrl: null,
        createdAt: attachment.createdAt,
      }));
    }
    
    return ret;
  },
});

export const Task = mongoose.model<ITaskDocument, ITaskModel>('Task', taskSchema);

export default Task;
