import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { AuthProvider } from '@kanban/shared';

/**
 * API Key interface for credentials management
 */
export interface IApiKey {
  name: string;
  keyHash: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
}

/**
 * Bot Token interface for credentials management
 */
export interface IBotToken {
  service: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Credentials interface for future API keys and bot tokens
 */
export interface ICredentials {
  apiKeys: IApiKey[];
  botTokens: IBotToken[];
}

/**
 * User document interface
 */
export interface IUser {
  email: string;
  passwordHash: string;
  displayName: string;
  // Firebase OAuth fields
  firebaseUid: string | null;
  authProvider: AuthProvider;
  // Streak fields
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Date | null;
  totalCheckIns: number;
  // Future permissions management
  permissions: string[];
  credentials: ICredentials;
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
  findByFirebaseUid(uid: string): Promise<IUserDocument | null>;
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
      required: function (this: IUserDocument) {
        // Password is required only for email auth provider
        return this.authProvider === 'email';
      },
      default: '',
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },
    // Firebase OAuth fields
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'linked'],
      default: 'email',
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
    // Future permissions management
    permissions: {
      type: [String],
      default: [],
    },
    credentials: {
      type: {
        apiKeys: [
          {
            name: String,
            keyHash: String,
            createdAt: { type: Date, default: Date.now },
            lastUsedAt: { type: Date, default: null },
            expiresAt: { type: Date, default: null },
          },
        ],
        botTokens: [
          {
            service: String,
            tokenHash: String,
            createdAt: { type: Date, default: Date.now },
            expiresAt: { type: Date, default: null },
          },
        ],
      },
      default: { apiKeys: [], botTokens: [] },
    },
  },
  {
    timestamps: true,
  }
);

// Index for email lookups
userSchema.index({ email: 1 });

// Sparse unique index for firebaseUid (allows null values)
userSchema.index({ firebaseUid: 1 }, { sparse: true });

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by Firebase UID
userSchema.statics.findByFirebaseUid = function (uid: string): Promise<IUserDocument | null> {
  return this.findOne({ firebaseUid: uid });
};

// Static method to hash a password
userSchema.statics.hashPassword = async function (password: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Instance method to compare password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save validation: firebaseUid required for google/linked providers
userSchema.pre<IUserDocument>('save', function () {
  if ((this.authProvider === 'google' || this.authProvider === 'linked') && !this.firebaseUid) {
    throw new Error('Firebase UID is required for Google or linked authentication');
  }
});

// Transform _id to id and remove sensitive fields when converting to JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = obj._id;
    delete obj._id;
    delete obj.passwordHash;
    delete obj.__v;
    delete obj.credentials; // Never expose credentials
    return ret;
  },
});

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
