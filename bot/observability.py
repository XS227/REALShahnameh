"""Logging and metrics utilities for the REAL Shahnameh bot."""

from __future__ import annotations

import logging
import os
from time import perf_counter

from prometheus_client import Counter, Gauge, Histogram, start_http_server

LOGGER = logging.getLogger(__name__)

COMMAND_COUNTER = Counter(
    "real_bot_commands_total",
    "Number of processed commands grouped by status.",
    labelnames=("command", "status"),
)

COMMAND_LATENCY = Histogram(
    "real_bot_command_duration_seconds",
    "Latency for handling a Telegram command.",
    labelnames=("command",),
)

ACTIVE_SESSIONS = Gauge(
    "real_bot_active_sessions",
    "Count of in-memory user sessions currently tracked.",
)


def init_observability() -> None:
    """Configure logging and start the Prometheus metrics endpoint."""

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    metrics_port = int(os.getenv("METRICS_PORT", "9000"))
    start_http_server(metrics_port)
    LOGGER.info("Started Prometheus metrics server on port %s", metrics_port)


def observe_command(command: str, duration_seconds: float, status: str) -> None:
    """Record metrics for a handled Telegram command."""

    COMMAND_COUNTER.labels(command=command, status=status).inc()
    COMMAND_LATENCY.labels(command=command).observe(duration_seconds)


def set_active_sessions(count: int) -> None:
    """Update the gauge that tracks active in-memory sessions."""

    ACTIVE_SESSIONS.set(count)


class CommandTimer:
    """Helper to measure execution time for command handlers."""

    __slots__ = ("command", "started_at")

    def __init__(self, command: str) -> None:
        self.command = command
        self.started_at = perf_counter()

    def finish(self, status: str) -> None:
        """Record the elapsed time together with the command status."""

        duration = perf_counter() - self.started_at
        observe_command(self.command, duration, status)
