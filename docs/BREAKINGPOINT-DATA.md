# Breaking Point modern rosters

The 2020–2026 addition uses Breaking Point's public event and match pages. It needs no Cito or Liquipedia key. Existing Activision CWL records remain in place.

## Scope

For each season, collect the earliest recorded CDL league event (2022 uses Major 1 Qualifier because the Kickoff Classic page has no matches), plus the CDL Championship. For each participating team select its first verifiable completed match at that event. This is a dated match snapshot, not a claim that a lineup remained unchanged throughout the event or season. Nonqualifying teams do not receive a Champs record. EWC is excluded.

## Acceptance

Read `__NEXT_DATA__.props.pageProps.initialMatchState.games[].player_stats` from the public match HTML. Retain only participant IDs/handles/team IDs, match/map identity, match date, event and historical team names. No kills, ratings, editorial articles, biographies or other unrelated fields are shipped.

Accept a team only if every recorded map contains exactly five distinct players in 2020 or four in 2021–2026, with the identical player ID/name mapping across all maps. Use the match-level team ID for participant grouping. Never infer membership from today's directory, franchise branding or map-level team slots. The 2020 opening match Dallas/Chicago demonstrates why: its game slot references a different Chicago team ID while its player records correctly identify Chicago Huntsmen.

If a team’s first match fails validation, try its later completed matches at that same event; preserve rejected match IDs and reasons in the audit trail. The question shows the actual selected match date.

Breaking Point sometimes carries current franchise branding into old matches. Team ID 11 is explicitly restored to Minnesota RØKKR for 2020–2025, supported by the public team page’s `teamAliases` and its 2025 match record: https://breakingpoint.gg/match/93815. The team page is https://breakingpoint.gg/teams/11/G2-Minnesota. Keep G2 Minnesota for 2026.

Each imported question includes a public match source URL, participant-evidence SHA-256, observed map count and match date. Public evidence is stored in `data/source/breakingpoint/milestones.json`; rejected groups and counts are in `data/breakingpoint-coverage.json`.

## Reproduction

Use a cache directory outside the source checkout to avoid storing raw page content in source control:

```sh
python scripts/data/collect-breakingpoint.py --cache /tmp/cdl-bp-cache --output /tmp/bp-milestones.json
python scripts/data/import-breakingpoint.py /tmp/bp-milestones.json
python scripts/data/import-breakingpoint.py /tmp/bp-milestones.json --apply
python scripts/data/test-breakingpoint.py
node scripts/test-game.mjs
```

The collector uses three concurrent public-page requests, caches successful responses and retries transient errors. Import defaults to dry run. Reapplication replaces the provider's imported questions rather than duplicating them. It does not rewrite frozen daily schedules. Modern records are immediately available in both games' practice filters.

Remaining coverage: intermediate changes, additional event appearances, and substitutions between matches. A stable map lineup verifies participation in that match only; it does not verify a full season or prove the upstream record is error-free.
