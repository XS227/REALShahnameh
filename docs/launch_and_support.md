# Lanserings- og støtteplan

## Lanseringsmål
- Lansere boten til hele brukerbasen med minimal nedetid.
- Sikre at observability-varsler dekker feil, treghet og uvanlig bruk.
- Gjøre support-teamet i stand til å følge opp brukere og transaksjoner i sanntid.

## Forberedelser før lansering
1. **Sjekkliste for produksjon**
   - Verifiser miljøvariabler (BOT_TOKEN, DATABASE_URL, LOG_LEVEL, METRICS_PORT).
   - Kjør database-migreringer (`python -m bot.main` med `create_all`).
   - Bekreft at Prometheus-endepunktet svarer (`curl http://<host>:9000/metrics`).
2. **Kommunikasjon**
   - Send «coming soon»-melding til eksisterende brukere.
   - Koordiner supportvakter og oppdater interne runbooks.
3. **Risikoanalyse**
   - Definer fallback-prosedyre for å sette boten i «read-only» modus via feilhåndtering.
   - Forbered manuelt script for å deaktivere feilaktige brukere gjennom admin-verktøyet.

## Utrulling
- Start med gradvis utrulling (25 % → 50 % → 100 %) og overvåk kommando-metrics.
- Skaler ressurser dersom `real_bot_command_duration_seconds` viser økt latens.
- Bruk logging for å bekrefte vellykkede /start-kommandoer og holde øye med feil.

## Alarmer og varsling
- Sett Prometheus-regler for:
  - `real_bot_commands_total{status="error"}` > 0 over 5 minutter.
  - `real_bot_command_duration_seconds` p95 > 2 sekunder over 10 minutter.
  - `real_bot_active_sessions` < 1 i arbeidstid (indikasjon på nettverksfeil).
- Rute alarmer til on-call (Slack + SMS).

## Supportprosesser
1. **Førstelinje**
   - Bruk `/faq` til å svare brukere direkte i chatten.
   - Dokumenter nye spørsmål i Confluence/Notion innen 24 timer.
2. **Andrelinje**
   - Kjør `python -m bot.admin_tools list-users` for rask oversikt.
   - Bruk `python -m bot.admin_tools show-user --telegram-id <id>` ved behov.
   - Flagge mistenkelige transaksjoner via `list-transactions` og oppdatere saken.
3. **Statusrapportering**
   - Daglig rapport med nøkkeltall (nye brukere, aktive sesjoner, feilrate).
   - Ukentlig statusmøte mellom produkt, support og utvikling.

## Etter lansering
- Sammenlign pilotdata med produksjonsdata for å bekrefte hypoteser.
- Oppdater roadmap med forbedringer basert på innkomne signaler.
- Evaluer behov for videreutvikling av admin-verktøyet (eksport, bulk-oppgaver).
