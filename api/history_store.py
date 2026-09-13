import json
import os
import threading
import uuid
from datetime import datetime, timezone

_LOCK = threading.Lock()
_STORE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "history.json")
)


def _load() -> dict:
    if not os.path.exists(_STORE_PATH):
        return {"conversations": {}}
    try:
        with open(_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {"conversations": {}}


def _save(store: dict) -> None:
    os.makedirs(os.path.dirname(_STORE_PATH), exist_ok=True)
    with open(_STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2)


def new_conversation_id() -> str:
    return uuid.uuid4().hex[:12]


def append_turn(conversation_id: str, mode: str, user_message: str, response: dict) -> None:
    """
    Persist one chat turn. Schema is deliberately flat and simple (a JSON file)
    but mirrors what a `conversations` / `messages` table pair would look like
    in Postgres, so migrating later is a matter of swapping the storage
    functions, not the shape of the data.
    """
    with _LOCK:
        store = _load()
        conversations = store.setdefault("conversations", {})
        convo = conversations.setdefault(
            conversation_id,
            {
                "id": conversation_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "turns": [],
            },
        )
        convo["turns"].append(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": mode,
                "user_message": user_message,
                "response": response,
            }
        )
        convo["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save(store)


def list_conversations() -> list:
    with _LOCK:
        store = _load()
        conversations = list(store.get("conversations", {}).values())
        # Most recently updated first
        conversations.sort(key=lambda c: c.get("updated_at", c.get("created_at", "")), reverse=True)
        # Return a lightweight summary, not the full turn payloads
        summaries = []
        for c in conversations:
            first_user_msg = c["turns"][0]["user_message"] if c["turns"] else ""
            summaries.append(
                {
                    "id": c["id"],
                    "title": (first_user_msg[:60] + "...") if len(first_user_msg) > 60 else first_user_msg,
                    "created_at": c.get("created_at"),
                    "updated_at": c.get("updated_at"),
                    "turn_count": len(c["turns"]),
                }
            )
        return summaries


def get_conversation(conversation_id: str) -> dict:
    with _LOCK:
        store = _load()
        return store.get("conversations", {}).get(conversation_id)
