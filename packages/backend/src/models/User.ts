import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User document interface
 */
export interface IUser {
  email: string;
  passwordHash: string;
  displayName: string;
  // Streak fields
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Date | null;
  totalCheckIns: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User document with Mongoose methods
 */
export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User model interface
 */
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  hashPassword(password: string): Promise<string>;
}

/**
 * User Schema
 * Stores user authentication and profile information
 */
const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [255, 'Email cannot exceed 255 characters'],
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },
    // Streak fields
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastCheckInDate: {
      type: Date,
      default: null,
    },
    totalCheckIns: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for email lookups
userSchema.index({ email: 1 });

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to hash a password
userSchema.statics.hashPassword = async function (password: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Instance method to compare password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform _id to id and remove sensitive fields when converting to JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.passwordHash;
    delete obj.__v;
    return ret;
  },
});

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
