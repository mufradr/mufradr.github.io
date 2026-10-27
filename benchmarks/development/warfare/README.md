# Campaign checkpoint validation — 0.17.0-dev.3

Chunk 4 connects warfare to the shared population, food and government accounts. [WARFARE.md](../../../docs/WARFARE.md) documents formulas, boundaries and limitations. This checkpoint is local; ordinary historical calibration and the v0.17.0 release remain later work.

## Automated checks and long scenarios

The final source passed **191 automated tests**, including mobilization limits, civilian labor, food/fiscal identities, constrained deployment, port throughput, reachable dependency reinforcements, failure/exhaustion, postwar recovery, deaths after annexation, save continuation and desktop/phone inspectors: [tests.log](tests.log). A regression clears the live neighbor maps during a defense test; assistance still uses the completed annual adjacency snapshot, so aid does not depend on border scan order.

The prepared scenario batch passed **990 simulated years**:

- Two 120-year campaign/recovery worlds: [campaigns.log](campaigns.log). The developed fixture injects technology/population/states. During the first sixty years, war frequency is set to 3 and war between surviving Atlantic endpoint governments is renewed if peace ends it; during the final sixty years, all wars end and new wars/raids are disabled. This is deliberately a stress/recovery fixture, not a historical date or natural war-duration sample.
- Three 150-year interacting-system worlds, with periodic integrity checks: [networks.log](networks.log).
- One 300-year maritime development world: [maritime.log](maritime.log). It ends with 16 active communities, 14 dependent communities, one independent region and 133 diaspora records.

| Prepared campaign seed | Committed operations | Sea operations | Ocean operations ≥2,000 km | Mean exhaustion at war checkpoint | Mean exhaustion after peace |
| --- | ---: | ---: | ---: | ---: | ---: |
| campaign-a | 27199 | 9409 | 184 | 35.45% | 1.02% |
| campaign-b | 29469 | 10327 | 122 | 34.74% | 1.06% |

Exhaustion means are unweighted across surviving states, not person-weighted. The wrapper records an operation only when the normal attack function actually commits annual service capacity. Ocean classification uses source-to-target great-circle distance; the sea total also includes shorter coastal operations. The wrapper adds no model RNG draws or forced victories. Military spending, campaign provisions and military deaths are retained in the raw log. Prepared runs must not be pooled with ordinary formation/longevity/discovery statistics.

A genuine dev.2 engine encoded a developed world at 1440. The new engine migrated it with **zero invented existing armies**, then continued forty years to 1480 with 251 states and no integrity issues: [legacy-migration.json](legacy-migration.json). This tests actual old-engine output in addition to the unit migration and exact new-save continuation checks.

## Performance against the government checkpoint

The unchanged paired-process harness uses protocol `economic-foundation-paired-process-v2`: three trials per model/scenario in separate processes, twenty warm-up years and 120 measured years. Before/after pairs are adjacent and their order alternates. Tests, stress scenarios, legacy continuation, CPU timing and browser playback run sequentially in the final verification batch. [performance.json](performance.json) retains every trial, timing distribution, save size and source digest.

| Prepared scene | Median kernel time, dev.2 → dev.3 | Time change | Gzip save change | Final states, dev.2 → dev.3 |
| --- | ---: | ---: | ---: | ---: |
| early | 1.92 → 1.92 s | -0.08% | +0.00% | 0 → 0 |
| developed | 8.09 → 8.18 s | +1.20% | -0.23% | 236 → 281 |

The developed sample adds **1.20%** kernel time relative to dev.2. This incremental sample is below 10%, but cumulative compliance with the original v0.16.0 performance allowance still needs to be assessed at integration. Timing and model workload both vary; changed state/war outcomes mean this is not an isolated function benchmark. It does not establish cumulative cost against v0.16.0 or replace full historical calibration. The gzip size difference is outcome-dependent; the save format is unchanged.

There are **no new saved map grids**. One next-link scratch grid uses 320,000 bytes outside saves; small state/port maps and completed-neighbor sets support bounded bookkeeping. Per-state military objects and casualty records do add ordinary JS/save metadata. Reachable-world-buffer totals exclude private scratch and ordinary JS object memory, so that metric alone is not total memory cost.

All three trials within each model/scenario matched both the value digest and the exact serialized-checkpoint SHA-256. The old intermittent same-process repeat observation remains in the frozen baseline; isolated repetition is not proof that it is resolved.

## Browser playback

All six eight-second Chromium cases completed without browser or integrity errors: [BROWSER.md](BROWSER.md), [browser.json](browser.json). At 390×844, the developed scene completed 9.48 years/s, with p99 frame gaps of 83.3 ms and a maximum gap of 100.0 ms. Eight seconds is insufficient to characterize rare delays. Viewport emulation is not physical iPhone/iPad or Safari performance, and long frames remain an integration concern.

## Provenance and reproduction

The implementation was measured before its local commit, on parent 98a9ee6. Consequently the recorded Git revision identifies that parent; the actual final measured working-tree runtime is SHA-256 **96a3c9a0e830585400ca6ed3118309680a8dee1882eaaa573f3edd8fdb99f10c**. CPU, browser and genuine legacy-continuation digests were verified against the final code. Per-file runtime hashes are retained in the JSON results; [harnesses.json](harnesses.json) records scenario/test/measurement code hashes.

Earlier baseline/economic/government archives are unchanged. The v0.16.0 archive checksum inventory passes, and rollback tag `baseline/v0.16.0-before-civilization-development` still points to 7649533c839bfdc3b01be56be262eba970f026ad.

```sh
git worktree add --detach /tmp/world-engine-government-checkpoint 98a9ee6
npm test
npm run validate:warfare
npm run validate:networks
npm run validate:maritime
npm run benchmark:economy -- /tmp/world-engine-government-checkpoint "$PWD" /tmp/warfare-performance.json
```

For browser reproduction, create a new output directory with a manifest containing `identity.source = sourceIdentity()` from `tools/baseline/engine.cjs`, then run `npm run baseline:browser -- --out OUTPUT_DIRECTORY`. The runner enforces that manifest's runtime hash. Use new output paths for each batch.
