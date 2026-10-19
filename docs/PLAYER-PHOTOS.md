# Player photos

Current coverage is recorded in `data/players/photo-coverage.json` and `docs/PHOTO-COVERAGE.md`. Breaking Point's public player directory is the main headshot source; existing portraits fill gaps. `breakingpoint-headshots.json` records target-player matches, photo URLs and unavailable/placeholder entries. No private endpoints or credentials were used, and unrelated player statistics, biographies and source code were not imported.

Headshots appear after a correct answer or final reveal. Breaking Point headshots use contain fitting to preserve the full image; existing event photos use cover fitting. Images are stored locally and downscaled to at most 384×512 for fast gameplay. Unanswered slots never reveal a portrait. Missing images retain the silhouette. There are no credit labels on gameplay cards; source metadata lives in the registry and a separate source page.

The photo year may differ from a question's historical roster year. A current jersey never establishes historical team membership. Identity matching uses exact archived handles and upstream-documented handle changes, with explicit local mappings for Dylan/TDylan to DylanCOD and Cells to Mock. Shared generic placeholders and invalid non-image URLs are excluded.

The original five Commons images had CC BY 3.0 evidence. Other source images retain source references and are not asserted to have an open-content license or ownership by Breaking Point. `rightsStatus` records that distinction.

Checks: image decoding, image checksums, player identity lookup, placeholder exclusion, missing-photo fallback, coverage counts, TypeScript and production build. Browser/mobile visual testing is not available in this environment.
