# v0.14.0: performance, save growth and state formation

The v0.13 save limits protected browser memory: 128 MiB file, 256 MiB expanded,
32 MiB metadata and one million graph nodes. A late world could hit the metadata
or node limit before compression, even with a small eventual file. This is a
format/storage bound, separate from IndexedDB quota. A user's particular failed
world was not supplied, so its exact limiting component cannot be identified.

## Save format and measurements

Schema 3 interns repeated property layouts and packs numeric arrays of at least
32 elements into exact-width integer or Float64 blocks. Byte planes improve gzip
compression without losing any bits. Loading restores histories as normal arrays,
including shared references. No archives, chronicles, extinct states or peak maps
are discarded. Graph schemas 1/2 and validated v0.13.0 saves remain readable. Bounds are
now 256 MiB file, 512 MiB expanded, 128 MiB metadata and four million nodes.
Aggregate decoded array allocations are also bounded against overlapping blocks.
Memory/quota limits on a specific device still apply.

In the earlier schema-2 initial-Earth encoding benchmark (no compression/storage):

| Codec | Encoding time | Header bytes | Total raw bytes |
| --- | ---: | ---: | ---: |
| v0.13 | 2,177 ms | 171,204 | 59,132,375 |
| v0.14 | 170 ms | 113,022 | 59,074,905 |

Most initial-world speed improvement comes from table-driven CRC32. These are
single-machine measurements, not guaranteed iPhone timings or total save latency.
A regression fixture with 4,000 records and 2,048 numeric history values each fails
the old metadata limit, encodes with a header below 2 MiB in the compact format,
and round-trips without truncation. The old codec is retained only as a test fixture.

The save worker now transfers ownership of imported file bytes and decoded typed
arrays instead of copying those buffers through worker messages. An initial Earth
checkpoint contains 363 transferable arrays totaling 58,961,155 bytes (about
56 MiB); moving these avoids a second copy of those decoded buffers. Encoding
still copies the live checkpoint so simulation arrays are never detached. This
reduces copying during load, not the memory needed to hold the world itself.
Browser regressions check aliases, cycles, Map/Set references, intact live arrays,
slot loading, and autosave/file round trips at desktop and phone viewports.

## Rendering

During playback, map redraw cadence adapts to measured composite/drawing cost,
from a 110 ms minimum interval to a 500 ms maximum. Paused controls use the usual
interval. Zoom and pan repaint once on the next animation frame, combining
multiple input events; display controls bypass playback throttling. Highlight animation redraws the
existing composite rather than rebuilding all provincial overlays/borders.
Unchanged timeline charts are cached by state, last statistics record and canvas
geometry. Resizing to unchanged dimensions does not clear the cached canvas.
These changes reduce rendering work; they do not accelerate every model phase
or discard histories. Late-game entity growth can still require more CPU/memory.

## State formation

The change targets independent states, not people/culture counts. It does not
blacklist Africa or Australia, delete existing states, or force historical dates.
It changes the globally applied founding model:

- Sparse agrarian populations receive less founding probability until density,
  administration or managed river organization supports a recurring surplus.
- A river alone contributes less organization than actual irrigation.
- Low crop storability has a smaller residual probability of state formation;
  administrative development still provides an alternate organizational path.

A controlled snapshot probe gave every cell in four coordinate boxes mature
agriculture, population density 4/km², and climate-derived crop storability,
without imported administration or irrigation. Summing founding probabilities
produced the following relative changes:

| Box | New / old expected annual founding events |
| --- | ---: |
| Australia (40–10°S, 113–154°E) | 0.38 |
| Congo interior (5°S–4°N, 15–28°E) | 0.35 |
| West Africa (8–18°N, 12°W–8°E) | 0.33 |
| Ethiopian highlands box (5–15°N, 35–42°E) | 0.78 |

This is a probability sensitivity experiment, not a multi-seed historical
calibration or a forecast of actual state counts. Regressions separately check
that dense farming, irrigation and administrative development remain viable in
Australia, Congo, the Sahel, Ethiopia, Mexico and the Andes. Existing states in
loaded worlds are retained; new rules affect subsequent founding. More long-run
regional calibration remains necessary.

## Further rendering and simulation profiling

Removed three duplicate display-change handlers: a burst of display changes now
produces one composite rebuild. Borders avoid per-cell temporary segment arrays;
route selection skips map modes that never show routes. City and route selectors
reuse calculated screen positions. Ranking tie-breaks share one numeric collator.
Historical previews draw continuous row spans rather than one rectangle per cell.

