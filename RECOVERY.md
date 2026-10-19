# PRESTIGE source recovery

Live site: https://games.cdlarabic.com
Sites project: appgprj_6ad306e431548191929da8943192801c
Recovered source: version 32, commit a3ee378655fe2c71bc48ba7400051e211a398147.

The root contains all 490 tracked files from that exact source state. This is a backup snapshot; the existing Sites project remains the production deployment target. This repository does not automatically deploy or sync future edits.

## Restore original Git history

`recovery/prestige-source-v32.bundle` contains all 32 original commits. After cloning this repository, run:

```sh
git clone recovery/prestige-source-v32.bundle ../prestige-restored
```

The restored checkout has the original commit IDs and source history. Keep API keys and environment files out of Git. The Liquipedia API key was not shared or configured when this backup was made. Preserve source notices and each asset's recorded provenance; this snapshot does not grant new rights to third-party data or images.
