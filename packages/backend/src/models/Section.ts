import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Section document interface
 */
export interface ISection {
  boardId: Types.ObjectId;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Section document with Mongoose methods
 */
export interface ISectionDocument extends ISection, Document {}

/**
 * Section model interface
 */
export interface ISectionModel extends Model<ISectionDocument> {
  findByBoardId(boardId: Types.ObjectId | string): Promise<ISectionDocument[]>;
  getNextPosition(boardId: Types.ObjectId | string): Promise<number>;
}

/**
 * Section Schema
 * Represents a column/section within a Kanban board
 */
const sectionSchema = new Schema<ISectionDocument, ISectionModel>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      minlength: [1, 'Section name must be at least 1 character'],
      maxlength: [50, 'Section name cannot exceed 50 characters'],
    },
    position: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Position cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for board sections ordered by position
sectionSchema.index({ boardId: 1, position: 1 });

// Static method to find sections by board ID, ordered by position
sectionSchema.statics.findByBoardId = function (
  boardId: Types.ObjectId | string
): Promise<ISectionDocument[]> {
  return this.find({ boardId }).sort({ position: 1 });
};

// Static method to get the next available position for a new section
sectionSchema.statics.getNextPosition = async function (
  boardId: Types.ObjectId | string
): Promise<number> {
  const lastSection = await this.findOne({ boardId }).sort({ position: -1 });
  return lastSection ? lastSection.position + 1 : 0;
};

// Transform _id to id and remove __v when converting to JSON
sectionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return ret;
  },
});

export const Section = mongoose.model<ISectionDocument, ISectionModel>('Section', sectionSchema);

export default Section;
