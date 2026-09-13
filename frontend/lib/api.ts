import { AgentMode, ChatResponse, HealthResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      "Can't reach the Data Agent backend. Make sure the API is running at " + API_BASE
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || body.error || detail;
    } catch {
      // ignore parse failures, keep default detail
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as T;
}

export function sendChatMessage(
  message: string,
  mode: AgentMode,
  conversationId: string | null,
  signal?: AbortSignal
): Promise<ChatResponse> {
  return requestJson<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, mode, conversation_id: conversationId }),
    signal,
  });
}

export function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health");
}

export function getDownloadUrl(path: string): string {
  return `${API_BASE}${path}`;
}
