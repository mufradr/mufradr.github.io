# Civilization-development baseline: v0.16.0

This document records the completed measurement-only chunk. That chunk left the
app, simulation rules, rendering, version and save formats unchanged. Subsequent
implementation is documented separately in [ECONOMY.md](ECONOMY.md). The rollback point is the local
annotated tag `baseline/v0.16.0-before-civilization-development`, pointing to
`7649533c839bfdc3b01be56be262eba970f026ad` (also released as `v0.16.0`).

Read the [historical/stress results](../benchmarks/baselines/v0.16.0/REPORT.md),
[historical detail](../benchmarks/baselines/v0.16.0/HISTORY.md)
and [browser results](../benchmarks/baselines/v0.16.0/BROWSER.md) directly in the
repository; no large world downloads are needed on a phone. Exact machine-readable
results, including per-state observations, are retained beside those reports.
[Initial findings and open questions](../benchmarks/baselines/v0.16.0/NOTES.md)
summarize what the first sample suggests.

## Reproduce or expand the measurement

Node.js 24 is used for the CPU runner. Playwright and Chromium are needed only
for browser measurements. The initial batch runs serially, each scenario in a
fresh child process; do not run CPU and browser benchmarks concurrently. Do not
edit the runtime or measurement harness while a batch is running.

```sh
npm run baseline:run -- --out /tmp/baseline-current
npm run baseline:browser -- --out /tmp/baseline-current
node tools/baseline/report.cjs /tmp/baseline-current
node tools/baseline/audit.cjs /tmp/baseline-current
```

The default batch is three ordinary Earth histories (`development-01` through
`development-03`), one ordinary generated-world history, two prepared CPU stress
fixtures with three repetitions each, and one prepared 300-year maritime run.
Ordinary histories run from internal year -9000 to 1800: 10,800 simulated years.
`tools/baseline/protocol.json` fixes the expanded ten-seed Earth set, all thresholds,
region boxes, horizons, sample intervals and browser viewports. A generated world
uses terrain seed `development-generated-world-01`; historical seed and climate/
rule settings are also recorded. Geographic region labels apply only to Earth.

Run `--runs all` to include all ten Earth seeds, or select IDs explicitly:

```sh
npm run baseline:run -- --runs earth-development-04,earth-development-05 --out /tmp/baseline-expanded
```

`--resume` skips completed run files only when the source revision, runtime file
hashes, measurement code, protocol and requested horizon all match the manifest.
Each completed result is written atomically, followed by refreshed summary files.
The archive audit verifies source provenance, coverage, integrity/save success and
browser results, then writes `FILES.sha256` for later checksum verification.
An interrupted scenario is rerun from its seed; it is not resumed mid-simulation.
For a tool smoke test, `--runs earth-development-01 --end-year -8995` truncates
one ordinary history. Such output
records its actual horizon and cannot be compared with a full-length run.

To keep using the original engine after implementation starts, create an isolated
checkout and run the **same current measurement harness** against it:

```sh
git worktree add --detach /tmp/world-engine-v016 baseline/v0.16.0-before-civilization-development
node tools/baseline/run.cjs --engine-root /tmp/world-engine-v016 --out /tmp/baseline-old
node tools/baseline/browser.cjs --engine-root /tmp/world-engine-v016 --out /tmp/baseline-old
node tools/baseline/run.cjs --out /tmp/baseline-new
node tools/baseline/browser.cjs --out /tmp/baseline-new
node tools/baseline/compare.cjs /tmp/baseline-old /tmp/baseline-new
```

The loader follows the simulation scripts in `index.html` order and excludes the
known DOM/storage interface scripts. Future module extraction must keep that
distinction valid. Each manifest records the source commit, SHA-256 hashes of
runtime files, Node version, CPU, and the measurement-code hash. Comparison rejects
different metric definitions, harnesses or horizons, and flags environment changes.
The 10% CPU allowance is provisional, not a claim that a future model will meet it.
Changed state/war counts can change the workload even with identical starting setups.

## Ordinary histories versus prepared scenes

