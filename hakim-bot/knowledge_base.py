import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class KnowledgeBase:
    """Loads all files in realshahnameh/ and serves relevant excerpts.
    Filenames are NEVER exposed to the user or the AI prompt.
    """

    def __init__(self, knowledge_dir: str = None):
        if knowledge_dir is None:
            from config import KNOWLEDGE_DIR
            knowledge_dir = KNOWLEDGE_DIR
        self.knowledge_dir = Path(knowledge_dir)
        self._documents: list[str] = []
        self._load()

    def _load(self) -> None:
        if not self.knowledge_dir.exists():
            logger.warning("Knowledge directory missing — creating empty dir")
            self.knowledge_dir.mkdir(parents=True, exist_ok=True)
            return

        for path in sorted(self.knowledge_dir.rglob("*")):
            if not path.is_file():
                continue
            try:
                if path.suffix == ".json":
                    with open(path, encoding="utf-8") as f:
                        data = json.load(f)
                    self._documents.append(json.dumps(data, ensure_ascii=False, indent=2))
                elif path.suffix in (".txt", ".md"):
                    with open(path, encoding="utf-8") as f:
                        self._documents.append(f.read())
            except Exception as exc:
                logger.error("Could not load a knowledge file: %s", exc)

        logger.info("KnowledgeBase: %d documents loaded", len(self._documents))

    def search(self, query: str, max_chars: int = 2500) -> str:
        """Return relevant excerpts for query. Returns empty string if nothing found."""
        if not self._documents:
            return ""

        words = set(query.lower().split())
        scored: list[tuple[int, str]] = []
        for doc in self._documents:
            doc_lower = doc.lower()
            score = sum(1 for w in words if w in doc_lower)
            if score > 0:
                scored.append((score, doc))

        scored.sort(reverse=True)

        chunks: list[str] = []
        total = 0
        for _, doc in scored[:4]:
            snippet = doc[:900]
            if total + len(snippet) > max_chars:
                break
            chunks.append(snippet)
            total += len(snippet)

        return "\n---\n".join(chunks)
