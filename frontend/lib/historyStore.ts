import { Conversation, ChatMessage } from "./types";

// Local-only conversation cache for the sidebar. Deliberately flat and
// serializable (id/title/createdAt/messages[]) so this can be swapped for a
// GET/POST against a real `/api/history` + Postgres-backed store later
// without changing any component code — only this file.

const STORAGE_KEY = "data-agent:conversations";

function readAll(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function writeAll(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveConversation(conversation: Conversation) {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === conversation.id);
  if (idx >= 0) {
    all[idx] = conversation;
  } else {
    all.push(conversation);
  }
  writeAll(all);
}

export function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  return firstUser.content.length > 48
    ? firstUser.content.slice(0, 48) + "…"
    : firstUser.content;
}
