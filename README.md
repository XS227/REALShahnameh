# REAL Shahnameh Telegram Bot

This repository contains a production-ready Telegram bot that delivers the REAL Shahnameh storytelling experience and manages on-chain/REAL token rewards. It is powered by [`python-telegram-bot`](https://python-telegram-bot.org/) and a small SQLite (or PostgreSQL) persistence layer.

## Table of contents

- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Create and activate a virtual environment](#2-create-and-activate-a-virtual-environment)
  - [3. Install dependencies](#3-install-dependencies)
  - [4. Configure environment variables](#4-configure-environment-variables)
- [Running the bot locally](#running-the-bot-locally)
- [Using the admin tools](#using-the-admin-tools)
- [Database schema](#database-schema)
- [Observability](#observability)
- [Testing and quality checks](#testing-and-quality-checks)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Additional documentation](#additional-documentation)

## Prerequisites

Before you begin, make sure you have:

- Python 3.10 or newer installed.
- `pip` and `venv` available (bundled with modern Python distributions).
- A Telegram bot token from [@BotFather](https://t.me/BotFather).
- (Optional) Access to a PostgreSQL database if you plan to run the bot in production.

## Project structure

```
REALShahnameh/
├── bot/                 # Bot code, handlers, services, and data access
├── docs/                # Project plans and technical documentation
├── tests/               # Automated tests (unit + integration)
├── requirements.txt     # Runtime dependency pins
├── pyproject.toml       # Build system configuration
└── README.md            # You are here
```

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/REALShahnameh.git
cd REALShahnameh
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use `.venv\Scripts\activate`
```

### 3. Install dependencies

Install the package in editable mode so code changes are picked up automatically:

```bash
pip install -e .
```

If you intend to run formatting and linting checks, install the optional developer extras:

```bash
pip install -e .[dev]
```

### 4. Configure environment variables

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

Populate the following keys inside `.env`:

| Variable | Default | Description |
| --- | --- | --- |
| `BOT_TOKEN` | – | Telegram bot token provided by BotFather. Mandatory. |
| `DATABASE_URL` | `sqlite:///bot.db` | SQLAlchemy connection string. Use PostgreSQL in production (e.g. `postgresql+psycopg://user:pass@host/db`). |
| `REAL_MODE` | `mock` | Switch to `production` to enable real payouts. |
| `REAL_API_BASE_URL` | `https://api.real-token.example` | Base URL for REAL production API. |
| `REAL_API_KEY` | – | API key required in production mode. |
| `REAL_API_SECRET` | – | Secret used for request signing in production mode. |
| `REAL_RATE_LIMIT_PER_MINUTE` | `60` | Throttle limit for token transactions per user. |
| `REAL_MOCK_MAX_AMOUNT` | `1000` | Cap for mock payouts and anti-abuse threshold. |
| `ADMIN_USER_IDS` | – | Comma-separated Telegram user IDs that can access admin commands. |
| `METRICS_PORT` | `9000` | Port exposing Prometheus metrics. |
| `LOG_LEVEL` | `INFO` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, ...). |

## Running the bot locally

Start the bot after activating the virtual environment and configuring `.env`:

```bash
python -m bot.main
```

The bot uses long polling. Stop the process with `Ctrl+C`. Metrics are exposed at `http://localhost:9000/metrics` unless you override `METRICS_PORT`.

## Using the admin tools

The repository ships with CLI tooling to inspect users and payouts:

```bash
python -m bot.admin_tools list-users
python -m bot.admin_tools show-user --telegram-id <id>
python -m bot.admin_tools list-transactions --limit 20
```

All commands require the same `.env` configuration as the bot.

## Database schema

The default SQLite database defines the following tables:

- `users` – basic Telegram user profile and metadata.
- `progress` – narrative progress for each user.
- `real_balances` – REAL token balances associated with users.
- `transactions` – immutable ledger of payouts and penalties.

## Observability

- Logging level is controlled via `LOG_LEVEL`.
- Prometheus metrics are exposed on `METRICS_PORT` (defaults to `9000`).
- Key metrics include:
  - `real_bot_commands_total{command,status}`
  - `real_bot_command_duration_seconds{command}`
  - `real_bot_active_sessions`

## Testing and quality checks

Activate the virtual environment and run:

```bash
pytest
```

To ensure formatting and linting standards:

```bash
black bot tests
```

The optional developer dependencies are defined under `[project.optional-dependencies.dev]` in `pyproject.toml`.

## Deployment notes

- For production, prefer running the bot behind a process manager such as `systemd`, `supervisord`, or Docker.
- When deploying in webhook mode, configure the `TELEGRAM_WEBHOOK_URL` and expose an HTTPS endpoint (not covered in this sample configuration).
- Switch `REAL_MODE` to `production` only after provisioning valid REAL API credentials and confirming rate limits with the partner team.
- Use PostgreSQL for durability; update `DATABASE_URL` accordingly and run `alembic` migrations if you introduce schema changes.

## Troubleshooting

- **Bot fails to start with `InvalidToken`:** Double-check that `BOT_TOKEN` is set correctly in `.env`.
- **Database locked errors on SQLite:** Ensure only one bot process is running locally and the database file is writable.
- **Metrics endpoint not reachable:** Confirm the process is running and the `METRICS_PORT` you configured is open.
- **REAL API errors:** In mock mode, responses are simulated. Switch to production only when the external API is reachable and credentials are valid.

## Additional documentation

For deeper technical or operational information, refer to the documents in the `docs/` directory:

- [docs/pilot_plan.md](docs/pilot_plan.md)
- [docs/launch_and_support.md](docs/launch_and_support.md)
- [docs/real_token_contract.md](docs/real_token_contract.md)
- [docs/security_testing.md](docs/security_testing.md)

The `token_transactions` table serves as an immutable audit trail for all REAL token payouts and reversals.
