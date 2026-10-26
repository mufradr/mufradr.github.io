# Economic foundation validation — 0.17.0-dev.1

Chunk 2 is implemented locally. The v0.16.0 baseline archive and rollback tag remain intact. This is a development checkpoint; the government, warfare, cities and final historical calibration chunks remain outstanding.

## Automated and long-run checks

- All **158 automated tests passed**; see [tests.log](tests.log). This includes food and fiscal conservation, repair/neglect, legacy migration, save continuation and mobile/desktop inspector checks.
- Three prepared network worlds ran 150 years each with regular integrity checks: [networks.log](networks.log).
- The prepared maritime world ran 300 years, ending with 23 active overseas communities (20 dependent), two independent regions and 124 diasporas: [maritime.log](maritime.log).
- These **750 stress years are prepared scenarios**, not ordinary historical outcomes or evidence of realistic formation dates. No new full historical batch is claimed here.
- A genuine v0.16.0 developed-world payload was also loaded with empty reserves/intact works and continued 40 years to 1480 with 328 states and no integrity issues. New saves require the development engine.

## CPU, save and memory costs

[performance.json](performance.json) retains every trial, timing distribution, save size, reachable-buffer size and source digest. Three trials per model/scenario use separate Node processes, twenty warm-up years and 120 measured years. Old/new trials are adjacent and their order alternates. CPU and browser measurements ran sequentially.

| Prepared scene | Median kernel time, v0.16 → dev | Time increase | Gzip save increase | Final states, old → new |
| --- | ---: | ---: | ---: | ---: |
| early | 2.00 → 2.01 s | 0.58% | 0.23% | 0 → 0 |
| developed | 7.66 → 8.16 s | 6.60% | 2.09% | 305 → 328 |

Both sampled CPU increases are within the provisional 10% allowance. These are short prepared workloads on an AMD EPYC server, not guarantees for a phone or a fully developed historical world. Changed state counts also change the workload. The new persistent arrays allocate 960,000 bytes; three additional reusable scratch arrays allocate 1,920,000 bytes outside saves. Total reachable world-buffer deltas differ slightly in the developed scene because model outcomes differ.

Within each model/scenario all three isolated trials matched both value and exact serialized checkpoint hashes. The prior baseline's intermittent same-process repetition failure remains an open issue and has also appeared in the old v0.16.0 control; this isolated protocol does not resolve or conceal that observation. The original baseline protocol and archive are unchanged.

## Browser scheduling

See [BROWSER.md](BROWSER.md) and [browser.json](browser.json): six eight-second Chromium samples, three layouts, maximum speed. Every case completed with no browser errors or integrity issues. Developed scenes retained long frames; the 390×844 layout recorded p99 frame gaps of 100 ms and two gaps over 100 ms, at 8.69 completed years/s. Layout emulation is not an iPhone/iPad hardware or Safari test. Scheduling and rendering remain work for later integration; this is not a claim of seamless late-game playback.

## Provenance and reproduction

The candidate was measured before its local implementation commit, on top of baseline-tooling commit d8738e3. Consequently its recorded Git commit identifies that parent; **runtime SHA-256 a1f3cd8fe2d1494ffd4bc6b481d1fe873463e80cc408f0e5dc694c2e47b1db43** identifies the actual measured working-tree code. CPU and browser runtime digests were checked against the final implementation before committing. Full per-file hashes are retained in both JSON files.

```sh
git worktree add --detach /tmp/world-engine-economy-v016 baseline/v0.16.0-before-civilization-development
npm run benchmark:economy -- /tmp/world-engine-economy-v016 "$PWD" /tmp/economy-performance.json
npm test
npm run validate:networks
npm run validate:maritime
```

For browser reproduction, create a fresh output directory with a manifest whose `identity.source` is `sourceIdentity()` from `tools/baseline/engine.cjs`, then run `npm run baseline:browser -- --out OUTPUT_DIRECTORY`. The browser runner enforces that manifest's runtime hash. Use a new directory for every measurement.
