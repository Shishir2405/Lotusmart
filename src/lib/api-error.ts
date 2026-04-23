

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

    // Extract meaningful error message from Axios errors (e.g. Shipmozo API responses)
    if (
      error instanceof Error &&
      "isAxiosError" in error &&
      (error as any).isAxiosError
    ) {
      const axiosErr = error as any;
      const responseData = axiosErr.response?.data;
      const status = axiosErr.response?.status ?? 500;
      // Shipmozo returns { result, message, data } — prefer its message
      const message =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null) ||
        axiosErr.message;
      return new ApiError(message, status);
    }

    if (error instanceof Error) {
      return new ApiError(error.message, 500);
    }

    // Plain-object throws — e.g. the razorpay npm SDK rejects with
    //   { statusCode, error: { code, description, field, reason, ... } }
    // Extract the human-readable bits instead of String()-ing the whole
    // object (which would end up as "[object Object]").
    if (error && typeof error === "object") {
      const anyErr = error as Record<string, unknown>;
      const nested = (anyErr.error ?? anyErr.data ?? null) as
        | Record<string, unknown>
        | null;
      const message =
        (typeof anyErr.message === "string" && anyErr.message) ||
        (typeof anyErr.description === "string" && anyErr.description) ||
        (nested && typeof nested.description === "string" && nested.description) ||
        (nested && typeof nested.message === "string" && nested.message) ||
        (nested && typeof nested.reason === "string" && nested.reason) ||
        (typeof anyErr.reason === "string" && anyErr.reason) ||
        JSON.stringify(error);
      const statusCode =
        typeof anyErr.statusCode === "number" ? anyErr.statusCode : 500;
      return new ApiError(String(message), statusCode);
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
