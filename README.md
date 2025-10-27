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

   Metrics eksponeres på `http://localhost:9000/metrics` som standard. Sett `METRICS_PORT`
   for å endre porten.

4. Kjør admin-verktøy lokalt (eksempel):

   ```bash
   python -m bot.admin_tools list-users
   ```

   Bruk `show-user` og `list-transactions` for å inspisere detaljer.

## Datamodeller

SQLite-databasen oppretter følgende tabeller:

- `users`: registrerer Telegram-brukere.
- `progress`: lagrer fremdrift i historien per bruker.
- `real_balances`: holder REAL-saldo for hver bruker.
- `transactions`: lager en transaksjonslogg knyttet til hver bruker.

## Observability

- Logging styres av miljøvariabelen `LOG_LEVEL` (default `INFO`).
- Prometheus-metrics tilgjengelig via `METRICS_PORT` (default `9000`).
- Følgende metrics er tilgjengelig:
  - `real_bot_commands_total{command,status}`
  - `real_bot_command_duration_seconds{command}`
  - `real_bot_active_sessions`

## Onboarding og hjelp

- `/start` initierer en guidet onboarding for nye brukere.
- `/help` og `/faq` gir hjelpetekster og svar på vanlige spørsmål.
- `/progress` og `/balance` viser henholdsvis fremdrift og økonomi med siste transaksjon.

## Dokumentasjon

- [Pilotplan](docs/pilot_plan.md)
- [Lanserings- og støtteplan](docs/launch_and_support.md)

## Linting og formatering

Installer ekstra utvikleravhengigheter og kjør `black`:

```bash
pip install -e .[dev]
black bot
```
