/**
 * Base error type for all LMiX errors
 */
export class LMiXError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'LMiXError'
  }
}

/**
 * Error type for validation failures
 */
export class ValidationError extends LMiXError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * Error type for authentication failures
 */
export class AuthenticationError extends LMiXError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', details)
    this.name = 'AuthenticationError'
  }
}

/**
 * Error type for API-related failures
 */
export class ApiError extends LMiXError {
  constructor(message: string, details?: unknown) {
    super(message, 'API_ERROR', details)
    this.name = 'ApiError'
  }
} 