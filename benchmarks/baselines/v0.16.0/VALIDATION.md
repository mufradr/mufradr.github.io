# Validation of the baseline chunk

- `npm test`: **144 passed, 0 failed**; full output is preserved in `tests.log`.
- Observer purity: observed and unobserved engines produced identical complete
  encoded checkpoints, including the saved RNG state.
- Prepared workload: the developed fixture matched the established performance
  benchmark exactly after continuation.
- Initial scenario coverage: all seven planned case IDs were present; ordinary
  histories and prepared stress cases remain separate.
- Every scheduled integrity check and every recorded endpoint save succeeded.
- Accepted repeated CPU cases produced matching final checkpoint hashes.
- Browser playback: all six scene/viewport cases completed without page errors
  or completed-year integrity issues.
- Source provenance, result/summary consistency and archive hashes were audited.
- `git diff` against the rollback tag confirms no changes to `index.html`, `js/`,
  `assets/` or `styles/`. The application remains version 0.16.0.

The first developed-stress attempt failed its strict repeated-checkpoint check;
its unresolved cause and successful diagnostic/original-runner repetitions are
preserved in `repeat-check-observation.txt`. That observation remains open despite
passing validation of the accepted batch. No simulation rule was changed.
