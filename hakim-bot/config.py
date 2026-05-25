import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
DB_PATH        = os.getenv("DB_PATH", "/var/www/shahnameh/hakim-bot/hakim.db")
ADMIN_SECRET   = os.getenv("ADMIN_SECRET", "")
KNOWLEDGE_DIR  = os.getenv("KNOWLEDGE_DIR", "/var/www/shahnameh/hakim-bot/realshahnameh")