A paused Chromium stress scene used 27,442 land cells, 3,290 cities, 1,200 routes
and 12,100 state records. Thirty warmed map samples and ten ranking samples gave:

| Operation | Before | After |
| --- | ---: | ---: |
| Desktop archived-state ranking, median | 38.7 ms | 3.9 ms |
| Phone viewport archived-state ranking, median | 40.7 ms | 4.1 ms |
| Immediate synchronous rebuilds per display toggle | 3 | 0 (one next frame) |

Composite and final map pixel hashes matched at both viewport sizes. Individual
political-map build/draw timings did not show a consistent improvement; the
largest rendering gains come from doing less unnecessary work. These timings
use desktop Chromium with a phone-sized viewport, not Safari on an actual iPhone.

Exit-option calculations compute each
destination's contribution once per call before summing in the original order.
Political aggregation yields every 2,048 cells and border processing every 1,024,
allowing the browser to process input between chunks. These are scheduling and
calculation changes; the founding changes above remain a separate rule change.

Historical atlas recording uses four reusable cell-link arrays (1.28 MB outside
saved state). It computes group totals each year, then constructs footprint runs
only for a new area or population peak. All historical records remain available.
Tests verify exact peak cells, totals and snapshot identity through shrinking,
regrouping and world resets, plus identical historical raster pixels.

Run `npm run benchmark:simulation` for seeded early/developed CPU workloads and
`npm run benchmark:render` for the paused map/ranking scene. CPU runs warm up for
20 years, report median timing across three 120-year trials, and include a digest
of every saved value and RNG state. The developed workload supplies institutions,
technology and many states; it is a stress test rather than historical calibration.
Optional `--baseline`, `--baseline-history` and `--baseline-colonies` paths compare
older simulation files and reject differing digests. Rendering accepts `--ui` and
`--atlas` baseline paths. Compare on an otherwise idle machine; no test asserts
wall-clock thresholds.

The first-pass developed-world comparison ended with 296 active states, 455 state
records, 176 peoples and 586 wars. Every saved value and RNG state matched the
pre-optimization simulation/history/colony code after 20 warmup plus 120 timed
years. Across three trials, the 95th-percentile generator chunk fell from 20.90 ms
to 5.66 ms (73% shorter); the longest observed chunk fell from 41.20 to 32.95 ms.
Total simulation time rose from 7.31 to 7.61 seconds (about 4%). This trades some
maximum throughput for more frequent input/painting opportunities; it does not
establish a higher overall simulation rate. Long chunks can still occur in other
phases. A technology-loop rewrite was removed after failing to show a gain.

Remaining limits include technology diffusion, carrying-capacity calculations,
full map composites, live checkpoint cloning and growing retained histories.
These changes preserve archives rather than imposing new history caps. Moving
the entire simulation into a worker would require a separate design for map
snapshots, controls and save consistency; it is not part of this update.

First-pass validation: all 89 automated checks passed, including desktop/phone browser save
and display checks. A separate 200-year prepared maritime comparison also matched
historical atlas records, communities, population/ownership snapshots and RNG
state against the previous history/colony functions. These checks do not prove
historical calibration or guarantee timings on a particular device.

## Second pass: lossless compression and ordinary hot loops

The elevation asset now stores vertical differences between the existing signed
row deltas, zigzag-encoded as variable-length integers before deflate. Climate
bytes are recompressed at level 9. Elevation and climate bytes retain their SHA-256
hashes, and the existing terrain baseline still passes. The decoder also accepts
the original elevation layout. `npm run pack:earth` reproduces the packed asset.

| Size | First-pass format | Current format |
| --- | ---: | ---: |
| Earth JavaScript asset | 1,269,901 bytes | 1,123,686 bytes |
| Earth asset under HTTP gzip | 955,676 bytes | 845,927 bytes |
| Initial Earth save under gzip | 8,883,064 bytes | 7,129,765 bytes |

The Earth asset shrank 11.5%; the initial compressed save shrank 19.7%. The complete
current HTML/CSS/script payload is about 1.49 MB before HTTP compression. Run
`npm run benchmark:size` for current per-resource and initial-save measurements;
`--codec /path/to/previous-codec.js` compares save encoders on the same checkpoint.
The save benchmark uses Node gzip at its default level; browser timings differ.

