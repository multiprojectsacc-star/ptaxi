# Personal Taxi — unified backend

One Next.js App Router project serves the frontend and Node.js `/api` handlers on Vercel. PostgreSQL persists canonical locations, server-calculated quotes, complete bookings, payment sessions and the email outbox. No previous secrets or customer records were copied.

## Demo and production

`DEMO_MODE` defaults to `true` when absent. Without a TomTom key, demo uses eight clearly labelled sample locations and deterministic illustrative road distances. With a TomTom key, maps and routes remain real even when payments are in demo mode. Quotes and demo bookings are persisted in PostgreSQL. Demo bookings have status `demo`, never `paid`; no P24 request or email is sent. These routes are illustrative, not a live navigation estimate.

Set `DEMO_MODE=false` only after configuring every real integration in `.env.example`. In real mode address search and road routing use TomTom on the server. Browser-supplied coordinates, price, paid state and return URLs are not trusted: address ID is resolved to the canonical server-cached result, and quote amounts are read from PostgreSQL when creating the booking.

Email delivery continues to use the Resend HTTP API with the persisted outbox. Configure a verified sending domain and sender identity. This is an intentional provider migration, not an already activated email account.

## Confirmed commercial rules

- Every trip has exactly one fixed endpoint: Kraków Airport (KRK), `50.077667, 19.784833`.
- Other endpoint must be a TomTom result in Poland. Searches mentioning airport, lotnisko, Balice or KRK return only Kraków Airport. Other airport POIs are excluded.
- User explicitly requested no fixed kilometre limit. `SERVICE_RADIUS_KM=0` disables the optional radial restriction; quoting depends on a valid drivable route.
- Minimum advance booking: 16 hours.
- PLN pricing preserves the original code: 129 zł sedan, 169 zł premium, 149 zł van through 20 rounded road kilometres, plus 7 zł for every kilometre above 20. Money is stored as integer grosz. Exact route metres are retained for rounding; display rounding must not alter price.
- Sedan/premium up to four passengers and four medium bags; van up to eight passengers and seven medium bags. Large/atypical bags must be described in the unusual-items field (old language versions disagree on premium capacity).
- Combi is available for sedan/premium with no surcharge found in the old code. No new child-seat service has been introduced; child/booster request fields accept only zero.
- Driver notes, flight number, unusual luggage, customer details, invoice details, full route, selected vehicle, luggage, passengers, combi, price, currency, and timestamped terms consent are saved in the booking JSON.

## Frontend contract

All amounts are integer grosz; divide by 100 for display. All endpoints return `{error, code}` on failure, with optional `fields` for validation errors. Requests use JSON and same-origin checks. Endpoints with passenger data return `Cache-Control: no-store`.

- `GET /api/config`: `{mode, minimumLeadHours:16, radiusKm:0, currency:"PLN", airport}`.
- `GET /api/locations?q=Kraków`: `{mode, locations:[{id,name,address,lat,lng,isAirport?,demo?}]}`. At least two characters.
- `POST /api/quote`: `{direction:"from-airport"|"to-airport",location:{id,name,address,lat,lng},departureAt:<ISO with timezone>,vehicleId:"sedan"|"premium"|"van",passengers,luggage,combi,currency:"PLN"}`. Returns `{quoteId,expiresAt:<epoch ms>,mode,distanceKm,durationMinutes,amount,currency,vehicleId,from,to,offers:[{vehicleId,amount,available}],routePoints:[[lat,lng]],radiusKm,...parameters}`. Offer expires after 15 minutes. Changing vehicle requires a new quote.
- `POST /api/bookings`: `{quoteId,customer:{firstName,lastName,email,phone},flightNumber?,notes?,unusualItems?,invoice?:{requested,companyName?,taxId?,address?},acceptTerms:true}`. Returns `{bookingId,status:"demo"|"pending",statusToken,paymentUrl:null|string,mode}` with HTTP 201. A quote can create only one booking, enforced by a DB unique index.
- `GET /api/bookings/status?token=<opaque 64-character token>`: `{bookingId,status:"demo"|"pending"|"paid"|"payment_failed",mode,amount,currency,from,to,departureAt,vehicleId,emailSent,distanceKm,durationMinutes,passengers,luggage,combi}`. The random status token is a capability; PostgreSQL stores only its SHA-384 hash. Do not put it in analytics, logs or referrers. This endpoint never changes payment state.
- `POST /api/payments/notify`: P24 JSON callback. Requires valid P24 SHA-384 signature, exact saved amount/original amount/currency/session/merchant/pos, and successful server-to-server `transaction/verify`. Browser return pages are not payment confirmation.
- `POST /api/internal/email-retry`: requires `Authorization: Bearer <CRON_SECRET>`; reconciles up to five interrupted payment verifications, then drains up to ten queued messages. Set a secure external scheduler to call it every minute in production. The secret must be at least 32 characters. Demo performs no sends.

Live P24 `urlReturn` points to `/rezerwacja/status?token=...` and `urlStatus` to `/api/payments/notify`, both derived exclusively from configured `APP_URL`. Production callbacks require a publicly reachable deployment; an owner-private preview cannot receive unauthenticated P24 callbacks and is intended for demo mode.

