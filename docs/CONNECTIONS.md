# Connections / روابط CDL

Third playable game at `/connections`. Career Path stays locked and unapproved.

## Puzzle scope

60 frozen puzzles: 10 each for 2021–2026. Every puzzle contains four sourced, four-player starting lineups from a single archived event, with 16 distinct normalized names. These are dated lineups, not general categories such as nationality, all-time teammates or championships won. Five-player seasons are not reduced to four.

The generator compares each board against **all distinct four-player lineups in the bundled 2017–2026 catalogue** (including historical name aliases). A board is rejected if any additional archived four-player lineup is contained in its 16 names. This excludes known competing roster groupings; it does not claim uniqueness across every possible connection or future/uncollected roster. Rules explicitly constrain groups to sourced lineups from the displayed season.

`lib/game/connections-puzzles.json` stores private server-side solutions and each group's roster ID, date, players and source. The client imports no solution catalogue. GET exposes only puzzle ID, season and shuffled names. A correct POST reveals that solved group only. Four mistakes, four solved groups or surrender ends play and reveals all groups.

## Rules and state

Select four names; repeated sets (including reordered/case variants), duplicate names, unknown names, reused solved players and attempts after completion are rejected. A wrong selection with three members of a remaining group receives one-away feedback. Each solved group earns 100 points; each mistake costs 25, with a floor of zero and maximum 400. Shuffling changes visual order only. Four mistakes end play.

Daily schedule starts 2026-10-18 midnight UTC and rotates through all 60 puzzles before repeating. It is independent of the other games. Practice can filter by season and avoids the last puzzle where possible. Progress and statistics use separate `cdlar-connections-*` browser keys. Scores are guest/browser-local, not authoritative ranked records. On reload, daily guesses are validated again by the server. Shared results omit player/team solutions.

## Verification and updates

`node scripts/test-connections.mjs` checks all boards against the full roster catalogue, source equivalence, unique identities, all solution groups, scoring, win/loss/surrender, hidden answers, duplicate/replayed/solved-name rejection, one-away feedback, UTC stability and HTTP input limits. Portraits reuse the existing complete coverage for imported 2021–2026 handles.

`python scripts/data/generate-connections.py` previews the deterministic generation. `--apply` writes only an unchanged frozen catalogue/schedule; changed generated content requires explicit review/versioning rather than silently changing existing daily questions.

Browser/mobile visual QA was unavailable in this environment; responsive layout, semantic toggle buttons, selection limits, live notices, focus styles and request-race guards were reviewed in code. TypeScript and production build are required before publication.
