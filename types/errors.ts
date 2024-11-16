export class ApiError extends Error {
  constructor(message: string, public details: any) {
    super(message)
    this.name = 'ApiError'
  }
} 