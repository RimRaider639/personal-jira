import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

/**
 * Number of salt rounds for bcrypt hashing
 */
const BCRYPT_SALT_ROUNDS = 12;

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt with 12 rounds
 * @param password - The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - The plain text password to compare
 * @param hash - The hashed password to compare against
 * @returns true if the passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param userId - The user's ID to include in the token
 * @returns The generated JWT token
 */
export function generateToken(userId: string): string {
  const payload: JwtPayload = { userId };
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Verify a JWT token and extract the payload
 * @param token - The JWT token to verify
 * @returns The decoded payload if valid
 * @throws Error if the token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwtSecret) as unknown as JwtPayload;
  return decoded;
}

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