## Payment and notification integrity

P24 Basic Auth uses `posId:API_KEY`. Registration, webhook and verification signatures use their distinct documented SHA-384 field orders. Credentials stay server-side. The webhook first authenticates its signature, matches the durable booking, and saves the authenticated notification with internal `verifying` state before calling P24 verification. If the process dies after remote verification, the protected retry job resumes from that stored event. A failed/repeated verify request can be reconciled through authenticated `transaction/by/sessionId` only when status is 2 and session, order ID, amount and currency exactly match. The public status endpoint maps `verifying` to `pending`. An atomic PostgreSQL transaction marks it paid and inserts deterministic customer/operator email jobs. Duplicate signed callbacks do not create duplicate jobs. Conflicting provider order IDs are rejected.

Resend sends use stable idempotency keys. Outbox jobs are leased before dispatch; unsuccessful jobs remain pending. Since provider idempotency keys expire after 24 hours, unresolved retries older than 23 hours are moved to `needs_review` for operator reconciliation. `emailSent` means the email provider accepted the customer message; it does not assert recipient inbox delivery. Production operations must monitor pending/needs_review jobs and replay verified payments after an outage. P24 sends successful-payment callbacks only; an abandoned payment can remain pending. Failed registration has separate `payment_failed` status.

Rate limiting uses PostgreSQL counters keyed by hashed Vercel client IP and minute, never raw IP. Configure platform WAF/rate controls for a high-traffic deployment. The API limits payload length and validates inputs. HTML is not accepted in rendered email templates (messages are sent as plain text). No request body or provider response is logged.

## Setup and validation

1. Keep `.env.local` untracked; configure Vercel server environment variables using `.env.example`, never client-visible variables for secrets.
2. Set the pooled PostgreSQL `DATABASE_URL` on Vercel and apply `npm run db:migrate`. Local development can explicitly use `PGLITE_DATA_DIR`; Vercel never falls back to file storage. Historical D1 migrations are archived under `docs/legacy-d1`.
3. Run `npm test` (Node 24) for business rules, PostgreSQL persistence, cache upserts, transaction rollback, JSONB callback storage and payment/email idempotency.
4. Exercise local demo search → quote → booking → opaque status, invalid/expired quote, duplicate booking and attempted fake callback. Demo status must remain demo, with `paymentUrl:null` and `emailSent:false`.
5. Prior to a real launch, use separate P24 sandbox credentials, publicly reachable callback URL and a verified test sender; perform a controlled end-to-end sandbox payment and duplicate callback test. No real payment, email, or legacy production database operation was performed during development.
6. Confirm legal documents, business details, production secrets, DNS/sending domain, data-retention policy, outbox monitoring and retry scheduler before enabling real booking. Legacy secrets exposed in the old client/API must be rotated through their provider panels.

## Official references

- P24 REST API: https://developers.przelewy24.pl/ — registration/verification and signed result notification.
- TomTom fuzzy search: https://docs.tomtom.com/search-api/documentation/search-service/fuzzy-search
- TomTom route calculation: https://docs.tomtom.com/routing-api/documentation/tomtom-maps/v1/calculate-route
- Resend idempotency: https://resend.com/docs/dashboard/emails/idempotency-keys

## Private day trips

- `GET /api/locations?q=…&scope=tour` returns only canonical pickup addresses in Kraków or Zabierzów municipality, plus Kraków Airport. The default scope remains Poland-wide airport transfers. Municipality comes from TomTom, never a submitted client field.
- `POST /api/tours/quote`: `{slug,pickupId?,pickupPending?:boolean,visitAt:ISO,vehicleId,passengers,luggage?}`. `visitAt` means the start of the visit. Requires a cached canonical pickup or explicit pending address, verifies capacity and pickup lead time, calculates outward and return routes, and persists the fixed tariff as integer grosz. Unknown pickup uses a clearly identified central-Kraków estimate. Neither client amount nor destination is accepted.
- The quote carries `kind:"tour"`, `direction:"tour"`, a `tour` snapshot (name, visit time, waiting time, return times and route estimates), plus the common quote fields. `departureAt` is the computed pickup; `distanceKm` and `durationMinutes` cover the whole outing; `routePoints` shows the outward route. Prices and service durations are versioned in the saved JSON snapshot, not recalculated from mutable browser state.
- Existing `POST /api/bookings` loads either quote type from PostgreSQL. Tour P24 returns use `/travels/status`; airport returns are unchanged. Signed verification and the outbox are shared. Status responses add `kind` and optional `tour`. Demo never registers payments or sends messages.

Tour factual references: https://www.auschwitz.org/en/visiting/ (visitor entrance at Więźniów Oświęcimia 55; reserve named entry passes separately), https://www.kopalnia.pl/turysta-indywidualny/informacje-praktyczne/wazne-informacje/trasa-turystyczna (Daniłowicz Shaft, guided Tourist Route), https://www.zakopane.pl/en/tourist-area (visitor information). Destination addresses were geocoded separately from the old data.
