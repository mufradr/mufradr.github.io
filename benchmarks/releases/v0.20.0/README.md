# World Engine v0.20.0 — Release validation

This release integrates conserved food and budgets, gradual government decline/recovery, dependencies, sustainable campaigns, real urban residents, local institutions and bounded cultural/religious change. The [release guide](../../../docs/RELEASE_v0.20.0.md) explains behavior and corrections. This report separates outcomes from performance; it does not claim calibrated history or that every performance target was met.

## Validation

- **219 automated tests passed**, including save slots/autosaves/import/export, invalid files, pending-year loading, generated/imported maps, government/tribute, workforce and casualty accounting, urban/knowledge interactions, desktop/phone inspectors and exact reference-loop comparisons: [tests.log](tests.log).
- **43,200 ordinary simulated years:** three unchanged Earth seeds (development-01 through -03), plus the original generated-world case, each -9000 to 1800. Every scheduled 250-year integrity check and final encoding passed. The original observer/protocol/horizons remain unchanged. [HISTORY.md](HISTORY.md) presents the results without large downloads; compressed files preserve all observations.
- An **independent 10,800-year replay** of development-03 matched its original final serialized checkpoint SHA-256. Its actual late-game save loaded and re-encoded identically; twenty further years retained exact values, typed-array bytes and RNG: [late-save.json](late-save.json). This replay is reproducibility evidence, not a fourth independent Earth seed.
- **1,230 prepared interaction years:** two urban/collapse/recovery worlds (240), two campaign/recovery worlds (240), three network worlds (450) and one maritime world (300). Logs are urban.log, campaigns.log, networks.log and maritime.log. These inject populations, knowledge and selected shocks; they are not ordinary historical outcomes.
- Genuine output from **v0.13.0, v0.16.0 and dev.1–dev.4** loaded and continued forty years per version, with exact-value/RNG continuation checks: [legacy.json](legacy.json). Mutable technique aliases remain validated. Raw encodings after subsequent entity creation can differ through immutable static-metadata sharing; both comparisons are recorded.
- All **twelve serial browser playback cases** (six per engine) passed browser/integrity checks at desktop, tablet and phone viewports. Separate automated checks cover actual interactions, saving and relative Pages URLs.

Earlier intermittent cross-implementation comparison differences and the dev.4 defense-lock pilot are retained in [OBSERVATIONS.md](OBSERVATIONS.md). Later passes are not presented as proof that the original baseline's same-process anomaly is resolved.

## Ordinary historical outcomes versus v0.16.0

| Earth seed | Settled owners, old → new | Population millions, old → new | First empire, old → new | Half-area declines, new sudden / gradual |
| --- | ---: | ---: | --- | ---: |
| development-01 | 385 → 969 | 646.3 → 993.1 | 2,083 BCE → 1,678 BCE | 1 / 5 |
| development-02 | 445 → 1107 | 845.0 → 861.4 | 2,379 BCE → 1,187 BCE | 0 / 8 |
| development-03 | 424 → 910 | 811.0 → 772.3 | 1,880 BCE → 1,678 BCE | 3 / 9 |

Under the unchanged diagnostic, the three baseline worlds had **300 sudden / 57 gradual** first declines among 576 eligible major states. The release has **4 sudden / 22 gradual**, with only 26 observed declines among 227 eligible states; 201 have not crossed half-area by the horizon. Thus the observed mix is much more gradual, **but overall turnover is also substantially lower**. Events within a world are correlated; these are three independent histories, not hundreds of independent experiments. State replacement can register decline while residents/institutions continue.

Completed state-identity lifetime medians for ever-empires are 2,043 / 2,708 / 2,111 years, versus 1,001 / 888 / 1,190 in the baseline. Completed years after first empire classification are 464 / 740 / 437, versus 580 / 632 / 581. The distinction matters: a long pre-imperial identity is not a continuously imperial regime. Ongoing identities are censored and excluded from those medians. Numerous long-lived states remain a calibration concern.

Kingdom classifications still arrive implausibly early (5,963 BCE, 6,213 BCE, 5,765 BCE). Their population/territory thresholds can describe large chiefdoms before an archaeological kingdom; no date gate was added to hide that weakness. Earliest empire classifications are later, but that alone does not establish realism.

