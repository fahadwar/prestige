# Career Path — blocked by incomplete verification

Career Path is **not released**. There are **zero certified complete careers** in the current approved pool. The 24 candidate profiles reviewed are not a claim that all available players were audited.

The user requires a full career, including academy/Challengers returns, substitute/bench periods, free agency and retirement when applicable. Existing event roster snapshots are insufficient. A player must remain withheld if any part is unverified. A gap-free list alone cannot prove that the first recorded team was the player's first team.

## Findings from Breaking Point public player pages

- 24 candidate profiles fetched; 4 have no team-history rows.
- 14 contain overlapping records needing resolution.
- 17 have intervals not explicitly accounted for by adjacent records.
- 14 need historical franchise names checked against dated evidence.
- 3 have different team IDs in the latest history and current profile.
- 6 have different role labels in the latest history and current profile.

These counts overlap. They are review flags, not automatic proof that each source record is wrong. One-day signing gaps, concurrent academy/substitute contracts and overlapping creator roles require evidence and must not be silently rewritten.

Examples: FormaL's history leaves FaZe Black open-ended while later teams and retirement appear. Crimsix has a free-agent row overlapping his OpTic/Dallas/New York periods. Scrap's profile still identifies LA Thieves while the latest history marks him a free agent. Current branding can appear on older Atlanta FaZe, Seattle Surge, Minnesota RØKKR and Toronto Ultra stints. Shotzzy's three-row list is structurally continuous, but continuity alone does not certify that all early CoD competition is represented.

## Stored evidence and eligibility gate

`data/career/review.json` retains only the 24 candidates' identity, public source URL, dated team/role facts and review flags. No stats, unrelated biographies or implementation from Breaking Point are included.

`data/career/approved.json` is intentionally empty. `lib/game/career-eligibility.ts` intersects the approval list with verified reviews. Full history stays in one record; there is no shortened game-specific copy that could accidentally omit a Challengers or retirement step.

Before inclusion, each candidate needs verified evidence for the first CoD team, all intervening stints/roles, explained gaps, Challengers/academy coverage, historical names, current status and retirement where relevant. Evidence categories must include career start, full history and current status. All date boundaries must reconcile; none may be guessed. A verified scope binds the first date, total step count, terminal start date and role to the reviewed record; clipping its beginning, middle or end invalidates eligibility. The terminal step must account for the current state. Do not infer retirement from lack of a CDL roster.

## Next work

Resolve individual records using dated announcements and complete transfer records, preserving source references. Approve a candidate only after all checks pass. Then implement/release playable Career Path using the approved full records. Do not unlock the homepage card or deploy partial paths while this pool is empty.

Verification: `node scripts/test-career-eligibility.mjs`.
