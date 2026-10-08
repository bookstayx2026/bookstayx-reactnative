import { apiRequest } from "./client";
import { isApiConfigured } from "./config";

export type ApiHealth = { configured: boolean; reachable: boolean; message: string; timestamp?: string };

export async function checkApiHealth(): Promise<ApiHealth> {
  if (!isApiConfigured()) return { configured: false, reachable: false, message: "API is not configured." };
  try {
    const result = await apiRequest<{ success: boolean; message?: string; timestamp?: string }>("/health", { timeoutMs: 5_000 });
    return { configured: true, reachable: result.success, message: result.message || "API is reachable.", timestamp: result.timestamp };
  } catch (error) {
    return { configured: true, reachable: false, message: error instanceof Error ? error.message : "API health check failed." };
  }
}
