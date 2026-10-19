# Guess the Player / من اللاعب؟

Fourth playable game at `/guess-player`. Six attempts identify a player using country, age, weapon-role and a **dated verified team** comparison.

## Expanded catalogue

**104 distinct players**, including current and historical competitors, replace the overly narrow 13-active-player pool. There are 222 portrait-linked roster identities in the candidate audit; 118 lack a required field or have a conflict. Aliased archive handles do not inflate the playable count. `guess-profile-coverage.json` lists exclusions.

Every accepted DOB is normalized as a calendar date and must agree between Breaking Point and the public Liquipedia MediaWiki profile. Nine conflicting DOBs remain excluded; expanding the pool does not resolve those conflicts by guessing. Country is the primary listed Liquipedia profile country, normalized to an Arabic label/code; UK constituent countries are grouped as GB. It is not a claim about all citizenships or birthplace. Weapon roles are explicit AR/SMG/Flex values from Breaking Point's public `playerPositionMap`, keyed by player ID, not inferred from a roster.

Sources and minimal corroborating facts are in `data/players/guess-profile-evidence.json`. Player portraits reuse the checked registry.

## What the team clue means

Requiring an active current contract was an unnecessary exclusion for this game. New historical players use their **latest dated appearance in our bundled roster archive**. The matching question shows team date next to the team, including on reveal. This is not claimed to be the player's current team, final career team, or complete career history. Retired players and players now in Challengers are therefore not excluded merely because they left the CDL.

The original 13 profile records retain their existing verified team snapshot dated 2026-10-18. Team comparisons match the displayed team name, rather than incorrectly treating historical and rebranded names as equal merely because they share a franchise ID. Every displayed team value has its own explicit date. The UI says these are dated team facts and may differ from current teams.

Age remains calculated on **2026-10-18** for all questions. Later birthdays do not silently change an existing daily challenge. Country and weapon-role reference facts remain source-attributed profile values.

## Daily preservation and gameplay

The original 13 records, IDs, sources, trait comparisons and first 13 daily slots remain unchanged. The 91 new targets are appended to the existing frozen rotation. Practice immediately uses all 104, and guesses in either mode can use the entire expanded list. Existing daily progress is preserved and revalidated.

GET exposes only target ID/reference date, eligible names, day/date and count. Unfinished POST reveals only guessed-player facts and match feedback. Target profile/portrait/sources reveal after correct identity, six wrong guesses or surrender. Equal ages refer to completed years. `older` means target age exceeds guessed age; `younger` means target is younger. Identical traits do not themselves constitute the correct identity.

Win points are 600/500/400/300/200/100 on attempts 1–6; loss/surrender score zero. Unknown names, duplicate aliases/case variants and post-success guesses are rejected. Local progress/stats use independent `cdlar-guess-*` keys; shared results omit identity and traits. These are guest records, not authenticated ranked scores.

## Verification

`node scripts/test-guess-player.mjs` checks all **10,816** player/target comparisons, source DOB/role agreement, historical team/roster/date membership, portraits, age boundaries, scoring, losses, surrender, duplicates, target privacy, HTTP validation and UTC rotation. Regression checks preserve all original 13 records and their comparison behavior/daily order. TypeScript and production build must pass. Browser/mobile visual QA remains unavailable in this environment.
