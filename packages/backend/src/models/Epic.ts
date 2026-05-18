import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Epic document interface
 */
export interface IEpic {
  boardId: Types.ObjectId;
  name: string;
  description?: string | null;
  color: string;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Epic document with Mongoose methods
 */
export interface IEpicDocument extends IEpic, Document {}

/**
 * Epic model interface
 */
export interface IEpicModel extends Model<IEpicDocument> {
  findByBoardId(boardId: Types.ObjectId | string): Promise<IEpicDocument[]>;
}

/**
 * Hex color validation regex
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Default epic color (indigo)
 */
const DEFAULT_EPIC_COLOR = '#6366f1';

/**
 * Epic Schema
 * Represents a grouping/category for related tasks within a board
 */
const epicSchema = new Schema<IEpicDocument, IEpicModel>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Epic name is required'],
      trim: true,
      minlength: [1, 'Epic name must be at least 1 character'],
      maxlength: [100, 'Epic name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Epic description cannot exceed 500 characters'],
      default: null,
    },
    color: {
      type: String,
      default: DEFAULT_EPIC_COLOR,
      validate: {
        validator: function (v: string) {
          return HEX_COLOR_REGEX.test(v);
        },
        message: (props) => `${props.value} is not a valid hex color (e.g., #6366f1)`,
      },
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for board's epics
epicSchema.index({ boardId: 1, createdAt: -1 });

// Static method to find epics by board ID
epicSchema.statics.findByBoardId = function (
  boardId: Types.ObjectId | string
): Promise<IEpicDocument[]> {
  return this.find({ boardId }).sort({ createdAt: -1 });
};

// Transform _id to id and remove __v when converting to JSON
epicSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return ret;
  },
});

export const Epic = mongoose.model<IEpicDocument, IEpicModel>('Epic', epicSchema);

export default Epic;
