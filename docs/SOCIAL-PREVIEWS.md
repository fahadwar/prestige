# Per-result social link previews

Roster sharing now uploads the prepared 1200×840 PNG to the Site's R2 binding and creates a stable `/share/<id>` link. The response is raw server HTML with `og:image`, `twitter:card=summary_large_image`, image dimensions, Arabic title/description and a canonical URL. `/share/<id>/image` returns the stored PNG directly. No client JavaScript or browser-local blob URLs are needed by crawlers.

The create endpoint requires same-origin POSTs, bounds the streamed request and PNG, verifies the PNG signature/IHDR dimensions and validates game completion/scoring against the original server engine. Content-derived opaque IDs deduplicate identical image uploads. Response HTML escapes metadata; images use nosniff and explicit MIME types. Result URLs are guest share artifacts, not ranked records. Original answer visibility in the PNG follows the user's preview toggle. The page description does not reveal the team or answer list.

The hosting manifest provisions `BUCKET` through Sites. Existing access policy is deliberately unchanged: while owner-only, X and other anonymous crawlers cannot fetch these pages or images. Public visibility requires the owner's approval. X ultimately decides whether/when to show a card; neither a build nor unit tests demonstrate its crawler behavior.

`node scripts/test-social-links.mjs` tests raw metadata, stored image reads, completion/score validation, origin/size checks, escaping and deduplication with an in-memory bucket. `scripts/test-roster-sharing.mjs` checks Arabic copy and canvas contracts. Live X rendering and browser UI remain unverified.

## Public page metadata repair — 2026-10-18

The site is now public at `https://games.cdlarabic.com`. The homepage and all six game routes have explicit server metadata: `twitter:card=summary_large_image`, title/description/image/alt, Open Graph fields and canonical HTTPS URLs. Each route has a versioned real PNG asset at 1200×630, below 1MB. Default favicon/logo images are not used as social preview substitutes.

`lib/seo/social-pages.json` owns page copy; `lib/seo/metadata.ts` maps it to server layout metadata. `scripts/generate-social-images.mjs` creates the static branded images from existing approved assets; it uses the managed checkout's Sharp package, not a runtime image service. Change image filenames when revising artwork so crawlers do not reuse old image caches.

New result uploads use a 1200×630 uncropped landscape preview, while full-size PNG downloads remain unchanged. Existing result images at 840/1200px height continue to work.

Verification: `node scripts/test-social-metadata.mjs`, `node scripts/test-social-links.mjs`, TypeScript and production build. After publishing, run `node scripts/check-live-social.mjs`; it anonymously requests every page as Twitterbot, parses only the raw HTML head, and fetches each image to validate HTTP status/MIME/PNG dimensions. These HTTP checks do not guarantee that X or an external checker immediately clears a previously cached card.

Live verification completed after publication: all seven page HTML heads expose the expected Twitter/Open Graph fields to an anonymous `Twitterbot` request; all seven image URLs return HTTP 200 `image/png` at 1200×630. A real completed practice result was uploaded through `/api/share/result`, then its public share page and stored image were fetched anonymously: large-image tags and the PNG MIME/dimensions passed. No X post was published and X's own cache/rendering was not claimed as tested. The live checker normalizes the equivalent root URLs with/without a trailing slash.
