

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]> | string[];

  constructor(
    message: string,
    statusCode = 500,
    errors?: Record<string, string[]> | string[],
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;

    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  
  static badRequest(
    message = "Bad request",
    errors?: Record<string, string[]> | string[],
  ) {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(message, 403);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(message, 404);
  }

  static conflict(message = "Conflict") {
    return new ApiError(message, 409);
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(message, 429);
  }

  static internal(message = "Internal server error") {
    return new ApiError(message, 500);
  }

  static validationError(errors: Record<string, string[]>) {
    return new ApiError("Validation failed", 422, errors);
  }

  
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  
  static from(error: unknown): ApiError {
    if (ApiError.isApiError(error)) return error;

    if (error instanceof Error) {
      return new ApiError(error.message, 500);
    }

    return new ApiError(String(error), 500);
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.errors ? { errors: this.errors } : {}),
    };
  }
}
