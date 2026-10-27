# Cities checkpoint validation — 0.17.0-dev.4

Chunk 5 connects real urban residents and enduring local institutions to food, workforce, government, warfare, contact and identity. [CITIES.md](../../../docs/CITIES.md) documents rules, limits, save migration and inspectors. This checkpoint remains local; final historical calibration and publication follow at integration.

## Automated and prepared checks

The final source passed **214 automated tests**: [tests.log](tests.log). Coverage includes real urban versus province population, food/security/works/commerce, shock and recovery, shared urban/military labor, civic capacity, non-capital scholarly invention, stateless prerequisites, preserved knowledge after collapse, decaying abandoned archives, conserved migration headcounts, fixed faith slots, minority-only groups, gradual conversion, cultural contact, old saves, exact continuation and desktop/390px inspectors.

A separate 260-year ordinary-start regression now checks the early browser seed at twenty-year boundaries; it is a short validity run, not a full historical calibration. The initial browser failure and its pre-fix measurements are retained in [OBSERVATION.md](OBSERVATION.md).

The prepared batch passed **1,230 simulated years**, separately from the paired CPU workloads:

- Two 120-year urban/collapse/recovery worlds: [urban.log](urban.log). Both start from the developed fixture, then use explicit RNG seeds urban-a/urban-b. They inject a mature town, remove its current government after forty years, reduce province population by 60%, damage works and portable-record practice, then introduce a successor and restore works/records forty years later. They check that the same town survives as a place, its residents respond to the shock, knowledge persists in local institutions and all completed checkpoints remain valid. Restored works/records are a prepared intervention, not proof of spontaneous economic recovery.
- Two 120-year campaign/recovery worlds: [campaigns.log](campaigns.log).
- Three 150-year interacting-system worlds: [networks.log](networks.log).
- One 300-year maritime world: [maritime.log](maritime.log).

These fixtures inject technology, states/population and selected shocks. They are not ordinary historical runs and must not be pooled with historical formation, longevity, decline or urbanization statistics. Focused tests separately control urban growth/decline/recovery conditions.

| Urban seed / phase | Urban / province residents | Urban share | Civic institutions | Scholarship | Local records / archived records |
| --- | ---: | ---: | ---: | ---: | ---: |
| urban-a: before collapse | 23,929 / 141,619 | 16.90% | 78.53% | 78.21% | 100.00% / 82.60% |
| urban-a: first shock year | 9,267 / 57,001 | 16.26% | 77.68% | 77.12% | 2.00% / 82.60% |
| urban-a: before successor | 8,457 / 72,676 | 11.64% | 56.29% | 51.16% | 84.43% / 73.79% |
| urban-a: after recovery phase | 17,184 / 92,043 | 18.67% | 76.10% | 71.28% | 100.00% / 94.00% |
| urban-b: before collapse | 19,051 / 116,370 | 16.37% | 77.22% | 76.75% | 100.00% / 82.38% |
| urban-b: first shock year | 7,380 / 46,827 | 15.76% | 76.39% | 75.69% | 2.00% / 82.38% |
| urban-b: before successor | 9,067 / 61,866 | 14.66% | 65.25% | 61.01% | 84.80% / 74.31% |
| urban-b: after recovery phase | 16,620 / 81,946 | 20.28% | 80.23% | 76.43% | 100.00% / 94.85% |

A genuine dev.3 engine wrote a developed world at 1440. The new engine migrated **1277 existing city records** to labelled estimates without inventing archives or faith minorities, then continued forty years to 1480 with 271 states and no integrity issues: [legacy-migration.json](legacy-migration.json). Site names/founding dates and the separately retained old province peaks were checked against actual old-engine output.

## Performance against the warfare checkpoint

The unchanged paired-process harness uses protocol economic-foundation-paired-process-v2: three trials per model/scenario, separate processes, twenty warm-up and 120 measured years. Adjacent before/after pairs alternate order. Tests, prepared scenarios, legacy continuation, CPU timing and browser playback ran sequentially. [performance.json](performance.json) retains all samples, source digests, state counts, slice/year distributions and raw/compressed save sizes.

| Prepared scene | Median kernel time, dev.3 → dev.4 | Time change | Gzip save change | Final states, dev.3 → dev.4 |
| --- | ---: | ---: | ---: | ---: |
| early | 1.96 → 2.09 s | +6.36% | +0.05% | 0 → 0 |
| developed | 8.76 → 10.86 s | +24.00% | +16.58% | 281 → 283 |

The developed-scene CPU and save increases remain explicit integration concerns; this checkpoint does not claim performance parity. These are incremental workload measurements against dev.3. Changed political/demographic outcomes alter the amount of work, so timing differences do not isolate individual functions. They do not establish cumulative compliance with the original v0.16.0 allowance or calibrated historical realism; the final integration batch must assess both.

Four fixed religious-demographic arrays add **1,280,000 persistent bytes** before compression; optional city archives and records add bounded per-site metadata. Production and civic aggregation reuse existing scans; annual urban updates visit records, archives run every five years and site discovery every ten. Holy sites use a single index, without an all-pairs city/religion scan.

| Prepared scene | Reachable buffer delta | Raw save, dev.3 → dev.4 MiB | Gzip save, dev.3 → dev.4 MiB |
| --- | ---: | ---: | ---: |
| early | 1,280,008 bytes | 42.63 → 42.63 | 7.21 → 7.22 |
| developed | 2,469,600 bytes | 61.14 → 65.05 | 9.81 → 11.43 |

Reachable buffers are not total process/device memory; they exclude ordinary JS objects and private scratch. Compressed size is also outcome-dependent. Every isolated trial matched its model/scenario value digest. Exact checkpoint repetition flags are retained in the JSON; this does not resolve the old same-process baseline observation.

## Browser playback

All six eight-second Chromium cases completed without browser or integrity errors: [BROWSER.md](BROWSER.md), [browser.json](browser.json). The 390×844 developed scene completed 8.50 years/s, with p99 frame gaps of 83.4 ms and maximum 133.3 ms. Short windows cannot characterize rare delays. Desktop viewport emulation is not actual iPhone/iPad hardware or Safari; long frames remain an integration concern.

## Provenance and reproduction

Measurements were made before the local commit, on parent 4009d5b. Their Git revision identifies that parent; the final measured working-tree runtime is SHA-256 **6d097fc384c19f6ccd6a5c371464e4b2635fd87fd154e0919f55a635013d89f4**. Manifest, CPU, browser and genuine migration runtime hashes agree. Per-file runtime hashes and [harnesses.json](harnesses.json) make the observations reviewable. The protocol and all earlier archives are unchanged; the v0.16 checksum inventory passes and its annotated rollback tag still points to 7649533c839bfdc3b01be56be262eba970f026ad.

```sh
git worktree add --detach /tmp/world-engine-warfare-checkpoint 4009d5b
npm test
npm run validate:cities
npm run validate:warfare
npm run validate:networks
npm run validate:maritime
node tools/cities-migration.cjs /tmp/world-engine-warfare-checkpoint /tmp/cities-legacy.json
npm run benchmark:economy -- /tmp/world-engine-warfare-checkpoint "$PWD" /tmp/cities-performance.json
```

For browser reproduction, create a fresh output directory and manifest with identity.source = sourceIdentity() from tools/baseline/engine.cjs; then run npm run baseline:browser -- --out OUTPUT_DIRECTORY. The runner requires matching runtime hashes. Use new output paths for repeat measurements.
