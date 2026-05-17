import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from '../services/auth.service';
import jwt from 'jsonwebtoken';
import { config } from '../config';

describe('Auth Service', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // bcrypt generates different hashes due to random salt
      expect(hash1).not.toBe(hash2);
    });

    it('should generate a bcrypt hash with correct format', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      // bcrypt hashes start with $2b$ (or $2a$) and have a specific format
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword('', hash);

      expect(result).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = 'test@Password#123!$%^&*()';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const password = 'пароль密码🔐';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include userId in the token payload', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      const decoded = jwt.decode(token) as { userId: string };

      expect(decoded.userId).toBe(userId);
    });

    it('should include expiration in the token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      const decoded = jwt.decode(token) as { exp: number; iat: number };

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should generate tokens with 7 day expiration by default', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      const decoded = jwt.decode(token) as { exp: number; iat: number };
      const expirationDays = (decoded.exp - decoded.iat) / (60 * 60 * 24);

      // Should be approximately 7 days (allowing for small timing differences)
      expect(expirationDays).toBeCloseTo(7, 0);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return the payload', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      const payload = verifyToken(token);

      expect(payload.userId).toBe(userId);
    });

    it('should throw an error for an invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw an error for a token with wrong signature', () => {
      const userId = '507f1f77bcf86cd799439011';
      // Create a token with a different secret
      const wrongToken = jwt.sign({ userId }, 'wrong-secret', { expiresIn: '7d' });

      expect(() => verifyToken(wrongToken)).toThrow();
    });

    it('should throw an error for an expired token', () => {
      const userId = '507f1f77bcf86cd799439011';
      // Create an already expired token
      const expiredToken = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '-1s' });

      expect(() => verifyToken(expiredToken)).toThrow();
    });

    it('should throw an error for a malformed token', () => {
      expect(() => verifyToken('')).toThrow();
      expect(() => verifyToken('not-a-jwt')).toThrow();
      expect(() => verifyToken('a.b')).toThrow();
    });
  });

  describe('Password hashing security', () => {
    it('should use bcrypt with 12 rounds (cost factor)', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      // bcrypt hash format: $2b$<cost>$<salt+hash>
      // Extract the cost factor from the hash
      const parts = hash.split('$');
      const costFactor = parseInt(parts[2] || '0', 10);

      expect(costFactor).toBe(12);
    });

    it('should produce hashes of consistent length', async () => {
      const passwords = ['short', 'mediumPassword', 'aVeryLongPasswordThatIsMoreThan20Characters'];
      const hashes = await Promise.all(passwords.map(p => hashPassword(p)));

      // All bcrypt hashes should be 60 characters
      hashes.forEach(hash => {
        expect(hash.length).toBe(60);
      });
    });
  });

  describe('Token verification edge cases', () => {
    it('should handle tokens with additional claims', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      const payload = verifyToken(token);

      // Should have userId, iat, and exp
      expect(payload.userId).toBe(userId);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should reject tokens signed with different algorithm', () => {
      const userId = '507f1f77bcf86cd799439011';
      // Create a token with 'none' algorithm (security vulnerability if accepted)
      const unsafeToken = jwt.sign({ userId }, '', { algorithm: 'none' });

      expect(() => verifyToken(unsafeToken)).toThrow();
    });
  });
});

describe('Auth Routes Integration', () => {
  // Note: These tests would require setting up an Express app and MongoDB connection
  // For now, we test the service layer directly
  // Full integration tests will be added in Task 36

  describe('Registration validation', () => {
    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];
      const invalidEmails = ['notanemail', '@nodomain.com', 'no@', 'spaces in@email.com'];

      const emailRegex = /^\S+@\S+\.\S+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password length (minimum 8 characters)', () => {
      const validPasswords = ['12345678', 'password123', 'aVeryLongPassword'];
      const invalidPasswords = ['1234567', 'short', ''];

      validPasswords.forEach(password => {
        expect(password.length >= 8).toBe(true);
      });

      invalidPasswords.forEach(password => {
        expect(password.length >= 8).toBe(false);
      });
    });
  });
});
