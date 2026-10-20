# Liquipedia API connection

PRESTIGE uses the approved LiquipediaDB v3 API for the Call of Duty wiki. No scraping or background collection runs. The connection test does not import or change game data.

## Configuration and access

Store `LIQUIPEDIA_API_KEY` and the verified owner email `LIQUIPEDIA_ADMIN_EMAIL` as hosted Site secrets. Never put them in Git, browser code, URLs or logs. The owner-only `/admin/liquipedia` page requires the trusted ChatGPT identity; its POST endpoint rejects anonymous, non-owner and cross-origin requests.

The connection test requests `/api/v3/transfer?wiki=callofduty&limit=1`. Only status, result counts, sanitized warnings and cache metadata reach the browser. A successful authenticated production request was confirmed on October 19, 2026. Tests use fixtures and make no live API requests.

## Shared request budget and cache

All production API requests go through `createLiquipediaFetch` in `lib/server/liquipedia-storage.ts`. The gateway allows only GET requests to the documented player, team, squadplayer, transfer, teamtemplate and teamtemplatelist API endpoints on api.liquipedia.net, with `wiki=callofduty`. Team template list collection must use its documented `pagination` parameter. No bulk collection is implemented yet.

The existing private R2 binding `BUCKET` stores a shared request ledger and response cache under `liquipedia/v1/`. Conditional object writes reserve each outbound attempt before sending it, across endpoints and server instances. Every attempt, including failures, counts toward a rolling maximum of 60 per hour. Requests are also spaced by at least 65 seconds. Cached requests consume no upstream quota. This budget covers this Site; other applications using the same key must not spend an independent allowance.

Successful bounded JSON responses are retained indefinitely and reused without automatic refresh. They include the source API URL and fetch timestamp. A later reviewed collection workflow must explicitly define any refresh process. Failed requests are cached for at least five minutes; upstream Retry-After can extend both the failure cache and shared pause. No automatic retries run. Redirects are rejected, gzip is accepted, responses are limited to 256 KiB, and outbound requests time out after 15 seconds. API errors are handled as failures and warnings are retained.

The key never forms part of the cache key or stored request metadata. Returned bodies containing the configured key or its encoded forms are rejected before persistence. Upstream failure bodies are discarded.

Missing or invalid storage blocks new outbound requests. A crash or failed storage write after reservation leaves a pending marker and blocks new requests until operator review; do not clear the ledger automatically. Existing cached responses remain usable. Before any manual recovery, establish that the outstanding request has ended and retain the last hour of reservations plus applicable backoff. Clearing the entire ledger could violate the allowance.

## Data release requirements

The approval requires nearby Liquipedia attribution, ideally linking to the source; applicable CC-BY-SA 3.0 attribution and share-alike notices; and public open source publication. Source repository: https://github.com/fahadwar/prestige . Send the live project link to Liquipedia through the user-approved communication channel once running; this code does not send messages.

Before imports, add review staging, source URLs and timestamps, deterministic IDs, deduplication, dry-run and rollback. Preserve curated Arabic labels separately. Do not change frozen daily schedules or unlock Career Path until its full-history eligibility checks pass. The connection test does not prove complete coverage or career completeness.

Verification: `node scripts/test-liquipedia.mjs`, `node scripts/test-liquipedia-storage.mjs`, and `npx tsc --noEmit`. Concurrency, quotas, cache and failure behavior are exercised with storage and HTTP fixtures; these tests do not establish live production storage behavior.
