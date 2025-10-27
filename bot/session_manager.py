"""In-memory session manager for tracking user interactions."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class UserSession:
    """Represents a simple in-memory conversation state."""

    state: str = "idle"
    context: dict = field(default_factory=dict)


class SessionManager:
    """Stores lightweight session state for each user."""

    def __init__(self) -> None:
        self._sessions: Dict[int, UserSession] = {}

    def get(self, user_id: int) -> UserSession:
        if user_id not in self._sessions:
            self._sessions[user_id] = UserSession()
        return self._sessions[user_id]

    def set_state(self, user_id: int, state: str) -> None:
        session = self.get(user_id)
        session.state = state

    def clear(self, user_id: int) -> None:
        self._sessions.pop(user_id, None)
