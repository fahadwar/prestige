# Liquipedia API connection

PRESTIGE uses the approved LiquipediaDB v3 API for the Call of Duty wiki. No scraping or background collection runs. The connection test does not import or change game data.

## Configuration and access

Store `LIQUIPEDIA_API_KEY` and the verified owner email `LIQUIPEDIA_ADMIN_EMAIL` as hosted Site secrets. Never put them in Git, browser code, URLs or logs. The owner-only `/admin/liquipedia` page requires the trusted ChatGPT identity; its POST endpoint rejects anonymous, non-owner and cross-origin requests.

The connection test requests `/api/v3/transfer?wiki=callofduty&limit=1`. Only status, result counts, sanitized warnings and cache metadata reach the browser. A successful authenticated production request was confirmed on October 19, 2026. Tests use fixtures and make no live API requests.

## Shared request budget and cache

All production API requests go through `createLiquipediaFetch` in `lib/server/liquipedia-storage.ts`. The gateway allows only GET requests to the documented player, team, squadplayer, transfer, teamtemplate and teamtemplatelist API endpoints on api.liquipedia.net, with `wiki=callofduty`. Team template list collection must use its documented `pagination` parameter. Owner-triggered review staging is implemented for player and team only; the other endpoints are not collected.

The existing private R2 binding `BUCKET` stores a shared request ledger and response cache under `liquipedia/v1/`. Conditional object writes reserve each outbound attempt before sending it, across endpoints and server instances. Every attempt, including failures, counts toward a rolling maximum of 60 per hour. Requests are also spaced by at least 65 seconds. Cached requests consume no upstream quota. This budget covers this Site; other applications using the same key must not spend an independent allowance.

Successful bounded JSON responses are retained indefinitely and reused without automatic refresh. They include the source API URL and fetch timestamp. A later reviewed collection workflow must explicitly define any refresh process. Failed requests are cached for at least five minutes; upstream Retry-After can extend both the failure cache and shared pause. No automatic retries run. Redirects are rejected, gzip is accepted, responses are limited to 256 KiB, and outbound requests time out after 15 seconds. API errors are handled as failures and warnings are retained.

The key never forms part of the cache key or stored request metadata. Returned bodies containing the configured key or its encoded forms are rejected before persistence. Upstream failure bodies are discarded.

Missing or invalid storage blocks new outbound requests. A crash or failed storage write after reservation leaves a pending marker and blocks new requests until operator review; do not clear the ledger automatically. Existing cached responses remain usable. Before any manual recovery, establish that the outstanding request has ended and retain the last hour of reservations plus applicable backoff. Clearing the entire ledger could violate the allowance.

## Data release requirements

The approval requires nearby Liquipedia attribution, ideally linking to the source; applicable CC-BY-SA 3.0 attribution and share-alike notices; and public open source publication. Source repository: https://github.com/fahadwar/prestige . Send the live project link to Liquipedia through the user-approved communication channel once running; this code does not send messages.

Review staging now retains selected source rows, URLs and timestamps, deterministic source object IDs, duplicate and conflict flags, and quarantined records. Before any game import, add a separate approved dry-run, apply and rollback workflow. Preserve curated Arabic labels separately. Do not change frozen daily schedules or unlock Career Path until its full-history eligibility checks pass. The connection test does not prove complete coverage or career completeness.

Verification: `node scripts/test-liquipedia.mjs`, `node scripts/test-liquipedia-storage.mjs`, and `npx tsc --noEmit`. Concurrency, quotas, cache and failure behavior are exercised with storage and HTTP fixtures; these tests do not establish live production storage behavior.

## Player and team review staging

The owner page provides a manual **Fetch player/team page** action. Each click requests one page of up to 100 records with explicit selected fields, offset pagination and `pagename ASC, objectname ASC` ordering through the existing shared gateway. It saves review progress in private R2 under `liquipedia/v1/review/player.json` or `team.json`. Reloading the page or browsing saved review rows never calls Liquipedia. A stale browser cursor is rejected; conditional writes prevent concurrent collectors overwriting progress. Cached API pages allow recovery after a failed staging write without another upstream request.

A short or empty page marks `pagination-ended`; it does not establish complete wiki coverage. Offset pagination is not an atomic snapshot, and source changes during collection can move records across page boundaries. API warnings, a repeated page, or the 100-page safety ceiling stop collection for review. Each dataset is additionally bounded to 4 MiB; a page exceeding that bound is not added and the owner must review the existing export. No automated restart, reset, refresh, background job or collection loop exists. Continued collection beyond a stopped review requires an explicit follow-up change after inspecting its cause.

Records are grouped by wiki, endpoint, pagename and objectname. Blank object names are valid when the API supplies that string field. Missing identity/name fields are quarantined. Equal source identities with different selected field values are flagged as conflicts; all original variants remain in the downloadable source pages. Equal display names on different pages remain separate. Existing roster handles use the project's established alias normalization for possible matches; team names use conservative case/space normalization. Matches are suggestions only, and unmatched candidates are not asserted to be missing identities.

The page displays 20 reviewed names at a time, direct source links and nearby Liquipedia/CC BY-SA 3.0 credit. The JSON download includes attribution, a modification notice, query URLs, fetch timestamps, warnings, selected source fields, every conflicting variant, quarantine records and candidate match flags. It remains owner-only and uses private/no-store response headers. This is a dry review dataset, not an apply/import mechanism. It does not change curated Arabic labels, schedules, eligibility, careers, player counts or team counts in any game. No rollback is needed for games because no game writes exist.

Additional verification: `node scripts/test-liquipedia-review.mjs` covers paging and resume, completion, warning/repeated-page stops, source identity deduplication, conflicts/quarantine, name match suggestions, licensed export, shared quota use, concurrent staging writes, failure handling, and authenticated routes. Browser QA is not available in this environment; live API schema and runtime collection should be checked with the first owner-triggered page before continuing.
