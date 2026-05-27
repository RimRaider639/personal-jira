import { Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateToken } from '../services/auth.service';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';

// Mock the User model
jest.mock('../models/User', () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

// Mock the Firebase config
jest.mock('../config/firebase', () => ({
  verifyFirebaseToken: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next() with error when no authorization header is provided', async () => {
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No authorization header provided',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when authorization header format is invalid', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid authorization header format. Use: Bearer <token>',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when Bearer keyword is missing', async () => {
      mockRequest.headers = { authorization: 'Basic token123' };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid authorization header format. Use: Bearer <token>',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token is missing after Bearer', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token is missing',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token.here' };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token is expired', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const expiredToken = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '-1s' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token has expired',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token has wrong signature', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const wrongToken = jwt.sign({ userId }, 'wrong-secret', { expiresIn: '7d' });
      mockRequest.headers = { authorization: `Bearer ${wrongToken}` };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        })
      );
    });

    it('should attach userId and authProvider to request and call next() for valid token', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      // Mock User.findById to return a user with authProvider
      (User.findById as jest.Mock).mockResolvedValue({
        _id: userId,
        authProvider: 'email',
      });

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({ userId, authProvider: 'email' });
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should extract userId correctly from token payload', async () => {
      const userId = '60d5ecb54b24a1234567890a';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      // Mock User.findById to return a user
      (User.findById as jest.Mock).mockResolvedValue({
        _id: userId,
        authProvider: 'email',
      });

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user?.userId).toBe(userId);
    });

    it('should default to email authProvider when user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      // Mock User.findById to return null (user not found)
      (User.findById as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({ userId, authProvider: 'email' });
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should handle malformed JWT tokens', async () => {
      mockRequest.headers = { authorization: 'Bearer not-a-jwt' };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should handle tokens with only two parts', async () => {
      mockRequest.headers = { authorization: 'Bearer header.payload' };

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  describe('optionalAuthenticate', () => {
    it('should call next() without error when no authorization header is provided', async () => {
      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when authorization header format is invalid', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token.here' };

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when token is expired', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const expiredToken = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '-1s' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should attach userId and authProvider to request and call next() for valid token', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      // Mock User.findById to return a user with authProvider
      (User.findById as jest.Mock).mockResolvedValue({
        _id: userId,
        authProvider: 'google',
      });

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({ userId, authProvider: 'google' });
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when Bearer keyword is missing', async () => {
      mockRequest.headers = { authorization: 'Basic token123' };

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when token is empty after Bearer', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      await optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('AuthenticatedRequest interface', () => {
    it('should allow accessing user property after authentication', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      // Mock User.findById to return a user
      (User.findById as jest.Mock).mockResolvedValue({
        _id: userId,
        authProvider: 'linked',
      });

      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      const authenticatedReq = mockRequest as AuthenticatedRequest;
      expect(authenticatedReq.user).toBeDefined();
      expect(authenticatedReq.user?.userId).toBe(userId);
      expect(authenticatedReq.user?.authProvider).toBe('linked');
    });
  });
});