The dev.4 pilot had 1,718 settled owners and no eligible half-area declines in development-01. The supplied-force regression and full release runs address its defensive lock; several integration changes also alter RNG trajectories, so pilot/release differences are not isolated causal estimates of one coefficient.

### Regional consolidation

Means below are unweighted across the same three Earth worlds, at 1800. Direct owners include clients/vassals; tributary blocs are separate. Geographic boxes overlap and are not summed. [HISTORY.md](HISTORY.md) preserves each seed and earlier snapshots.

| Region | Owners, old → new | Largest bloc share, old → new | Population millions, old → new |
| --- | ---: | ---: | ---: |
| Fertile Crescent | 8.0 → 10.3 | 38.3% → 35.2% | 7.5 → 9.0 |
| Europe | 15.0 → 29.3 | 25.9% → 19.4% | 77.8 → 75.3 |
| India | 12.3 → 22.7 | 32.8% → 35.6% | 33.9 → 43.5 |
| China | 19.0 → 22.0 | 52.5% → 27.2% | 44.4 → 53.8 |
| Mesoamerica | 23.0 → 37.7 | 40.3% → 14.1% | 6.6 → 6.0 |
| Andes | 25.7 → 32.0 | 7.5% → 9.4% | 5.2 → 6.7 |
| West Africa | 25.7 → 151.7 | 33.3% → 18.1% | 46.9 → 43.4 |
| Congo basin | 37.0 → 143.0 | 32.8% → 15.8% | 43.2 → 34.6 |
| East Africa | 25.7 → 55.7 | 30.3% → 16.1% | 53.7 → 54.7 |
| Australia | 7.3 → 26.7 | 22.6% → 20.9% | 8.3 → 24.6 |

The rules do not select winners by country or region. Remaining gaps include fragmented Andean development, high tropical/Australian populations and many local governments, and seed-dependent consolidation in the Fertile Crescent, India and China. Generic crop knowledge and coarse ecological suitability do not reconstruct regional domestication or all transport/disease constraints. These measurements justify more calibration; they do not justify a hard-coded regional penalty. Total world population stays bounded by the economic/ecological model, but that is not evidence that every region is realistic.

Ocean-going knowledge first appears in 803–836 CE and first recorded community foundings in 825–1130 CE. These include local/coastal expansion, not necessarily an Atlantic crossing. The release records 36–50 foundings and 5–10 independent-region IDs in the Earth runs. Prepared campaigns additionally verify actual ocean operations over 2,000 km. Colonial administration and cultural exchange work, but natural discovery/settlement chronology still needs wider calibration.

## Isolated performance against the pinned v0.16 engine

The unchanged paired-process harness alternates adjacent before/after pairs: three isolated trials per model/scene, twenty warm-up years and 120 measured years. No history, scenario, test or browser jobs run alongside these timings. All repeated values and serialized checkpoints match within each model/scene. This is the same initial prepared input, with evolving outcomes; final state counts show the workload difference. [performance.json](performance.json) retains distributions, sources, save sizes and slice tails.

| Scene | Median kernel seconds, old → new | CPU-time change | Kernel years/s, old → new | Final alive records, old → new | Gzip save change |
| --- | ---: | ---: | ---: | ---: | ---: |
| early | 2.04 → 1.59 | -22.4% | 58.70 → 75.65 | 0 → 0 | +0.3% |
| developed | 8.98 → 10.15 | +13.0% | 13.36 → 11.83 | 305 → 273 | +18.0% |

The developed sample costs **+13.0%** CPU time. It **misses the roughly 10% aim**; this release does not claim that target was met. Stable-array caching passes exact regression comparisons and improves the early workload, but government, economic and urban accounting still have a cost. A low-driver secondary sample gives -7.1%, yet its final state counts differ (423 versus 274); it is **not** proof of equal-topology overhead or compliance. Failed attempts to freeze topology are retained and excluded, rather than used to select a favorable timing.

Historical kernel times are retained for transparency but excluded from the performance claim because outcome runs were concurrent. Save differences also reflect different histories; they are not a codec speed claim.

