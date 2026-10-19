# Missing Player — اللاعب المفقود

Route: `/missing-player`. Linked from the homepage navigation and the playable Missing Player card. The roster game remains on `/`.

## Rules

One roster slot is hidden; the other three or four teammates are displayed with names and available portraits. Three distinct player guesses are allowed. Visible teammates cannot be guessed. Correct on attempt 1/2/3 scores 300/200/100. Three wrong guesses or surrender reveal the answer with zero points. Sharing includes team, event, date, attempts and score, never the answer.

## Data and daily schedule

Uses the same 370 source-attributed roster snapshots and four/five-player format. The independent frozen `lib/game/missing-schedule.json` starts 2026-10-17 UTC. A 370-day rotation uses each roster once; the next cycle changes the missing slot. Questions do not depend on live external APIs. Practice can filter 2017, 2018 or 2019 and avoids the preceding roster.

`missingQuestion` returns visible teammates and a null slot, not the hidden answer. The server evaluates guesses and returns the answer only on completion. Client code does not import the roster catalogue or answer engine. The candidate search pool contains all eligible players, including the answer, with visible teammates excluded.

## Guest state

Daily progress uses `cdlar-missing-v1-<UTC day>`. Statistics and completion markers are separate from the original roster game. Refresh revalidates saved daily guesses server-side. Practice rounds are transient and a new practice question starts after refresh. Daily completed rounds are counted once per browser. Streaks count daily wins; practice does not advance a daily streak.

Guest storage is local and can be modified by the visitor. The API remains unranked and stateless, consistent with the existing beta. Authoritative sessions, rate limiting and cross-device accounts remain separate production work. Deterministic IDs and publicly reviewable source data are not an anti-cheat mechanism.

## Verification

`node scripts/test-game.mjs` checks every roster/missing-slot variant, null-slot payloads, correct answer timing, three-attempt scoring, losses, surrender, duplicate and teammate rejection, alias handling, UTC stability and the full daily rotation. It also calls the actual HTTP handlers for daily/practice requests, server validation, malformed/oversized JSON and cache headers. TypeScript and production build checks are required. Browser/mobile interactive QA is unavailable in this environment.
