# Government checkpoint validation — 0.17.0-dev.2

Chunk 3 connects provincial authority and dependency obligations to chunk 2's food, infrastructure and fiscal accounting. Rules, thresholds and limitations are in [GOVERNMENT.md](../../../docs/GOVERNMENT.md). This checkpoint remains local; the final historical calibration and v0.17.0 release are outstanding.

## Verification

- A full automated run passed **174 tests**: [tests.log](tests.log).
- Final review corrected the order of the colonial independence decision: read the departing province's allegiance before installing the successor's capital. The final revision then passed **50 targeted tests**, including a new peaceful-versus-contested overseas separation regression, government accounting, dynasty succession, decline/recovery, legacy migration, colonies and desktop/phone inspectors: [targeted-tests.log](targeted-tests.log). These counts overlap; they are not 224 distinct tests.
- The debt-relief regression covers a protector receiving tribute: debt relief must use total fiscal receipts when converting the normalized treasury change. The three long network runs now pass with the corrected accounting.
- Three prepared worlds ran 150 years each with periodic integrity checks: [networks.log](networks.log). They ended with 241, 237 and 247 states. These are stress outcomes, not historical consolidation targets.
- A prepared maritime world ran another 300 years: [maritime.log](maritime.log). At 1800 it had 21 active communities, 18 dependent communities, two independent regions and 117 diaspora records. Across the long scenarios, **750 prepared simulated years passed**.
- A genuine developed save from the economic-checkpoint engine was encoded there, decoded/migrated here at 1440, and continued 40 years to 1480 with 353 states and no integrity issues: [legacy-migration.json](legacy-migration.json).
- Both the v0.16.0 baseline archive and the economic-foundation archive are unchanged. The v0.16.0 checksum inventory verified successfully. The original rollback tag still points to 7649533c839bfdc3b01be56be262eba970f026ad.

No full ordinary historical batch is claimed here. The prepared worlds inject development or maritime capability and must not be pooled with ordinary formation, longevity or discovery-date statistics.

## Performance compared with the economic checkpoint

The existing paired-process harness is reused unchanged: protocol `economic-foundation-paired-process-v2`, three isolated trials per model/scenario, twenty warm-up years and 120 measured years. Adjacent before/after pairs alternate order. CPU work and browser playback run sequentially. [performance.json](performance.json) retains every trial and source digest.

| Prepared scene | Median kernel time, dev.1 → dev.2 | Time change | Gzip save change | Final states, dev.1 → dev.2 |
| --- | ---: | ---: | ---: | ---: |
| early | 2.04 → 2.06 s | +1.24% | -0.000% | 0 → 0 |
| developed | 7.82 → 8.64 s | +10.48% | -0.980% | 328 → 236 |

The developed sample's **10.48% time increase exceeds the provisional 10% allowance**. It is retained as a performance item for final integration, not hidden by retuning or repeated timing until it passes. Simulation outcomes also differ (328 versus 236 states), so this is not a fixed-state microbenchmark or a measurement of government-function overhead alone. It does not establish the cumulative cost relative to v0.16.0. The smaller developed gzip file reflects changed outcomes/records; it is not a save-format compression improvement.

New saved grids allocate 1,280,000 bytes; one scratch visited grid allocates 320,000 bytes outside saves. Reachable-world-buffer totals vary slightly with the model's record and territory outcomes. Within each model/scenario, all three isolated trials matched both the value digest and exact serialized-checkpoint hash. The earlier intermittent same-process repetition anomaly remains documented in the frozen baseline; isolated repetition is not proof that it is resolved.

## Browser scheduling

[Browser results](BROWSER.md) retain six eight-second Chromium samples and [raw metrics](browser.json). All six cases had no browser or integrity errors. Developed playback at 390×844 completed 8.73 years/s with p99 frame gaps of 100.0 ms and 3 gaps over 100 ms. These short windows do not establish rare-delay probabilities. Desktop Chromium viewport emulation is not a physical iPhone, iPad or Safari measurement. Late-game long frames remain an integration issue.

## Provenance and reproduction

Measurements were taken from the implementation working tree before its local commit. The recorded Git parent is ba5b1c0; the actual final measured runtime is identified by SHA-256 **fa5d542af606de78c5705ade29fea44fbb264937fa94ae2aa0fdd89e5a760b79**. CPU and browser digests were verified against the implementation before committing. Each JSON file retains per-file runtime hashes, environment and harness information.

```sh
git worktree add --detach /tmp/world-engine-economic-checkpoint ba5b1c0
npm run benchmark:economy -- /tmp/world-engine-economic-checkpoint "$PWD" /tmp/government-performance.json
npm test
node --test tests/government.test.cjs tests/colonies.test.cjs tests/colonies-browser.test.cjs
npm run validate:networks
npm run validate:maritime
```

For browser reproduction, create a fresh output directory with a manifest containing `identity.source = sourceIdentity()` from `tools/baseline/engine.cjs`, then run `npm run baseline:browser -- --out OUTPUT_DIRECTORY`. The runner enforces that manifest's runtime hash. Use a new output directory for each measurement.
