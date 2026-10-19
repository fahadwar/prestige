# COD-DataAnalysis audit and implementation status

## Current coverage update — 17 October 2026

The subsequent expansion imports all 18 bundled CSV event/stage files. Current published coverage: 370 stable event/team roster questions (2017: 32, 2018: 213, 2019: 125), 266 distinct archived handles. There are 21 excluded changing/incomplete event/team groups. These are source-consistent snapshots, not a claim of independent cross-source verification or exhaustive season participation. Full import details, checksums and excluded groups are in `data/coverage.json`. Four-player IW/WWII and five-player BO4 rosters are supported.

Legacy daily selection is preserved through 17 October 2026 UTC. From 18 October the frozen `lib/game/daily-schedule.json` rotates through 370 distinct question IDs before repeating. Existing question IDs and answers remain compatible. Practice supports season filtering.

The earlier sections below retain the initial audit context; their initial beta counts and 32-day rotation describe the first version and are superseded by this update.

Audited checkout: WillTufff/COD-DataAnalysis, commit c9b6b4e46fc4c742ebc75c15af20a28dd3d98ccd, 17 October 2026.

## Findings

The repository is an analytics product, not a gaming backend. `pipeline/src/cdlhub_pipeline` contains CWL CSV ingestion, Cito scope/backfill/load, LPDB and COD Wiki adapters, identity resolution, staging and quality checks. `db/migrations` contains 41 migrations; `web` is Next.js/TypeScript/Tailwind/Drizzle. The analytics package, rating models and report-builder UI are unnecessary for the first roster game.

Reusable candidates are the source adapters, aliases and identity practices, provenance columns, import quality gates and temporal roster model. `0029_event_rosters.sql` correctly distinguishes event participation from date-range roster stints. Do not infer a whole-season lineup from tournament box scores. Import ordering matters: upstream documents Cito loading before LPDB repairs.

No covered upstream Python or frontend implementation code was copied into this app. The beta independently extracts event participants from the separately licensed Activision CSV archive. The upstream schema is a design reference; this beta does not claim to have integrated its database.

## Actual bundled data

The committed CWL CSV archive covers 2017 Champs, 2018 events and 2019 events. Its BSD-3-Clause notice is retained at `public/notices/activision-bsd.txt`. Structured 2017–2018 event data is also present upstream but unnecessary here. `db/seeds` is synthetic test data and must never populate public historical questions.

Cito, LPDB and COD Wiki response snapshots are excluded. README headline coverage is not distributable repository coverage. A complete verified CDL season cannot be imported from the checked-in repository alone. The 2020–2026 data requires authorized source access and a separate redistribution assessment.

Upstream configuration names `CITO_API_KEY`, `LPDB_API_KEY` and `CDLHUB_UA` with an identifying contact address. PostgreSQL uses `DATABASE_URL`. The COD Wiki adapter uses its own published request policy; no credentials were supplied or external ingestion attempted.

## Licensing

Upstream code: AGPL-3.0. Reusing or modifying covered implementation requires preserving notices and satisfying applicable source-disclosure obligations, including network use. Dataset rights are separate. Upstream describes Cito responses as nonredistributable; no Cito data is included. LPDB/COD Wiki data is described upstream as CC-BY-SA 3.0, requiring attribution and share-alike handling where applicable. These findings document repository terms and do not establish permission for a future API subscription.

## Data proof delivered

One event, not one complete CDL season: CWL Champs 2018, WWII. 2,368 source player-map rows yield 32 team roster snapshots and 128 distinct archived handles. Every included team has four unique participants, and every observed team/map has four unique players. Team EnVyUs and Team Envy merge to Team Envy. This checks source consistency, not independent cross-source verification. Raw names remain as recorded (e.g. Felony, Priestah, Replays); modern aliases need reviewed identity mapping before expansion.

Source CSV SHA-256: 88ec432d8365224fdb7dfcec5e76042704559a104a90fe59dc16022843c38837.

## Architecture and limits

Delivered private beta: Next-compatible React/TypeScript app using Sites Vinext/Workers deployment, server-side roster/guess endpoints, immutable bundled snapshot catalogue and local guest state. UTC daily rotation is stable over the frozen catalogue, with no repeats until its 32 questions are exhausted. Every user gets the same daily question. Any future catalogue update must introduce a versioned schedule preserving historical dates. Practice excludes the immediately preceding question.

This is an initial playable foundation, not the production-ready milestone in the brief. The current API is stateless and unranked; browser state can be altered. No leaderboard or authoritative attempt ledger is claimed. No authenticated admin, persistent import review database, request rate limiter or PostgreSQL runtime has been implemented. Full season verification and admin tooling remain dependencies. Browser QA is unavailable in this environment; build and logic checks are separate from visual testing.

For the requested independent deployment, simplest production architecture is Next.js + PostgreSQL + Drizzle, with scheduled offline imports and versioned daily schedules. Use authenticated server sessions, transactionally unique challenge completions, audited admin edits and source-specific staging. PostgreSQL over a normal connection belongs on a compatible Node host; Sites Workers do not provide raw TCP. Do not silently replace the requested production database with D1.

## Next phase

Acquire authorized CDL roster records for one season, document rights, cross-check snapshots and publish reviewed questions. Implement the PostgreSQL schema/migrations and staging approval workflow, then admin authentication. Add persistent sessions/rate limiting before public ranked competition. The beta intentionally remains private and unranked.
