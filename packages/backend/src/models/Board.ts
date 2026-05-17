import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Hex color validation regex
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Default board color (blue)
 */
const DEFAULT_BOARD_COLOR = '#3b82f6';

/**
 * Board document interface
 */
export interface IBoard {
  userId: Types.ObjectId;
  name: string;
  description?: string | null;
  color: string;
  sectionOrder: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Board document with Mongoose methods
 */
export interface IBoardDocument extends IBoard, Document {}

/**
 * Board model interface
 */
export interface IBoardModel extends Model<IBoardDocument> {
  findByUserId(userId: Types.ObjectId | string): Promise<IBoardDocument[]>;
}

/**
 * Board Schema
 * Represents a Kanban board containing sections and tasks
 */
const boardSchema = new Schema<IBoardDocument, IBoardModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      minlength: [1, 'Board name must be at least 1 character'],
      maxlength: [100, 'Board name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Board description cannot exceed 500 characters'],
      default: null,
    },
    color: {
      type: String,
      default: DEFAULT_BOARD_COLOR,
      validate: {
        validator: function (v: string) {
          return HEX_COLOR_REGEX.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid hex color (e.g., #3b82f6)`,
      },
    },
    sectionOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Section',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for user's boards
boardSchema.index({ userId: 1, createdAt: -1 });

// Static method to find boards by user ID
boardSchema.statics.findByUserId = function (
  userId: Types.ObjectId | string
): Promise<IBoardDocument[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Transform _id to id and remove __v when converting to JSON
boardSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return ret;
  },
});

export const Board = mongoose.model<IBoardDocument, IBoardModel>('Board', boardSchema);

export default Board;
