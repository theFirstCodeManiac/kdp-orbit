export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly context?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    options?: {
      code?: string;
      status?: number;
      context?: string;
      details?: unknown;
    },
  ) {
    super(message);
    this.name = "AppError";
    this.code = options?.code ?? "APP_ERROR";
    this.status = options?.status ?? 500;
    this.context = options?.context;
    this.details = options?.details;
  }
}

export const normalizeError = (
  error: unknown,
  fallbackMessage = "Unexpected error",
) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, {
      code: "RUNTIME_ERROR",
      context: fallbackMessage,
      details: error,
    });
  }

  return new AppError(typeof error === "string" ? error : fallbackMessage, {
    code: "UNKNOWN_ERROR",
    context: fallbackMessage,
    details: error,
  });
};

export const logAppError = (error: unknown, context?: string) => {
  const normalized = normalizeError(error, context ?? "Application error");

  console.error(`[${normalized.code}] ${normalized.message}`, {
    context: normalized.context ?? context,
    status: normalized.status,
    details: normalized.details,
  });

  return normalized;
};