**Historical Earth:** default parameters, fitted Earth climate, historical hearth
schedule, named history seed, no injected population, technology, routes or states.
This measures emergent dates and outcomes without forcing historical winners.

**Ordinary generated world:** default generated terrain and settlement/hearth
behavior. It checks generality; it is not another sample of Earth history.

**Prepared early/developed CPU scenes:** match the existing performance benchmark
setup. Both warm up twenty years and measure 120 years, three times. The developed
scene starts at 1400 with extensive technology, population, and a grid of states.
Fresh engines must produce identical final checkpoint hashes across repetitions.

**Prepared maritime scene:** matches the established Atlantic test: capable ports,
a known route, and a 1500 start. War and crisis rates are disabled. It measures
settlement, growth and independence potential, not the natural discovery date.
Stress figures must never be pooled with historical formation or longevity results.

## What the metrics mean

- **State formation:** first observed organized state, kingdom/khanate-or-higher,
  and empire/khaganate classifications. Annual ownership comes from the province
  grid; titles come from the engine's most recent political aggregation. A new
  state's title can lag its latest ownership by a completed year.
- **Regional consolidation:** every 250 years and at the endpoint, total
  population, number of direct owners, governed population fraction, largest
  direct-owner share and largest tributary-bloc share. These are population
  shares, not fraction of pixels. Chiefdoms and nomads can be direct owners.
  Boxes are approximate and can overlap; they must not be summed globally.
- **Empire longevity:** states ever observed as Empire/Khaganate, completed
  lifetimes measured from first ownership observation, and completed years since
  first empire classification. Still-existing states are reported separately as
  right-censored, never counted as completed deaths. State records retain first/
  last ownership, engine birth year, peaks, empire sample counts and any ownership
  gaps. This measures formal state identity, not uninterrupted civilization.
- **Major decline:** eligibility requires at least 40 owned cells and one million
  residents **at the same observation**, while classified as a settled state.
  Record the first later loss to half its observed peak area, including extinction.
  The decline is "sudden" when it reaches half within five years of its last
  observation at or above 80% of the then-current peak; otherwise it is "gradual".
  Count at most one episode per state. Eligible states that do not cross half by
  the horizon are reported separately. These thresholds are diagnostic choices,
  not a scientific definition of imperial collapse. Succession that replaces a
  state ID can register as sudden decline despite continuity of population and
  institutions. The baseline does not infer civilization death from an ID change;
  replay the pinned source/seed when a lineage interpretation is needed. Submission
  as a vassal without territorial loss is not a half-area decline in this measure.
- **Overseas development:** first ocean-going knowledge, first founding, first
  recorded colonial independence, unique observed foundings, current community
  and dependency counts, independent successor IDs, routes, diaspora records,
  and community population. Failed records can be reused by the engine; unique
  founding keys preserve earlier observations. Annual sampling can miss an event
  created and removed entirely inside one year.
- **CPU:** distributions of time inside the simulation generator, complete-year
  kernel totals, p95/p99/max slices and counts above 16/50 ms. Observation and
  diagnostics run outside those timed sections. Kernel wall timings still include
  host scheduling and garbage collection; several repetitions are necessary.
  Generator slices are not browser frames. Total loop wall time and measurement
  overhead are stored separately.
- **Memory:** sampled Node RSS, managed heap, external/ArrayBuffer allocation and
  process peak RSS, plus final reachable saved-world buffers counted once despite
  aliases and subarray views. Peak RSS includes the runner, metrics, buffers and
  saving; reachable buffers omit JavaScript-object overhead and private scratch
  grids. Repeated stress engines can await garbage collection. Neither measure
  is a prediction of Safari/device memory.
- **Save size:** exact binary graph bytes and Node gzip level-6 bytes, encoding/
  compression time, and normalized checkpoint SHA-256. The timestamp is fixed
  **in the detached save envelope**, not in the running world. No full world files
  are committed. Compression samples occur before and after the measured run;
  they are not IndexedDB latency or browser-worker timing. Save failures remain
  visible as errors in the measurements rather than being silently discarded.
