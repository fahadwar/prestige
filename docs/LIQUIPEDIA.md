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

## Exact relationships and ambiguity review

Analysis version 2 derives annotations when reading saved staging; it does not rewrite snapshots, change collection queries or make API requests. Existing player/team progress and cached pages remain valid. Player `teampagename` is compared to the team's original `pagename` using exact string equality. There is no case-insensitive, underscore/space, display-name or template fallback. Missing, absent and ambiguous references remain unresolved. An exact page link does not confirm a historical roster, exclusive game division or player identity. A referenced source conflict is flagged.

Shared player handles and team display names (NFC, trimmed and case-insensitive) are flagged across distinct collected source objects. Existing handle suggestions retain the project's alias normalization, but multiple candidates for a normalized existing handle are separately flagged and never merged. Counts are limited to the current snapshots and can change as collection continues.

Explicit Mobile, Warzone and CODOL tokens in source pagenames become review markers. Player markers can also cite a uniquely linked team's exact page. Each marker retains its basis and source pagename. An unmarked page stays `unclassified-history-needed`; it is not automatically classified as competitive console Call of Duty. A marker is not proof of an exclusive career and does not exclude a person automatically. Current `staff` records remain included because they can have playing history.

The owner can filter saved records by ambiguity, explicit division markers, staff, and missing/unresolved team references. Downloads always contain the full dataset, independent of the display filter. Player downloads include the team snapshot's selected source pages and timestamps used in the comparison, analysis version and nearby source/license notices. GET review/filter/download actions only read shared storage; the manual collection command remains unchanged.

Verification: `node scripts/test-liquipedia-matching.mjs` tests strict team links, shared names, alias ambiguity, division evidence, staff retention, unchanged source objects and filters. Optional player and team export paths run the same reader against uploaded snapshots without network access. On the reviewed October 19 exports, 1,500 player source objects and 461 team source objects produced 325 exact player-team links, 142 unresolved team references, 1,033 empty references, and 18 shared-handle groups across 39 records. None of these counts establishes game eligibility.

Per-row peer and team-candidate previews are bounded to 20 entries to avoid quadratic response growth. Player/team exports retain complete source pages; the ambiguity group index retains every member source ID. Preview counts disclose the total.

## Published game identity import (October 19, 2026)

The offline importer `scripts/data/import-liquipedia.py` publishes accepted identity facts for existing evidence-checked Guess Player profiles. It reads the exported source pages, validates API provenance and export integrity, and requires one exact Liquipedia source URL already attached to the approved game profile. The source handle must agree under existing approved aliases, the country label must agree with the game's country code, real name/status/type must be supported, and existing birth-date/role evidence must remain valid. No handle-only join, current-team eligibility inference or automatic new target creation occurs.

The first applied batch `lp-ab8cd41f2b9b41dc7ef2` imports 75 player identities and 22 uniquely referenced team source records from the supplied 1,500-player and 461-team exports. Their selected source rows, API query URLs, fetch timestamps, source identities, license, input file hashes and modification notice are retained in `data/liquipedia/game-identities.json`. The batch audit retains the acceptance/rejection report and exact prior catalogue. Original uploaded exports are not modified. Player pagination is still unfinished.

Only the completed Guess Player answer exposes the accepted identity's real name, fetched status/type and optional exact linked team. A nearby Arabic notice separates these fetched profile facts from the historical team and AR/SMG/Flex clues used in the game; the individual Liquipedia source and CC BY-SA 3.0 license are linked alongside the imported data. Hidden target information is not added to initial responses or ongoing comparison rows. The owner page separately reports published import totals so staging counts cannot be mistaken for playable pool counts.

Cammy is held for a country-label difference; Chino and Fire are held because the fetched handles Cheen and Fear require additional alias evidence. Another 26 existing profiles have source pages outside the collected snapshot. They remain playable with their existing facts and receive no new identity enrichment. The imported data adds **zero new playable targets**: the Guess Player pool remains 104. Names, nationality, status and current team references alone do not establish required birth dates, playing roles, dated rosters or complete careers. The remaining 1,425 source player records are not approved by this import; do not represent them as verified new game players.

Commands (offline, no API requests):

```text
python scripts/data/import-liquipedia.py <player-review.json> <team-review.json>
python scripts/data/import-liquipedia.py <player-review.json> <team-review.json> --apply
python scripts/data/import-liquipedia.py --rollback lp-ab8cd41f2b9b41dc7ef2
```

The first command is read-only. Apply is idempotent and writes the audit before atomically replacing the catalogue. Rollback refuses if the active catalogue differs from the batch's recorded digest; it restores the exact prior catalogue and retains the audit. After applying or rolling back source data, build and publish the same existing Site through the normal workflow. It never writes production storage or changes a live deployment by itself.

Validation: `python scripts/data/test-liquipedia-import.py` exercises evidence rejection, wrong-person/country protection, exact division linkage, staff retention, idempotence and guarded rollback in a temporary checkout. `node scripts/test-liquipedia-game-import.mjs` checks all 75 imported identities, 22 exact team records, revealed versus hidden answer boundaries, adjacent source/license output, held records and historical clue preservation. Existing Guess Player, Ranking and Career Path tests remain required. Browser QA is unavailable in this environment; the native deployment result verifies publication, while interactive visual behavior awaits owner review.
