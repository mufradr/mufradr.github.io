# Release history

## 0.9.0 — Independent overseas communities

- Late-game expeditions can establish independent settlements on viable unclaimed
  coasts, including sparse inhabited areas with room for a new minority.
- Settler migration subtracts population from the source; founding neither annexes
  states nor automatically replaces an existing majority or substantial minority.
- Maintained sea connections allow further immigration. Descendants share local
  growth and mortality, can develop daughter cultures, and can form their own
  states through the existing state-formation rules.
- Added named settlement records, map diamonds, province details, cultural
  genealogy, colony-origin state histories and integrity checks.
- Records and per-year work are bounded. Failed communities do not repopulate
  themselves, and missing shipping connections stop organized arrivals.
- National ownership, administration and conquest of overseas populations remain
  future work.

Validation: all 40 automated checks passed, including overseas population transfer,
minority preservation, cultural branching, independent state origins, failure,
and 120 simulated years of colony integrity. Browser checks cover colony markers
and the names-and-cities toggle at root and subdirectory URLs.

## 0.8.1 — Correctness and reproducibility

- Fixed positive-offset annual schedules in BCE years: disease pools run every
  ten years and caravans every twenty years on both sides of the calendar boundary.
- Replaced disease/pathfinding scratch-buffer reuse with a dedicated floating-point
  buffer. Every output is initialized and disease values remain bounded.
- Audited queue, label, parent, distance and visitation buffers; added a visitation
  stamp reset before signed integer overflow.
- Fixed successor states being processed before their first aggregation, which
  could produce NaN integration, instability and cultural development.
- Activated wartime institutional coordination accumulation and peaceful decay.
- Included institutional sclerosis in recorded instability causes; the inspector
  now shows all contributions to the total, including integration and legitimacy.
- Added optional state integrity checks and regressions for buffer contamination,
  calendar scheduling, entity relationships, and paused/sliced playback at .5,
  25 and maximum simulated years per second.
- Added versioned setup links and JSON import/export for complete starting
  conditions. Imported world files include their source maps. Different engine
  versions and malformed configurations are rejected before replacing a run.
- Added Earth, generated-world, imported-map and browser setup round-trip tests.

Validation: all 32 automated checks passed. The controlled 4,010-year agriculture
scenario completed with integrity checks every hundred years and states in both
Mexico and the Andes. This does not establish full historical calibration.

Compatibility: seeds may produce different histories after these correctness
fixes. Setup export is not a save game and does not record edits made during a run.
Abrupt civil-war fragmentation and politically governed overseas colonies remain
future modeling work; neither is silently changed by this patch.

## 0.8.0 — Regional development and ocean voyages

- Improved inland monsoon moisture and observed-class vegetation mapping.
- Improved highland agriculture and village-scale composting.
- Allowed state formation, accounting, roads and intensive cropping without
  imposing a universal metallurgy or animal-drawn transport sequence.
- Added spherical, distance-limited expeditions, persistent overseas routes,
  bidirectional knowledge transfer, crop exchange and disease contact.
- Added regional regression checks and a controlled agricultural scenario.

## 0.7.3 — World Engine branding

- Renamed the app to World Engine and the Asabiya map view to Cohesion.
- Made the map names toggle also hide city labels and markers.

## 0.7.2 and earlier

The original inline app identified itself as Asabiya History Engine 0.7.2.
Its subsequent file extraction preserved the embedded scripts and styles;
regression tests and GitHub Actions were introduced before the 0.7.3 rebrand.