- **Browser delays:** actual animation-frame intervals, gaps above 50/100 ms,
  Long Tasks, playback years/s, page errors, and managed JS heap. Desktop, 820 px
  tablet and 390 px phone layouts run in desktop headless Chromium without CPU
  throttling. Maximum playback, political view, default map detail, and disabled
  autosave/event slowdown keep the configuration stable. A partially started
  year is excluded from throughput and drained outside the measured window before
  integrity checks. These short samples do not establish physical iPhone/iPad
  performance, Safari behavior or rare worst-case delays.

Supplementary `render-stress.json` and `resources.json` preserve the existing
paused render-stress and static-resource/initial-save benchmarks, run serially
after playback measurements. They are diagnostics, separate from the fixed-protocol
historical outcomes and kernel timings. Reproduce them with
`node tests/render-performance-benchmark.cjs` and `node tests/size-benchmark.cjs`.
The render scene injects 1,200 routes and thousands of cities; it is not a normal
historical world.

Dates in JSON are the engine's numeric calendar. Its UI displays year 0 as 1 BCE
and year -9000 as 9001 BCE. An absent event is `null`, not year zero.

## Interpretation and validation

The initial batch is a reference sample, not sufficient historical calibration.
Expand the fixed seed set before drawing conclusions about regional success
rates. Structural tests and prepared stress worlds establish consistency and
exercise mechanics; they do not establish realistic history.

The first developed-stress attempt failed its strict repeated-checkpoint hash
assertion despite matching final state counts and clean sampled integrity checks.
The differing hashes were not logged by that attempt, so its cause is unresolved.
A diagnostic repetition matched all three checkpoint hashes; its timings are not
included. The unchanged original runner was rerun for the accepted measurements.
The [original failure observation](../benchmarks/baselines/v0.16.0/repeat-check-observation.txt)
is retained. Do not interpret a passing rerun as proof that v0.16.0 is always
bit-for-bit reproducible under every execution condition.

The completed baseline chunk passed all **144 automated tests**. The
[validation record](../benchmarks/baselines/v0.16.0/VALIDATION.md) and full test
output are preserved with the results.

The measurement tests cover empty distributions, tail delays, censored lifetimes,
abrupt/gradual/extinction cases, simultaneous eligibility, tributary aggregation,
buffer aliases, incompatible comparisons, and observer purity. The purity test
compares every encoded checkpoint byte and RNG state after observed and unobserved
engines follow the same seed. No measurement arrays are attached to saved state.

## Planned implementation chunks

1. **Baseline (this chunk).** Preserve v0.16.0; tools, initial results and plan.
2. **Economic foundation.** Separate production, consumption, transport and reserves;
   introduce conserved stores, spoilage, bounded capacity, and infrastructure
   upkeep/repair tied to a consistent government budget. Do not treat the existing
   carrying-capacity number as a literal warehouse of grain.
3. **Government and dependencies.** Shared provincial control and autonomy, actual
   tribute transfers, withheld payments, protection obligations, recovery and
   gradual separation. Preserve exceptional sudden collapse and distinguish a
   dynasty changing from the destruction of its society.
4. **Campaign sustainability.** Bounded state/regional mobilization, supply,
   exhaustion, casualties and recovery using the same population and fiscal
   resources. Avoid double-charging losses and avoid individual unit simulation.
5. **Cities and knowledge.** Urban shares supported by food, trade and security;
   centres of administration and learning; knowledge preservation across regime
   changes; focused cultural/religious integration without unbounded mixtures.
6. **Integration and release.** Compare the same seed set and fixtures against
   v0.16.0, investigate outcomes and measured regressions, test old-save migration
   and mobile flows, publish honest limitations, then release v0.17.0 only after
   the final commit/push instruction.

Each implementation chunk should have its own reversible local commit. Update
documentation and tests as work proceeds. Keep the existing app release number
and cache strings at 0.16.0 during this measurement-only chunk. Reuse shared map
passes and regional/state aggregates, cache connectivity until relevant changes,
and stagger slow processes with elapsed-time-correct rates. Check conservation,
bounded cost, recovery and old-save compatibility at each stage.
