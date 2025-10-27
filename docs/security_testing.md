# Sikkerhetstesting for REAL-token-integrasjonen

Denne prosedyren beskriver hvordan man verifiserer sikkerhetskontrollene etter implementering av REAL-token-utbetalinger.

## Forberedelser

1. Start applikasjonen i et testmiljø med `REAL_MODE=mock` og aktiver detaljert logging (`LOG_LEVEL=DEBUG`).
2. Sørg for at testdatabasen er tom, og at du har et testshell for å sende kommandoer til boten.
3. Konfigurer miljøvariabler:
   - `REAL_RATE_LIMIT_PER_MINUTE=5`
   - `REAL_MOCK_MAX_AMOUNT=100`
   - `REAL_API_SECRET` satt til kjent testverdi for verifikasjon av signaturer.

## Testplan

### 1. Rate limiting

1. Utfør seks raske tokenutbetalinger (<60 sekunder) for samme bruker.
2. Verifiser at de fem første lykkes og at den sjette gir feilen `RateLimitExceeded`.
3. Kontroller at audit-loggen registrerer hendelsen med status `rate_limited`.

### 2. Anti-cheat

1. Forsøk å utbetale et beløp som overskrider `REAL_MOCK_MAX_AMOUNT`.
2. Kontroller at transaksjonen blokkeres før API-kall og at audit-loggen markerer status `rejected` med årsak `amount_above_threshold`.
3. Utfør en transaksjon med `metadata` som mangler obligatorisk `challenge_id`, og bekreft at anti-cheat-regelen stopper transaksjonen.

### 3. Signaturkontroll

1. For en vellykket transaksjon, hent loggoppføringen og verifiser at `signature`-feltet er satt og matcher `HMAC(secret, payload)`.
2. Modifiser kroppens innhold og bekreft at signaturen ikke lenger stemmer (verifiseringssteg skal feile).

### 4. Mock-adapter konsistens

1. Utfør en transaksjon og bekreft at adapteren returnerer `transaction_id` på formatet `mock-<nonce>`.
2. Kall `get_transaction` med samme ID og kontroller at responsen matcher audit-loggen.

### 5. Produksjonsadapter (staging)

1. Sett `REAL_MODE=production` og pek mot staging-API-et.
2. Kjør en utbetaling og overvåk HTTP-logging for å bekrefte at signaturer og headere sendes.
3. Induser en `429`-respons (bruk API-ens testmodus) og bekreft at adapteren retryer med eksponentiell backoff.

## Etterarbeid

- Oppsummer testresultater i en rapport og lagre i teamets delte mappe.
- Oppdater konfigurasjonen dersom terskler må justeres.
- Sørg for at sikkerhetskontroller er aktivert i produksjonsoppsettet før lansering.

