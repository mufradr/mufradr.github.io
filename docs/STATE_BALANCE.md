# Early-state balance comparison — 0.10.0

Compared 0.9.0 (commit `8d71167`) against the new rules using default Earth,
observed climate anchoring, history seed `regression-history`, and 6,500 years
from the default 9000 BCE start. No forced technology or population was injected.
All reported completed-year integrity checks passed.

The regions are approximate coordinate boxes: Europe 36–60°N, 10°W–30°E;
Fertile Crescent 29–38°N, 34–49°E. Counts include chiefdoms. The largest-state
share is its share of the regional population, not land area or a claim of
historical sovereignty. Tributary relationships retain separate direct owners.

| Year | Region | Polities: old → new | Largest population share: old → new |
| --- | --- | --- | --- |
| 5,000 BCE | Europe | 15 → 7 | 1% → 1% |
| 5,000 BCE | Fertile Crescent | 20 → 11 | 6% → 3% |
| 4,000 BCE | Europe | 31 → 18 | 1% → 2% |
| 4,000 BCE | Fertile Crescent | 38 → 24 | 5% → 5% |
| 3,000 BCE | Europe | 80 → 64 | 4% → 7% |
| 3,000 BCE | Fertile Crescent | 46 → 41 | 6% → 6% |
| 2,500 BCE | Europe | 115 → 76 | 6% → 9% |
| 2,500 BCE | Fertile Crescent | 54 → 38 | 5% → 12% |

At 2500 BCE the largest realm worldwide occupies 61 simulation cells, compared
with 78 in the old run. Cell areas vary with latitude, so this is a rough size
indicator. At some earlier snapshots the new run has a larger leading realm;
the change does not uniformly shrink every society. In Europe the largest
regional population share at 2500 BCE rises from 6% to 9%, even as polity counts
fall. The Fertile Crescent rises from 5% to 12%; its regional consolidation now
exceeds Europe in this snapshot. These rules limit expansion without institutions
and allow regional consolidation where institutions develop. More seeds and
historical targets are needed.

This is one seed, not a historical calibration study. Small chiefdoms can still
appear very early; the coarse grid cannot resolve individual city-states, and
technology dates, population totals, decline patterns and cross-seed variability
still need calibration. No regional unification is guaranteed.

Use `npm run validate:states -- regression-history 6500` to reproduce current
regional counts, direct-state shares and tributary-bloc shares. Change the seed
to investigate variability. The automated tests separately exercise settlement
maturity, early territorial limits, river administration, pastoral transport,
capital-victory outcomes, and forest/road travel costs.
