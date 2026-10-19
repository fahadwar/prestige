# Prestige / برستيج — six playable games

Arabic RTL roster game with daily and practice modes. Current dataset: 513 roster questions across 32 CWL/CDL events/stages in 2017–2026. This includes 370 CWL event snapshots and 143 Breaking Point match snapshots covering opening stages and Champs for 2020–2026. Paris Legion’s 2022 opening-stage snapshot is withheld because all available match records have incomplete participant lists. Intermediate modern roster changes remain unfinished. See `docs/BREAKINGPOINT-DATA.md`. See `docs/UPSTREAM-AUDIT.md` for source audit, rights, coverage and remaining work.

## Development

Node 22.13+ required. Install with `npm install`, then `npm run dev`. For this managed Sites checkout use the supplied dependency/build helpers. `npm run build` builds the Next-compatible Vinext/Workers application. No external API credentials are required for the bundled beta.

## Verification

`node scripts/test-game.mjs` checks gameplay and dataset contracts. `npx tsc --noEmit` checks TypeScript. `python scripts/data/import-rosters.py` previews the checksummed import; `--apply` writes the generated catalogue and coverage report after backing up previous files. Restore the `.json.bak` file to roll back an import. Never apply a changed catalogue without versioning the daily schedule.

## Guest state

Progress and statistics are stored on this browser. Daily reset is midnight UTC. Each correct answer is worth 100, completion awards 100 (maximum 500 for four players, 600 for five), wrong guesses cost 25, each hint costs 50, and six wrong guesses end play. Two hints maximum. Scores are not ranked or tamper-resistant.

## Files

`lib/game/engine.ts`: game rules and frozen daily selection. `lib/game/daily-schedule.json`: versioned 370-question daily rotation beginning 2026-10-18 UTC. `lib/game/legacy-daily.json`: original question IDs for earlier dates. `lib/game/rosters.json`: generated source-attributed event snapshots. `app/api/game/route.ts`: question delivery and server-side evaluation. `app/page.tsx`: Arabic gameplay. `scripts/data`: dry-run import. `data/source`: 18 checksummed BSD-licensed source CSVs and event manifest. `public/notices`: mandatory data notice.

## Remaining production work

PostgreSQL/Drizzle persistence, reviewed import staging, secure authenticated admin, authoritative sessions/attempts, request rate limiting, full verified CDL-season coverage, browser/mobile QA, Docker/Node deployment and custom domain setup. None are represented as completed. Existing CDLArabic.com is untouched.

## Missing Player

`/missing-player` provides the second game: identify one missing teammate in three attempts. It has its own daily schedule, local daily progress, statistics, practice season filters and spoiler-free sharing. See `docs/MISSING-PLAYER.md` for rules, data contracts and verification.

## Connections

`/connections` groups 16 player names into four sourced four-player lineups. Daily and practice modes include 60 frozen puzzles across 2021–2026, four mistakes, one-away feedback, local progress/stats and spoiler-free sharing. See `docs/CONNECTIONS.md`. Check with `node scripts/test-connections.mjs`. Career Path remains unreleased with no certified complete career records.

## Guess the Player

`/guess-player` offers six guesses with country, frozen age, weapon-role and team comparisons. The expanded pool contains 104 checked current/historical profiles. Dated teams are explicitly labeled and need not be current. Missing/conflicting profile fields remain excluded; original 13 targets and daily order are preserved. Age is frozen to 2026-10-18; each team fact displays its own snapshot date. Daily/practice modes, local progress/stats and spoiler-free sharing are independent. See `docs/GUESS-PLAYER.md`; verify with `node scripts/test-guess-player.mjs`.

## Ranking Challenge

`/ranking` arranges five photographed players from oldest to youngest using verified complete birth dates. It has 104 frozen puzzles spanning all 104 accepted players, one final submission per UI round, daily/practice modes, drag and arrow controls, draft/final daily progress, 100 points per correct position and spoiler-free sharing. See `docs/RANKING.md`; verify with `node scripts/test-ranking.mjs`.

Time Machine: 284 full lineups from 2017–2026, three season guesses, daily/practice. See `docs/TIME-MACHINE.md`. Verify with `node scripts/test-time-machine.mjs`.

## Prestige / برستيج game lobby

Dark arcade lobby at `/` with six illustrated game tiles and a featured daily Guess Player challenge. Roster gameplay now lives at `/roster`; its browser storage keys, API, daily schedule and sharing are preserved. Shared navigation and gameplay screens use the dark arcade palette. Visible sources remain removed; source records and notices remain internal. Browser/mobile visual verification is unavailable.
