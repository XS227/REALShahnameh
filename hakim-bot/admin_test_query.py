#!/usr/bin/env python3
"""Admin-only CLI: send one real question to Hakim, print the answer as JSON.

Added 2026-07-17 for the admin Hakim page (ADMIN_NOC_ROADMAP.md § 8.11's
"test-spørsmål mot Hakim" requirement). Reuses the exact same provider/
config/knowledge-base code the live bot uses in bot.py's handle_message()
— this is not a second, parallel implementation that could drift from
what real users actually get.

Usage: python3 admin_test_query.py "question text"
Output (stdout, one line): {"answer": "..."} or {"error": "..."}

Does NOT write to bot_messages/bot_users/bot_requests — this is an admin
probe, not real user traffic, and must not pollute those tables' data
(admin request counts, "last seen" timestamps, etc. would all be wrong if
it did).
"""
import asyncio
import json
import sys

from dynamic_config import DynamicConfig
from hakim_ai import get_provider, _quota_response, _error_response, _no_key_response
from knowledge_base import KnowledgeBase


async def main() -> None:
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        print(json.dumps({"error": "no question given"}))
        return

    question = sys.argv[1].strip()[:500]
    cfg = DynamicConfig()
    knowledge = KnowledgeBase()

    relevant = knowledge.search(question)
    primary_name = cfg.get("ai_provider", "openai")
    provider = get_provider(primary_name)
    response = await provider.respond(question, relevant, "no", cfg)

    failure_markers = (_quota_response("no"), _error_response("no"), _no_key_response("no"))
    if response in failure_markers:
        fallback_name = "anthropic" if primary_name == "openai" else "openai"
        response = await get_provider(fallback_name).respond(question, relevant, "no", cfg)

    print(json.dumps({"answer": response}))


if __name__ == "__main__":
    asyncio.run(main())
