# Time Machine

Sixth playable game: 284 full team lineups across seasons 2017–2026. Three distinct season guesses with earlier/later feedback; scores 300/200/100, loss or surrender zero. Daily UTC and unlimited practice, independent browser-local progress/stats and spoiler-free sharing.

The generator groups complete team/normalized-player sets and rejects 18 groups whose full lineup appears in multiple seasons anywhere in the collected archive, including under different team names. Eligibility establishes uniqueness within this archive, not exhaustive historical coverage. All four or five members are retained. Photos can come from another season; missing archival portraits use the existing fallback.

Question payloads expose only opaque question ID, team, names and roster size. Season, event, dates and evidence are returned after completion. No season filter gives away practice answers. Seasons may start in the prior calendar year. All matching evidence records are revealed.

`python scripts/data/generate-time-machine.py` previews generation; `--apply` preserves frozen catalogue/schedule. The daily schedule begins 2026-10-18 and cycles all 284 questions. `node scripts/test-time-machine.mjs` checks eligibility, source integrity, scoring, privacy, schedule and HTTP validation. Guest requests are stateless server validation, not an authenticated ranked ledger. Browser/mobile visual QA is unavailable in this managed environment.
