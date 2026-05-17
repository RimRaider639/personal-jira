import { Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateToken } from '../services/auth.service';
import jwt from 'jsonwebtoken';
import { config } from '../config';

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
  });

  describe('authenticate', () => {
    it('should call next() with error when no authorization header is provided', () => {
      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No authorization header provided',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when authorization header format is invalid', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid authorization header format. Use: Bearer <token>',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when Bearer keyword is missing', () => {
      mockRequest.headers = { authorization: 'Basic token123' };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid authorization header format. Use: Bearer <token>',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token is missing after Bearer', () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token is missing',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token.here' };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token is expired', () => {
      const userId = '507f1f77bcf86cd799439011';
      const expiredToken = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '-1s' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token has expired',
          statusCode: 401,
        })
      );
    });

    it('should call next() with error when token has wrong signature', () => {
      const userId = '507f1f77bcf86cd799439011';
      const wrongToken = jwt.sign({ userId }, 'wrong-secret', { expiresIn: '7d' });
      mockRequest.headers = { authorization: `Bearer ${wrongToken}` };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        })
      );
    });

    it('should attach userId to request and call next() for valid token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({ userId });
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should extract userId correctly from token payload', () => {
      const userId = '60d5ecb54b24a1234567890a';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user?.userId).toBe(userId);
    });

    it('should handle malformed JWT tokens', () => {
      mockRequest.headers = { authorization: 'Bearer not-a-jwt' };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should handle tokens with only two parts', () => {
      mockRequest.headers = { authorization: 'Bearer header.payload' };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  describe('optionalAuthenticate', () => {
    it('should call next() without error when no authorization header is provided', () => {
      optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when authorization header format is invalid', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token.here' };

      optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when token is expired', () => {
      const userId = '507f1f77bcf86cd799439011';
      const expiredToken = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '-1s' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should attach userId to request and call next() for valid token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({ userId });
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when Bearer keyword is missing', () => {
      mockRequest.headers = { authorization: 'Basic token123' };

      optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next() without error when token is empty after Bearer', () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      optionalAuthenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('AuthenticatedRequest interface', () => {
    it('should allow accessing user property after authentication', () => {
      const userId = '507f1f77bcf86cd799439011';
      const validToken = generateToken(userId);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      const authenticatedReq = mockRequest as AuthenticatedRequest;
      expect(authenticatedReq.user).toBeDefined();
      expect(authenticatedReq.user?.userId).toBe(userId);
    });
  });
});
