# Initial findings and open questions

The app remains v0.16.0. These measurements precede the civilization-development
changes; they are observations, not newly tuned outcomes.

- Three default Earth histories and one ordinary generated history each completed
  10,800 years. All scheduled integrity checks passed. Prepared performance and
  maritime cases are separate, with 1,020 measured years across seven trials.
- In the three Earth histories, first kingdom titles appeared between 5646 and
  5478 BCE, and first empire titles between 2379 and 1880 BCE. Early kingdom
  classification is a useful target for the later state-formation/balance review.
- There were 357 first half-area declines among eligible major Earth states:
  300 classified as sudden and 57 as gradual. This is about 84% sudden under the
  fixed five-year definition. These are nested observations from just three
  worlds, not 357 independent history experiments. Formal state replacement can
  produce abrupt territorial loss without equivalent civilizational destruction.
- Ocean-going knowledge first appeared in 809–822 CE; first overseas community
  foundings occurred in 835–915 CE. An overseas community is not necessarily an
  Atlantic/New World colony. Review geography and capabilities before drawing
  conclusions about the realism of discovery dates.
- Earth endpoints had 646–845 million residents and 385–445 directly owned settled
  states, plus nomad polities. Regional population shares and tributary-bloc shares
  are preserved separately in [HISTORY.md](HISTORY.md).
- Earth endpoint saves compressed to 23.4–25.5 MiB with Node gzip level 6. Final
  reachable saved-world ArrayBuffers were about 61 MiB, but this excludes object
  overhead and private scratch space. Node process peak RSS was about 1.10–1.34
  GiB including the runner, observation records and save processing; sampled RSS
  before final save was already about 728–860 MiB. Avoid equating compressed file
  size or buffer totals with the actual memory requirement. These are not Safari
  or physical-device measurements.
- Prepared early CPU trials took a median 1.95 seconds per 120 measured years;
  developed trials took 7.58 seconds. Their median p95 simulation slice times were
  1.75 and 5.83 ms. Actual browser scheduling is a separate measurement.
- In the developed browser scenes, frame-gap p99 was about 67 ms at desktop size,
  100 ms at tablet size and 83 ms at phone size. The early scenes had p99 around
  17 ms. These eight-second, maximum-speed Chromium samples give us a responsiveness
  reference; they are not measurements of iPhone/iPad hardware or Safari.

## Reproducibility observation

The first developed-stress attempt failed the exact repeated-checkpoint assertion.
Its three trials reached the same final state count and passed sampled integrity
checks, but that attempt did not log the differing hashes. The cause is unresolved.
A diagnostic repetition matched all three hashes; its timings are excluded. A
rerun of the unchanged original runner also matched all three hashes and supplies
the accepted timing results. Keep [the original observation](repeat-check-observation.txt)
when interpreting deterministic comparisons. No simulation rule was changed to
make the assertion pass.

## How to use this baseline

Use the same source-pinned measurement harness and initial seed set after each
implementation chunk. Keep actual playback delays, kernel speed, save size,
memory, conservation and historical outcomes as separate checks. Expand to the
fixed ten-seed Earth set before making strong claims about regional balance.
Capture the differing fields if the checkpoint anomaly recurs. The full method,
limitations and implementation order are in [BASELINE.md](../../../docs/BASELINE.md).