### Memory and saves

| Prepared scene | Reachable saved-buffer delta | Raw save MiB, old → new | Gzip save MiB, old → new |
| --- | ---: | ---: | ---: |
| early | 3,520,008 bytes | 42.0 → 42.6 | 7.2 → 7.2 |
| developed | 4,648,680 bytes | 59.5 → 64.9 | 9.7 → 11.5 |

The three full Earth saves compress to **24.2–24.9 MiB**, versus 23.4–25.5 in the baseline; raw sizes are 125–129 MiB. New fixed grids add 3,520,000 persistent bytes, plus bounded per-city archives/metadata. Private transport/government/military scratch and ordinary JS objects are not included in reachable saved-buffer totals. No histories or terrain resolution were removed.

Full-history Node peak RSS is about **1.29–1.32 GiB**, including the runner, observer and save encoding. RSS before final save is already roughly 930–948 MiB; sampled managed heap is 389–620 MiB. Original baseline peak RSS was about 1.10–1.34 GiB. These are not browser/device requirements or a guarantee against iOS memory limits. Saving still clones live data in the browser before worker encoding. Resources/initial-save and paused render measurements are preserved in resources.log and render.log.

### Browser playback and long delays

Both versions use the same Chromium runner, eight-second windows, maximum playback, political map, default detail limits, no autosave/event slowdown, and local/fallback fonts. Viewports emulate layout, not physical iPhone/iPad hardware or Safari.

| Developed viewport | Years/s, old → new | Frame-gap p99 ms, old → new | Maximum gap ms, old → new | Managed heap MiB, old → new |
| --- | ---: | ---: | ---: | ---: |
| 1280×900 | 9.05 → 9.60 | 83.4 → 66.6 | 100.0 → 66.7 | 119.8 → 134.2 |
| 820×1180 | 6.06 → 7.37 | 133.3 → 100.0 | 150.1 → 133.4 | 119.0 → 129.7 |
| 390×844 | 7.98 → 7.97 | 133.3 → 100.0 | 183.3 → 133.4 | 107.8 → 147.3 |

Playback remains usable in these samples and long-delay counts are retained, but gaps above 100 ms still occur and managed heap is higher. Short samples and differing evolved worlds do not establish a stable device speedup. See [BROWSER.md](BROWSER.md), [BASELINE_BROWSER.md](BASELINE_BROWSER.md) and both raw JSON files.

## Provenance, reproduction and rollback

All release-engine results match working-tree runtime SHA-256 **a38acc537ec3b39055ace1186acda61ae7bd01d20cc63347c9780e10d8734529**. They were measured before the release commit, on parent f6a60c7; that Git revision is not presented as the release itself. The manifest stores per-file runtime hashes; harnesses.json records the reproduction tools. The original protocol, v0.16 archive and development checkpoint archives remain unchanged.

```sh
# Worktrees at published/development commits are needed for genuine legacy checks.
node tools/release/histories.cjs "$PWD" /tmp/release-histories
npm test
node tools/release/legacy.cjs /tmp/legacy.json
npm run validate:cities
npm run validate:warfare
npm run validate:networks
npm run validate:maritime
node tools/release/late-save.cjs /tmp/release-histories/earth-development-03.json.gz /tmp/late.json
# Run CPU/browser cases only after other simulation jobs have finished.
node tools/economy-performance.cjs /tmp/world-engine-economy-v016 "$PWD" /tmp/performance.json
node tools/release/quiet-performance.cjs /tmp/world-engine-economy-v016 /tmp/quiet.json
node tools/baseline/browser.cjs --out /tmp/release-histories
```

Use new output paths. The browser runner requires the matching manifest. Historical orchestration records concurrency and excludes its timings; observer-purity tests and the byte-identical independent replay support outcome reproducibility. Review OBSERVATIONS.md when interpreting implementation comparisons.

The rollback tree is **v0.16.0**, commit **7649533c839bfdc3b01be56be262eba970f026ad**, also preserved by baseline/v0.16.0-before-civilization-development. Restoring it in a new commit avoids rewriting main. Keep original exported saves: older clients cannot interpret v0.20 progress.
