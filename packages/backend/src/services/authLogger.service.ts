import { randomUUID } from 'crypto';

/**
 * Minimal request interface for logging purposes
 * Compatible with both Express Request and AuthenticatedRequest
 */
export interface LoggableRequest {
  headers: {
    'x-forwarded-for'?: string | string[];
    'x-real-ip'?: string | string[];
    'user-agent'?: string;
    authorization?: string;
  };
  socket?: {
    remoteAddress?: string;
  };
  ip?: string;
  method: string;
  path: string;
}

/**
 * Authentication event types for security logging
 */
export type AuthEventType =
  | 'firebase_auth_success'
  | 'firebase_auth_failure'
  | 'jwt_auth_success'
  | 'jwt_auth_failure'
  | 'login_success'
  | 'login_failure'
  | 'register_success'
  | 'link_google_success'
  | 'link_google_failure';

/**
 * Authentication event log entry structure
 * Contains all relevant context for security monitoring
 */
export interface AuthEventLog {
  /** Unique identifier for the request */
  requestId: string;
  /** ISO timestamp of the event */
  timestamp: string;
  /** Type of authentication event */
  eventType: AuthEventType;
  /** Client IP address */
  ipAddress: string;
  /** Client user agent string */
  userAgent: string;
  /** User ID if available (for successful auth or known users) */
  userId?: string;
  /** Firebase UID if available */
  firebaseUid?: string;
  /** Email address (sanitized - only domain shown for failures) */
  email?: string;
  /** Auth provider type */
  authProvider?: string;
  /** Sanitized error message (no internal details) */
  errorMessage?: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
}

/**
 * Generates a unique request ID for tracking
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Extracts the client IP address from the request
 * Handles proxied requests (X-Forwarded-For header)
 */
export function getClientIp(req: LoggableRequest): string {
  // Check for forwarded IP (when behind a proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstIp = ips?.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Check for X-Real-IP header (common with nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] || 'unknown' : realIp;
  }

  // Fall back to socket remote address
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

/**
 * Extracts the user agent from the request
 */
export function getUserAgent(req: LoggableRequest): string {
  const userAgent = req.headers['user-agent'];
  return userAgent || 'unknown';
}

/**
 * Sanitizes email for logging - shows only domain for failed attempts
 * to prevent leaking valid email addresses
 */
export function sanitizeEmail(email: string | undefined, isFailure: boolean): string | undefined {
  if (!email) {
    return undefined;
  }

  if (isFailure) {
    // For failures, only show the domain to prevent email enumeration
    const parts = email.split('@');
    if (parts.length === 2) {
      return `***@${parts[1]}`;
    }
    return '***';
  }

  // For successful auth, we can log the full email
  return email.toLowerCase();
}

/**
 * Sanitizes error messages to remove internal details
 * Only returns generic, safe error descriptions
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Map internal errors to safe messages
    if (message.includes('token') && message.includes('expired')) {
      return 'Token expired';
    }
    if (message.includes('token') && message.includes('revoked')) {
      return 'Token revoked';
    }
    if (message.includes('audience') || message.includes('issuer')) {
      return 'Token validation failed';
    }
    if (message.includes('firebase') && message.includes('not initialized')) {
      return 'Service unavailable';
    }
    if (message.includes('invalid') && message.includes('token')) {
      return 'Invalid token';
    }
    if (message.includes('user not found')) {
      return 'User not found';
    }
    if (message.includes('password')) {
      return 'Invalid credentials';
    }
    if (message.includes('email')) {
      return 'Email validation failed';
    }

    // For any other error, return a generic message
    return 'Authentication failed';
  }

  return 'Unknown error';
}

/**
 * Logs an authentication event for security monitoring
 * This function outputs structured logs that can be consumed by log aggregation systems
 */
export function logAuthEvent(event: AuthEventLog): void {
  // Create a structured log entry
  const logEntry = {
    level: event.eventType.includes('failure') ? 'warn' : 'info',
    category: 'security',
    subcategory: 'authentication',
    ...event,
  };

  // Output as JSON for structured logging
  // In production, this would be consumed by a log aggregation system
  if (event.eventType.includes('failure')) {
    console.warn('[AUTH]', JSON.stringify(logEntry));
  } else {
    console.info('[AUTH]', JSON.stringify(logEntry));
  }
}

/**
 * Creates and logs a successful authentication event
 */
export function logAuthSuccess(
  req: LoggableRequest,
  eventType: AuthEventType,
  details: {
    userId?: string;
    firebaseUid?: string;
    email?: string;
    authProvider?: string;
    requestId?: string;
  }
): void {
  const event: AuthEventLog = {
    requestId: details.requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    eventType,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    method: req.method,
    path: req.path,
    userId: details.userId,
    firebaseUid: details.firebaseUid,
    email: sanitizeEmail(details.email, false),
    authProvider: details.authProvider,
  };

  logAuthEvent(event);
}

/**
 * Creates and logs a failed authentication event
 * Ensures internal error details are not exposed
 */
export function logAuthFailure(
  req: LoggableRequest,
  eventType: AuthEventType,
  error: unknown,
  details: {
    userId?: string;
    firebaseUid?: string;
    email?: string;
    authProvider?: string;
    requestId?: string;
  }
): void {
  const event: AuthEventLog = {
    requestId: details.requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    eventType,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    method: req.method,
    path: req.path,
    userId: details.userId,
    firebaseUid: details.firebaseUid,
    // Sanitize email for failures to prevent enumeration
    email: sanitizeEmail(details.email, true),
    authProvider: details.authProvider,
    // Sanitize error message to not expose internal details
    errorMessage: sanitizeErrorMessage(error),
  };

  logAuthEvent(event);
}

/**
 * Extracts request context for logging
 * Useful for middleware that needs to pass context to route handlers
 */
export function getRequestContext(req: LoggableRequest): {
  requestId: string;
  ipAddress: string;
  userAgent: string;
} {
  return {
    requestId: generateRequestId(),
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  };
}

export default {
  generateRequestId,
  getClientIp,
  getUserAgent,
  sanitizeEmail,
  sanitizeErrorMessage,
  logAuthEvent,
  logAuthSuccess,
  logAuthFailure,
  getRequestContext,
};