Schema 3 writes large typed-array blocks as byte planes directly into the output,
without allocating another full-world staging copy. Long integer histories use
an exact-width integer type; fractional/large values and signed zero retain
Float64 storage. Loading restores ordinary history arrays and exact typed-array
bytes, including NaN payloads. Graph schemas 1 and 2 remain supported. Decoded
memory limits count restored number-array size rather than their packed width.
In that second pass, uncompressed initial-world size remained approximately 59 MB; the optimization
primarily improves compression. Encoding and decoding require additional layout
work, so smaller files do not guarantee faster save processing on every device.
No history or terrain resolution is removed.

Political aggregation and border loops now run in ordinary functions called by
the generator in the same chunks and order. Yield points and random draws are
unchanged. Two three-trial local 120-year developed-world comparisons measured
throughput gains of 7% and 31%, respectively; timings varied between runs. Every
saved value and RNG state matched, with 296 active states and 586 recorded wars at
the end. The second comparison's median was 8.78 → 6.72 seconds; its 95th-percentile
chunk was 6.62 → 5.23 ms. These are CPU-only synthetic workloads, not measured
Safari frame rates or historical calibrations. Baselines that predate the packed
Earth data can pass `--baseline-assets /path/to/previous-earth.js` alongside their
old core to keep startup compatible.

Second-pass validation: all 95 automated checks passed, including legacy save
formats, exact floating-point bytes, malformed layouts/memory budgets, original
terrain/climate hashes, full seeded continuations and desktop/phone browser flows.

## Third pass: remove redundant work and repeated data

Uniform arrays now use a schema-3 `Fill` node containing their type, length and
one element's byte pattern. This retains negative zero and exact NaN payloads.
Loading allocates separate mutable arrays for separate original arrays, preserving
actual aliases and worker-transfer behavior. Neither original histories nor
simulation arrays are discarded. Encoding and decoding both enforce the budget
for restored arrays, even when a small file describes large uniform blocks.

| Initial Earth save | Before Fill nodes | With Fill nodes |
| --- | ---: | ---: |
| Raw graph | 59,076,578 bytes | 40,517,592 bytes |
| Gzip | 7,129,765 bytes | 7,106,272 bytes |

Raw graph data fell 31.4%; compressed files fell only 0.33% (about 23 KB), because
gzip already handles repeated values well. One initial local sample encoded in
252 → 197 ms and compressed in 534 → 480 ms. These are single Node measurements,
not promises for Safari or total slot-write time. World memory after loading is
unchanged. Additional static-asset deflate tuning saved only 104 bytes and was
rejected; this pass primarily improves save processing and avoidable UI work.

Other removed redundancies:

- Loading validates the detached candidate before confirmation/recovery, then
  installs it through a shared helper. It no longer validates all arrays twice.
  The public `applyWorldSave` API still validates before changing live globals.
- Custom-world startup/load uses the short seed address directly. Previously it
  encoded and validated up to three full-resolution maps just to discard them
  when selecting that address. Unsupported custom-map share links now report
  their existing message before encoding. Explicit setup exports are unchanged.
- Autosave rotation reads the autosave key range instead of manual/recovery blobs.
  Completing an autosave no longer rebuilds hidden save-card DOM.
- Founding checks return earlier for cells that fail the same existing maturity,
  nomadism, agriculture and density criteria. Every cell's probability matches the
  reference implementation, and the full seeded continuation/RNG digest matches.
  Three local 120-year early-world trials gave medians of 2.16 → 2.09 seconds
  (about 3% higher throughput), with no consistent reduction in worst-case chunks.

Run `npm run benchmark:size -- --custom-address` to include the old/new address
paths. One local prepared three-map world took about 3.3 seconds on the previous
path and below 1 ms on the direct path; this is an isolated address-generation
cost, not overall startup timing. Tests verify the actual startup/share handlers
make zero map-encoding calls at desktop and phone viewports, and slot loads run
one validation pass. Uniform-array tests cover exact bytes, aliases, independent
buffers, worker transfers, malformed metadata and decoded-memory amplification.

The standalone-function reference scan found the synchronous politics helper and
public validated-load wrapper have no direct app callers. Both remain used by
the headless testing/continuation API, so they were retained rather than removed
as apparently dead code.

Third-pass final validation: all 99 automated checks passed after adding the
encoding-side memory guard. This includes slot recovery/quotas, malformed imports,
custom-world address handlers, exact bytes and aliases, founding probabilities,
seeded simulation continuation and desktop/phone rendering/save flows.
