# Release history

## 0.13.0 — World saves and portable histories

- Added a Saves tab with three named manual slots and previous-save backups.
- Added three rotating autosaves after each minute of play and on pause, using
  completed-year checkpoints independently of manual slots.
- Added compressed .worldengine file export/import for moving worlds through
  Files/iCloud Drive, including custom terrain, histories and historical peak maps.
- Loading validates format, checksum, version and simulation structure first,
  asks before replacing the world, and keeps a separate recovery checkpoint.
- Stored full RNG state and shared data references for consistent continuation.
  Processing runs in a worker, and IndexedDB transactions protect existing saves
  if a replacement fails. Browser-storage limitations are explained in Saves.
- New saves resume paused. Configuration links still reproduce starting setups;
  they do not contain progress. Save schema 1 requires this exact engine version.

## 0.12.0 — Historical peak maps and compact map controls

- Map legends fade after eight inactive seconds (ten for Knowledge) and return
  through the Legend button. Map views now open from a compact cog button,
  leaving the map unobstructed when closed, including on phones.
- Stats entries open dated historical footprints for states and empires, religions,
  traditions and peoples. Area and population peaks have separate snapshots.
- Added Traditions and Peoples rankings, plus current/peak area and population
  metrics for all four groups. Inspector previews can open on the main map.
- Historical map views pause playback, omit present-day annotations and provide
  a Return to live map button. Playing again restores the live map.
- War pages show participants at outbreak and provinces taken in recorded battles.
- Retain compressed cell runs for at most two peak snapshots per entity, rather
  than full yearly maps. Records reset with each new history; setup links do not
  save progress or reconstruct earlier footprints. Simulation rules are unchanged.

## 0.11.0 — Traditions, renown and maritime exchange

- Added a Traditions map for inherited state traditions and ancestral families.
- Added Stats rankings for state, religion and war renown, plus current and peak
  state area in km² and population. Scores are explained in the interface.
- Added population-prioritized, screen-space city spacing and label collision
  avoidance, and zoom-based route budgets and display-only path simplification.
  Both detail limits have independent persistent switches in the Aa menu.
- Reduced heavy fortification strokes, added border display switches, and reset
  the composite canvas before each redraw to prevent drawing-state accumulation.
- Knowledge filters fade after ten inactive seconds; a compact Knowledge filters
  button restores them. Keyboard focus keeps the controls accessible.
- Ordinary Earth addresses use compact seed links. Custom worlds/rules and
  explicitly shared setups keep complete reproducible links; Share setup always
  produces the full configuration. Progress is still not saved by a URL.
- Maintained ocean routes revisit settlement opportunities in both directions,
  support larger sustainable immigrant waves and small passenger diasporas,
  prospect nearby landfalls with a bounded fleet budget, and
  can establish peaceful host-approved enclaves without annexing the host state.
- Fixed minority loss when a small community cannot form a hybrid culture, and
  preserve source minority proportions when members of the majority emigrate.


Validation: all 65 automated checks passed, including desktop/phone atlas controls,
repeatable border pixels, score/area calculations, route/city detail selection,
setup links, minority preservation and maritime settlement. A controlled 300-year
maritime scenario ended with five active communities and ten diaspora records;
integrity checks passed every ten years. Outcomes are not historical guarantees.

## 0.10.0 — Early states and map display controls

- Farming communities now need at least 600 years of sustained settlement before
  agrarian chiefdoms can form, unless they already possess advanced administration.
  Maturity and population density affect their chances.
  Mountain density uses settled valley area rather than uninhabitable slopes.
  Abandonment erodes that history. This applies to generated worlds as well as Earth.
- Territorial expansion slows beyond institutional governing capacity. Accounting,
  law, roads, records, military technology and river administration support larger realms.
  Accounting alone has an early territorial ceiling; empire titles require stronger
  administration and law.
- Pastoral expansion also depends on transport: foot herders lack the reach of
  mounted confederations. Advanced settlers retain their imported governing skills.
- Capturing a capital yields a tributary relationship when direct annexation would
  exceed the victor's governing capacity. Forest travel is slower before roads.
- Irrigated river societies gain administrative reach and more stable interior
  cohesion, and can develop accounting at smaller populations. These rules favour
  connected river kingdoms without prescribing a regional unification or a date.
- The Aa button opens independent controls for country, people and religion names,
  city markers, city names, colony annotations and trade routes. Choices are saved
  locally and restored on reload; display choices do not change simulation rules.

Validation: all 49 automated checks passed, including independent layer rendering,
settlement maturity, valley density, governing capacity and empire classification.
A 6,500-year default Earth comparison completed with valid reported integrity
checks. The 4,010-year agriculture scenario retained 16 Mexican and 6 Andean
states at its endpoint. See docs/STATE_BALANCE.md for results and limitations.

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
