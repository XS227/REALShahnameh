"""In-memory session manager for tracking user interactions."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, Optional


@dataclass
class UserSession:
    """Represents a simple in-memory conversation state."""

    state: str = "idle"
    context: dict = field(default_factory=dict)


class SessionManager:
    """Stores lightweight session state for each user."""

    def __init__(self, on_change: Optional[Callable[[int], None]] = None) -> None:
        self._sessions: Dict[int, UserSession] = {}
        self._on_change = on_change

    def _notify(self) -> None:
        if self._on_change is not None:
            self._on_change(len(self._sessions))

    def get(self, user_id: int) -> UserSession:
        if user_id not in self._sessions:
            self._sessions[user_id] = UserSession()
            self._notify()
        return self._sessions[user_id]

    def set_state(self, user_id: int, state: str) -> None:
        session = self.get(user_id)
        session.state = state

    def clear(self, user_id: int) -> None:
        if user_id in self._sessions:
            self._sessions.pop(user_id, None)
            self._notify()

    def __len__(self) -> int:
        return len(self._sessions)
