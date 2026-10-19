# Ranking Challenge / رتّبهم

Fifth playable game at `/ranking`. Five photographed players must be placed **oldest to youngest**. First means earliest complete birth date, not largest rounded age. This release ranks birth dates only; kills, titles, earnings and other unsupported rankings are not included. Career Path remains unreleased.

## Catalogue

104 deterministic, distinct puzzles use the 104 accepted profiles in `data/players/guess-profiles.json`. Each profile anchors at least one puzzle, so every accepted player is represented. Each puzzle has five unique normalized identities and five different ISO birth dates. Equal birth dates are excluded from the same puzzle. Starting order is shuffled and is never already the correct order.

Dates reuse the Breaking Point/Liquipedia cross-checks in Guess the Player. No additional biography, career assumptions or age guesses are introduced. After submission, each player's exact birth date and source are revealed.

`lib/game/ranking-puzzles.json` stores the player sets and initial order. `ranking-schedule.json` freezes the daily ID sequence from 2026-10-18 UTC. All 104 puzzles appear before a repeat. Practice avoids the last puzzle. `python scripts/data/generate-ranking.py` previews deterministic generation; `--apply` writes an unchanged/new catalogue. A changed frozen catalogue or schedule is rejected for explicit review/versioning.

## Gameplay and scoring

Reorder using native drag/drop or up/down buttons. Buttons support keyboard and touch; list ranks, labels, focus styles and live move notices remain available without drag support. The first/last arrow boundaries are disabled. A daily draft can be restored before submission.

One final submission is offered per UI round; editing is then locked and the submitted/correct orders are displayed. Each exact position earns 100 points, up to 500. A perfect five-position order counts as a win for the daily streak. Other results still receive their correct-position score. The server validates a complete permutation of the puzzle's five names, with no duplicate, unknown, missing or extra entries.

GET exposes ID, five shuffled names and oldest-first direction only. It does not expose birth dates, ages, ranking positions, source links or the profile catalogue. POST returns final grading, dates and correct ordering. Shared results omit names and dates.

Daily drafts, final progress and statistics use separate `cdlar-ranking-*` browser keys. A saved final submission is revalidated on reload and not counted again. Practice rounds have separate completion IDs. Request tokens and an in-flight guard prevent stale responses and double-click submissions in the UI. This uses the same guest/stateless server architecture as existing games: it is not an authenticated single-attempt competition or ranked leaderboard.

## Verification

`node scripts/test-ranking.mjs` checks all **12,480 possible submitted orders** across 104 puzzles, exact-position score/win flags, full player/photo coverage, unique dates, source profiles, oldest-first sorting, valid permutations, hidden initial data, invalid HTTP inputs and frozen UTC rotation. TypeScript and the production build are required before publication. Browser/mobile visual QA was unavailable; responsive controls and layout were reviewed in source.
