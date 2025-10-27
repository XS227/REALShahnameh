# Pilotplan for REAL Shahnameh-boten

## Mål for piloten
- Verifisere at onboarding, hjelpetekster og FAQ reduserer antall åpnede supportsaker.
- Validere at observability-oppsettet (logging, metrics, alarmer) gir innsikt i reell bruk.
- Samle tilbakemeldinger på historieflyt, belønningsmekanismer og admin-verktøyet.

## Tidslinje
| Uke | Aktivitet |
| --- | --------- |
| Uke 1 | Velg pilotgruppe (10–15 brukere), etabler støttekanaler og gjennomfør intern demo. |
| Uke 2 | Rull ut piloten, følg med på logging/metrics, samle kvalitative intervjuer. |
| Uke 3 | Prioriter funn, planlegg hurtige forbedringer og bekreft datadrevet justering av onboarding. |
| Uke 4 | Avslutt piloten med felles retro og frys av datagrunnlag til lansering. |

## Datainnsamling
- **Kvantitativt:** Prometheus-metrics (kommandoer per status, latens, antall aktive sesjoner), antall nye brukere i databasen.
- **Kvalitativt:** Samtalelogger, spørreundersøkelse etter uke 2, intervjuer med pilotbrukere og support-team.
- **Supportdata:** Bruk admin-verktøyet for å hente konkrete brukerhistorikker ved behov.

## Feedbacksløyfer
1. Daglige standup-oppdateringer med innsikt fra metrics og support.
2. Ukentlig «pilot review» for å gjennomgå innsendte forslag og identifisere blokkerere.
3. Egen Slack-kanal for pilotdeltakere, moderert av support.

## Justeringer
- Prioriter forbedringer som reduserer «ignored»-status på kommandoer.
- Valider at FAQ dekker nye spørsmål; oppdater dokumentasjonen fortløpende.
- Loggfør alle endringer i CHANGELOG eller tilsvarende for å sikre transparens frem mot lansering.
