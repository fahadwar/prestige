# CDL 2026/27 update — checked November 1, 2026

The 2027 CDL season begins December 4, 2026 on Modern Warfare 4, per the league's season announcement:
https://www.callofdutyleague.com/en-us/news/2027-season-announcement

This release adds seven complete announced starting lineups as preseason snapshots. It does not claim competitive match observations. The announced date, reviewed date, source URL, factual evidence and digest are retained in `data/seasons/2027.json`. Original editorial prose and media are not copied. No Liquipedia HTML or new API requests were used.

| Team | Announcement date | Starting lineup |
| --- | --- | --- |
| Miami Heretics | 2026-10-06 | MettalZ, ReeaL, Snoopy, SupeR |
| FaZe Vegas | 2026-10-19 | Simp, Scrap, HyDra, Alluka |
| Paris Gentle Mates | 2026-10-21 | 04, Abuzah, Drazah, JoeDeceives |
| Vancouver Surge | 2026-10-22 | Mamba, Vik, Nemensions, Wevy |
| Cloud9 New York | 2026-10-22 | Lurqxx, Pred, Cammy, Insight |
| Toronto KOI | 2026-10-24 | RenKoR, CleanX, Kips, Ethan |
| Riyadh Falcons | 2026-10-30 | Kremp, Sib, Cellium, KiSMET |

Sources are the official FaZe Vegas announcement, Breaking Point's direct coverage of the Miami, Paris and Toronto announcements, and ESPORTNOW's reports including the Vancouver, Cloud9 and Riyadh announcement embeds. Each game's preseason snapshot links to its source. The October 31 Esport News roundup corroborates all seven dated lineups. Its reported OpTic carryover is not treated as a new announcement. M80 Boston, Carolina, LA Thieves and G2 Minnesota are pending complete announced lineups in this reviewed scope. This is seven of twelve teams, not full league coverage.

Roster practice and Missing Player practice expose a `2027` season filter labeled 2026/27. Seven roster challenges and 28 missing-player variants are added. The four new player handles are Ethan, Vik, Nemensions and Wevy. Source-backed O4/04 and zvik/Vik spellings are accepted as aliases. The four new handles use the existing silhouette image until portraits are verified. Historic roster JSON and all daily schedules remain byte-for-byte unchanged. Coverage includes 520 total roster snapshots and 335 raw player spellings.

Guess Player practice adds a separate 2027 cohort of 23 already evidence-checked players whose announced lineups are in this release. Their question IDs carry a `.2027` suffix, team clues cite the new announcement date, and ages use November 1, 2026. MettalZ's role is updated to AR in this cohort using the explicit role switch reported with Miami's announcement. Other role classifications retain their previous verified evidence and dates rather than assuming new role changes. The answer reveal links the roster and role evidence and discloses the role date. The UI explains these evidence dates.

The original 104 profiles and daily Guess Player rotation retain the original facts and age reference date. Ethan, Vik, Nemensions, Wevy and Lurqxx are available in the roster games but do not become Guess Player profiles because the required birth-date/country/role evidence has not all been verified. Ranking and Career Path remain governed by their existing birthday and complete-career requirements. These roster announcements cannot establish complete careers.

Raw evidence with player-to-team relationships is retained outside the playable roster objects so it does not leak missing answers through initial API responses. Practice requests are checked against supported seasons. Guess Player answers are resolved within the selected cohort, and 2027 question IDs are rejected for daily submissions.

Verification:

- `node scripts/test-season-2027.mjs`: all seven new rosters, all 28 missing slots, source facts, both aliases, all 23×23 new-season Guess Player comparisons, dated clue selection, hidden-answer boundaries, HTTP season behavior, and unchanged historical JSON/daily schedules.
- `node scripts/test-game.mjs`: all historical and new roster/missing gameplay contracts and coverage, source-type distinction, terminal-round rejection and original daily schedules.
- Existing Guess Player, imported-identity, Ranking and daily streak tests retain their original behavior.
- TypeScript and the production build are required before publication.

Browser preview could not connect to the managed preview URL despite the preview daemon reporting it running. Interactive browser QA is unverified; no application changes were made to compensate for that infrastructure failure.
