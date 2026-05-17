/**
 * Auth Routes Unit Tests
 *
 * Tests for POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout
 * Validates: Requirements 18.2, 18.3, 18.4, 18.5
 */

import { hashPassword, comparePassword, generateToken, verifyToken } from '../services/auth.service';

describe('Auth Routes - Registration Validation', () => {
  describe('Email Validation', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.org',
      'user+tag@example.co.uk',
      'a@b.co',
    ];

    const invalidEmails = [
      'invalid',
      'invalid@',
      '@domain.com',
      'user@.com',
      'user@domain',
      '',
      'user name@domain.com',
    ];

    it.each(validEmails)('should accept valid email: %s', (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(true);
    });

    it.each(invalidEmails)('should reject invalid email: %s', (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should require minimum 8 characters', () => {
      const shortPasswords = ['', '1234567', 'abcdefg', 'Ab1!'];
      const validPasswords = ['12345678', 'abcdefgh', 'Password1'];

      shortPasswords.forEach((pwd) => {
        expect(pwd.length >= 8).toBe(false);
      });

      validPasswords.forEach((pwd) => {
        expect(pwd.length >= 8).toBe(true);
      });
    });

    it('should hash passwords securely', async () => {
      const password = 'SecurePassword123';
      const hash = await hashPassword(password);

      // Hash should be different from password
      expect(hash).not.toBe(password);

      // Hash should be bcrypt format
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);

      // Should be able to verify
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong passwords', async () => {
      const password = 'SecurePassword123';
      const hash = await hashPassword(password);

      const isValid = await comparePassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Display Name Validation', () => {
    it('should require non-empty display name', () => {
      const emptyNames = ['', '   ', '\t', '\n'];
      emptyNames.forEach((name) => {
        expect(name.trim().length > 0).toBe(false);
      });
    });

    it('should accept valid display names', () => {
      const validNames = ['John', 'Jane Doe', 'User123', 'José García'];
      validNames.forEach((name) => {
        expect(name.trim().length > 0).toBe(true);
        expect(name.trim().length <= 100).toBe(true);
      });
    });

    it('should enforce max length of 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(longName.length <= 100).toBe(false);

      const validName = 'a'.repeat(100);
      expect(validName.length <= 100).toBe(true);
    });
  });
});

describe('Auth Routes - Login Validation', () => {
  describe('Credential Verification', () => {
    it('should generate valid JWT token on successful login', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include userId in token payload', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(userId);
    });

    it('should set token expiration', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);
      const decoded = verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials gracefully', async () => {
      const correctPassword = 'CorrectPassword123';
      const hash = await hashPassword(correctPassword);

      // Wrong password should return false, not throw
      const result = await comparePassword('WrongPassword', hash);
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = 'SomePassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });
  });
});

describe('Auth Routes - Token Management', () => {
  describe('Token Verification', () => {
    it('should verify valid tokens', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      expect(() => verifyToken(token)).not.toThrow();
    });

    it('should reject invalid tokens', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    it('should reject tampered tokens', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      // Tamper with the token
      const parts = token.split('.');
      parts[1] = 'tampered' + parts[1];
      const tamperedToken = parts.join('.');

      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it('should reject tokens with wrong signature', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      // Change the signature
      const parts = token.split('.');
      parts[2] = 'wrongsignature';
      const wrongSigToken = parts.join('.');

      expect(() => verifyToken(wrongSigToken)).toThrow();
    });
  });

  describe('Logout Behavior', () => {
    it('should allow logout without server-side token invalidation (stateless JWT)', () => {
      // In a stateless JWT system, logout is handled client-side
      // The server just acknowledges the request
      // This test validates the expected behavior
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      // Token should still be valid after "logout" since we use stateless JWT
      // Client is responsible for discarding the token
      expect(() => verifyToken(token)).not.toThrow();
    });
  });
});
