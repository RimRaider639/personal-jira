import mongoose, { Document, Schema } from 'mongoose';

/**
 * Note interface - represents a sticky note in the fridge
 */
export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  color: string;
  position: number;
  isDone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Note schema
 */
const noteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    color: {
      type: String,
      default: '#fef08a', // Default yellow sticky note color
    },
    position: {
      type: Number,
      default: 0,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete (ret as { _id?: unknown })._id;
        delete (ret as { __v?: unknown }).__v;
        return ret;
      },
    },
  }
);

// Index for sorting by position
noteSchema.index({ userId: 1, position: 1 });

const Note = mongoose.model<INote>('Note', noteSchema);

export default Note;
