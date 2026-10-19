# Liquipedia API connection

The approved LiquipediaDB v3 API is the only new Liquipedia data path. No scraping is implemented.

## Configuration

Set `LIQUIPEDIA_API_KEY` as a hosted Site secret. `LIQUIPEDIA_ADMIN_EMAIL` is the verified Site owner's ChatGPT email, also stored as a secret. Neither value belongs in Git, the hosting manifest, browser code, request query strings, or logs. Deploy after updating hosted values.

Visit `/admin/liquipedia`, sign in with the owner's ChatGPT account, and select **Test Liquipedia connection**. The server makes one GET to `https://api.liquipedia.net/api/v3/transfer?wiki=callofduty&limit=1` with `Authorization: Apikey …`. Redirects are rejected, responses are bounded to 256 KiB, and requests time out after 15 seconds. Only status and known result-array counts are returned; upstream bodies and credentials are never displayed or saved. A one-minute per-isolate cooldown limits accidental repeat clicks; this is not a global rate limiter. No background collection runs.

The endpoint rejects anonymous, non-owner and cross-origin requests. The owner-only page is excluded from indexing. This connection check does not prove career completeness, license clearance, complete coverage or successful import.

## Next phase

After a successful authenticated request, review the current API schema and the approval's precise usage/license terms. Implement bounded collection into review staging with source URLs, fetch timestamps, deterministic IDs, deduplication, dry-run and rollback. Preserve curated Arabic labels separately. Show Liquipedia credit near any released data and retain applicable attribution and share-alike notices. Do not change frozen daily schedules or unlock Career Path until its existing full-history eligibility checks pass. Send the live project link to Liquipedia through the user's approved communication channel once running; this repository does not send messages.

Source repository: https://github.com/fahadwar/prestige

Verification: `node scripts/test-liquipedia.mjs`. A real authenticated production request remains required; mocked tests do not establish live connectivity.
