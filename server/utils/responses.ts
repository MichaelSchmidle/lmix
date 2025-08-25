/**
 * Standardized API response utilities
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message: string
  count?: number
  meta?: Record<string, unknown>
}

/**
 * Create a successful response
 */
export function successResponse<T>(
  data: T,
  message: string,
  meta?: { count?: number; [key: string]: unknown }
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    ...meta,
  }
}

/**
 * Create a successful deletion response
 */
export function deleteResponse(message: string): ApiResponse<null> {
  return {
    success: true,
    data: null,
    message,
  }
}

/**
 * Create a list response with count
 */
export function listResponse<T>(
  items: T[],
  itemName: string
): ApiResponse<T[]> {
  return {
    success: true,
    data: items,
    message: `Found ${items.length} ${itemName}`,
    count: items.length,
  }
}

/**
 * Handle API errors consistently
 * Re-throws Nitro errors, wraps others in 500 error
 */
export function handleApiError(error: unknown, defaultMessage: string): never {
  // Re-throw if it's already a Nitro error
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error
  }

  // Log the actual error for debugging
  console.error(`API Error: ${defaultMessage}`, error)

  // Throw a generic 500 error
  throw createError({
    statusCode: 500,
    statusMessage: defaultMessage,
  })
}

/**
 * Check for database constraint violations
 */
export function isDatabaseConstraintError(
  error: unknown
): error is { code: string; constraint?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  )
}