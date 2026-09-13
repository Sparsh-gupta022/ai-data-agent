export type AgentMode = "auto" | "sql" | "etl";

export interface ChatMetadata {
  conversation_id: string;
  routed_mode?: AgentMode | null;
  is_safe_sql?: "Yes" | "No" | null;
  safety_comments?: string | null;
  source_api?: string | null;
  records_extracted?: number | null;
  records_after_cleaning?: number | null;
  download_url?: string | null;
}

export interface ChatResponse {
  success: boolean;
  mode: AgentMode;
  answer: string;
  generated_sql?: string | null;
  data?: unknown[][] | null;
  columns?: string[] | null;
  execution_time?: number | null;
  metadata: ChatMetadata;
  error?: string | null;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  database: boolean;
  llm_configured: boolean;
  details?: string | null;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  mode: AgentMode;
  content: string;
  response?: ChatResponse;
  status: "pending" | "done" | "error";
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}
