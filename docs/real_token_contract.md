# REAL Token API-kontrakt

Denne spesifikasjonen beskriver forventet grensesnitt for utstedelse og administrasjon av REAL-token i REAL Shahnameh-plattformen. Kontrakten skal implementeres både av produksjonsadapteren og av testadapteren slik at klientkode kan bruke et felles API.

## Autentisering og sikkerhet

- Alle kall må signeres med HMAC-SHA256 ved å bruke `X-REAL-SIGNATURE`-headeren.
- Signaturen beregnes av produksjonsadapteren som `HMAC(secret, method + path + timestamp + body)` der `timestamp` er i ISO-8601 (`UTC`).
- Klienten må sende følgende HTTP-headere i produksjonsmiljøet:
  - `X-REAL-API-KEY`: Utstedt klientnøkkel.
  - `X-REAL-SIGNATURE`: Digital signatur for nyttelasten.
  - `X-REAL-TIMESTAMP`: Tidspunktet signaturen ble generert.
  - `Content-Type: application/json`.
- Alle forespørsler skjer over HTTPS.

## Rate limiting

API-et aksepterer maksimalt 60 transaksjoner per minutt per klient. Adapterne må implementere lokal rate limiting før forespørselen sendes.

## Endepunkter

### `POST /v1/transactions`

Utsteder tokens til en bruker.

**Request-body**
```json
{
  "recipient": {
    "telegram_id": 123456789,
    "wallet_address": "REAL1abc..."
  },
  "amount": "10.00",
  "currency": "REAL",
  "reason": "quest_completion",
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "challenge_id": "chapter-3"
  }
}
```

| Felt          | Type      | Påkrevd | Beskrivelse |
| ------------- | --------- | ------- | ----------- |
| `recipient`   | Objekt    | Ja      | Brukeridentifikator. Minst ett av `telegram_id` eller `wallet_address` må være satt. |
| `amount`      | Desimal   | Ja      | Antall REAL-tokens. Må være positiv. |
| `currency`    | Streng    | Ja      | Må være `REAL`. |
| `reason`      | Streng    | Ja      | Maskinlesbar årsak (f.eks. `quest_completion`). |
| `nonce`       | UUID-streng | Ja   | Unik verdi for idempotens. |
| `metadata`    | Objekt    | Nei     | Ekstra informasjon om transaksjonen. |

**Response 201**
```json
{
  "transaction_id": "tx_1234567890",
  "status": "accepted",
  "amount": "10.00",
  "processed_at": "2023-11-01T12:00:00Z"
}
```

**Feilkoder**

| Status | Feilkode             | Betydning |
| ------ | -------------------- | --------- |
| 400    | `invalid_request`    | Ugyldig inndata eller manglende felt. |
| 401    | `unauthorized`       | Ugyldig API-nøkkel eller signatur. |
| 409    | `duplicate_nonce`    | Transaksjon med samme nonce finnes allerede. |
| 429    | `rate_limited`       | Klienten gjør for mange kall. |
| 500    | `server_error`       | Midlertidig feil. Forsøk igjen senere. |

### `GET /v1/transactions/{transaction_id}`

Henter status på en transaksjon.

**Response 200**
```json
{
  "transaction_id": "tx_1234567890",
  "status": "completed",
  "amount": "10.00",
  "processed_at": "2023-11-01T12:05:00Z",
  "reason": "quest_completion"
}
```

**Feilkoder**

| Status | Feilkode        | Betydning |
| ------ | --------------- | --------- |
| 404    | `not_found`     | Ukjent transaksjons-ID. |
| 401    | `unauthorized`  | Manglende eller ugyldige autentiseringsopplysninger. |

## Krav til klientimplementasjon

1. Bruk idempotent `nonce` for hver transaksjon og lagre responsen lokalt.
2. Valider beløp, brukerstatus og anti-cheat-regler før kall.
3. Logg alle forsøk (suksess og feil) i audit-loggen.
4. Sørg for at feil ved API-kall rapporteres med detaljer for rask feilsøking.
5. I testmiljø skal `MockRealTokenAdapter` simulere samme responsformat uten nettverkskall.

## Mock-adapter kontrakt

Mock-adapteren skal:
- Returnere deterministiske `transaction_id`-er på formatet `mock-{nonce}`.
- Lagrer transaksjonen i minnet slik at den kan hentes opp igjen for verifikasjon.
- Etterligne feil ved å kaste `RealTokenError` hvis beløpet er større enn en konfigurerbar grense (standard 1000 REAL).

## Produksjonsadapter krav

Produksjonsadapteren skal:
- Signere forespørsler i henhold til ovenfor.
- Implementere eksponentiell backoff ved midlertidige feil (`5xx` eller `429`).
- Validere svar og kaste `RealTokenError` hvis formatet er ukjent.
- Logge rårespons (maskert for sensitive felt) til audit-systemet.

## Audit og rapportering

- Alle transaksjoner lagres i tabellen `token_transactions` og vises i dashbord.
- Dashbord skal kunne vise totaler per dag, antall feil og topp-brukere.

## Sikkerhetskontroller

- Rate limiting håndheves per bruker og per global klient.
- Anti-cheat-regler må kunne blokkere transaksjoner før de sendes til API-et.
- Signaturer må lagres sammen med transaksjonsloggen for senere revisjon.

