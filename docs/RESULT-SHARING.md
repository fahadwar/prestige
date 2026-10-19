# Roster result sharing

The completed roster game's share action opens an accessible native dialog with a 1200×840 PNG preview. It draws the Prestige wordmark, Arabic labels/score/date, four or five player portraits and found/revealed states. A toggle hides names, portraits, team and season. Player handles retain their real spelling.

The share caption is Arabic and does not expose the team or answer list. Supported devices can send the PNG and caption through the native share sheet. A separate X web-intent link downloads the PNG and opens a composer with the Arabic caption. Users must attach that downloaded image themselves in the browser composer; the intent cannot attach a local file. No automatic posting, X account integration, image hosting or access-policy changes are introduced.

Canvas images come from same-origin local assets, with bounded image loading and missing-image fallback. Object URLs are revoked on close/toggle/unmount. Native share is invoked directly from a user click after the file is prepared; cancellation does not report a post as sent. Mobile layouts retain scrollable dialog content and native focus trapping/Escape handling.

`node scripts/test-roster-sharing.mjs` covers Arabic copy, URL encoding, aliases, four/five-player drawing contracts and hidden-answer privacy using a mocked canvas. These checks do not establish actual browser rendering or external app behavior. Browser visual QA and live X/native sharing are unverified.

## All-game wiring

All six game pages now open the same result-sharing dialog. Roster retains its existing card renderer. Guess Player cards show attempts and the revealed player; Missing Player shows the completed lineup; Connections preserves the four groups in a 16-player layout; Ranking shows the submitted order and correct-position flags; Time Machine shows the roster and revealed season. Every card has a spoiler toggle.

`/api/share/result` accepts the game discriminator and validates completed submissions through that game's original engine. Existing `/api/share/roster` URLs remain supported. Social metadata uses the right game title and CTA; Connections supports 1200×1200 artwork. Content-derived IDs include canonical metadata as well as PNG bytes. Public access remains unchanged.

Additional checks: `scripts/test-result-cards.mjs` covers all five newly wired pages and 25 layout/privacy contracts; `scripts/test-social-links.mjs` covers all six backend validators and game-specific metadata. These are mocked canvas/storage tests, not browser or external platform verification.
