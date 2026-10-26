# Simulation baseline

`simulation.json` was captured from the original inline scripts in commit
`7e3247b`, before extracting them into separate files. It records SHA-256 hashes
of complete terrain, climate, population, ethnicity, and polity arrays, plus the
chronicle, at initialization and after three simulation years.

Both the Earth world (with climate fitting) and a generated world are covered.
Seeds and options are specified in `../core-harness.cjs`. Tests run on Node.js 24.
These fixtures protect existing behavior; they do not establish that the model
is scientifically accurate or cover every long-term simulation outcome.

If an intentional simulation change requires updating these expectations, review
and explain the changed results rather than regenerating fixtures just to pass.

Version 0.8.0 intentionally changes climate, agricultural suitability, technology
and voyages. Current tests retain the original **elevation and land-cell** checks;
the old climate and population hashes remain here as historical reference.
Climate and history are now checked for fixed-seed reproducibility, with targeted
regional assertions in `../regional.test.cjs`. No new expected hashes were generated
to hide the behavior changes.

`simulation-before-optimization.cjs` preserves the technology-diffusion and
exit-option functions from the working v0.14 code before CPU optimization. Tests
compare every saved value and RNG state after 40 years in early and deliberately
developed worlds. `save-codec-v1.cjs` preserves the v0.13 codec for compatibility
and oversized-metadata regression checks. Neither fixture runs in the app.

`earth-bytes.json` pins the original inflated signed elevation deltas and climate
bytes before lossless asset repacking. `political-loops-before.cjs` retains the
first-pass generator to check that extracting its hot loops preserves every
saved value and random draw in early and developed scenarios.
The political reference also retains the original founding-check evaluation order
for exact per-cell probability comparisons after early eligibility shortcuts.
