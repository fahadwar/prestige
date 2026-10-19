# Daily streak expiry

All six games reconcile browser-local streak statistics when loading and before updating completion statistics. A streak remains active if its last daily completion was today or yesterday in UTC. If a day was missed, the current streak becomes zero; best streak, rounds played, wins and the last-completion date remain intact. A recorded daily loss with zero streak stays zero. The legacy Roster `last` key and the other games' `lastDay` keys both work without a storage migration.

An open page refreshes its streak display at UTC midnight and on focus/visibility changes, including when a suspended tab returns after a missed day. The timer and event listeners are removed on unmount. This updates streak display only; daily-question rollover is separate work. Reads are reconciled again before practice/daily completions, so practice cannot revive an expired saved streak. Loading/returning does not require a new localStorage write.

Guest statistics still use the browser clock and editable local storage; this is not an authoritative ranked ledger. Verification: `node scripts/test-daily-streaks.mjs` covers both storage formats, consecutive/missed days, best/totals preservation, UTC boundaries, timer/focus/visibility behavior and effect cleanup with a mocked browser lifecycle.
