# REAL Shahnameh Telegram Bot

Dette prosjektet inneholder en minimal Telegram-bot bygget med [`python-telegram-bot`](https://python-telegram-bot.org/) for REAL Shahnameh.

## Kom i gang

1. Installer avhengigheter:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .
   ```

2. Lag en `.env`-fil basert på eksempelfilen:

   ```bash
   cp .env.example .env
   ```

   Fyll inn `BOT_TOKEN` med tokenet fra [@BotFather](https://t.me/BotFather).
   `DATABASE_URL` kan stå som standard (SQLite) eller settes til en PostgreSQL-URL.

3. Start boten lokalt:

   ```bash
   python -m bot.main
   ```

   Botten kjører med polling. Stopp den med `Ctrl+C`.

## Datamodeller

SQLite-databasen oppretter følgende tabeller:

- `users`: registrerer Telegram-brukere.
- `progress`: lagrer fremdrift i historien per bruker.
- `real_balances`: holder REAL-saldo for hver bruker.

## Linting og formatering

Installer ekstra utvikleravhengigheter og kjør `black`:

```bash
pip install -e .[dev]
black bot
```
