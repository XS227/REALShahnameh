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
   Følgende variabler styrer REAL-token-integrasjonen:

   | Variabel | Standard | Beskrivelse |
   | -------- | -------- | ----------- |
   | `REAL_MODE` | `mock` | Bruk `production` for ekte utbetalinger. |
   | `REAL_API_BASE_URL` | `https://api.real-token.example` | Base-URL for produksjons-API. |
   | `REAL_API_KEY` | – | API-nøkkel for produksjon. Påkrevd når `REAL_MODE=production`. |
   | `REAL_API_SECRET` | – | Hemmelig nøkkel for signering. Påkrevd når `REAL_MODE=production`. |
   | `REAL_RATE_LIMIT_PER_MINUTE` | `60` | Hvor mange transaksjoner som er lov per minutt per bruker. |
   | `REAL_MOCK_MAX_AMOUNT` | `1000` | Maks beløp i mock-modus og terskel for anti-cheat. |
   | `ADMIN_USER_IDS` | – | Kommaseparert liste over Telegram-ID-er som kan bruke admin-kommandoer. |

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
- `token_transactions`: audit-logg for alle tokenutbetalinger.

Se også `docs/real_token_contract.md` for detaljer om API-kontrakten og `docs/security_testing.md` for testprosedyrer.

## Kommandoer

I tillegg til standardkommandoene er følgende tilgjengelig for administratorer (`ADMIN_USER_IDS`):

- `/reward <telegram_id> <amount> <reason> [key=value ...]` – utbetal REAL-tokens til en bruker. Ekstra argumenter på format `key=value` lagres som metadata.
- `/token_report` – genererer en rapport over tokenforbruk med summer og feillogg.

## Linting og formatering

Installer ekstra utvikleravhengigheter og kjør `black`:

```bash
pip install -e .[dev]
black bot
```
