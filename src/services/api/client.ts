import { apiConfig } from "./config";

export type ApiFailureCode = "NOT_CONFIGURED" | "NETWORK" | "TIMEOUT" | "HTTP" | "INVALID_RESPONSE";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiFailureCode,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; timeoutMs?: number };

export function apiUrl(path: string) {
  if (!apiConfig.baseUrl) throw new ApiError("The BookStayX API is not configured.", "NOT_CONFIGURED");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseHasApiPrefix = /\/api$/i.test(apiConfig.baseUrl);
  const pathHasApiPrefix = /^\/api(?:\/|$)/i.test(normalizedPath);
  const requestPath = baseHasApiPrefix && pathHasApiPrefix
    ? normalizedPath.replace(/^\/api/i, "")
    : !baseHasApiPrefix && !pathHasApiPrefix
      ? `/api${normalizedPath}`
      : normalizedPath;
  return `${apiConfig.baseUrl}${requestPath}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiConfig.baseUrl) throw new ApiError("The BookStayX API is not configured.", "NOT_CONFIGURED");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? apiConfig.timeoutMs);
  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      signal: controller.signal,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const raw = await response.text();
    let data: unknown = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { throw new ApiError("The server returned an unreadable response.", "INVALID_RESPONSE", response.status, raw); }
    if (!response.ok) {
      const record = data && typeof data === "object" ? data as Record<string, unknown> : null;
      let message = `Request failed with status ${response.status}.`;
      if (typeof record?.message === "string") {
        message = record.message;
      } else if (typeof record?.error === "string") {
        message = record.error;
      } else if (record?.error && typeof record.error === "object") {
        const errObj = record.error as Record<string, unknown>;
        message = String(errObj.message || errObj.code || message);
      }
      throw new ApiError(message, "HTTP", response.status, data);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new ApiError("The request timed out. Check your connection and try again.", "TIMEOUT");
    throw new ApiError("Unable to reach the BookStayX service. Check your connection and try again.", "NETWORK", undefined, error);
  } finally { clearTimeout(timeout); }
}
