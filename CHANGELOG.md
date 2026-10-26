# Release history

## Unreleased — Civilization-development baseline (tooling only)

- Preserve v0.16.0 as a local rollback tag before simulation development.
- Add a fixed seed/protocol manifest, ordinary-history and prepared-stress runners,
  annual state/decline and regional observations, CPU slice timing, memory/save
  measurements, and desktop/tablet/phone-layout browser delay measurements.
- Preserve initial results, readable reports, source/checkpoint hashes and archive
  checksums. Add comparison, provenance-audit and observer-purity checks.
- Document metric limitations and the six-chunk v0.17.0 implementation plan.
  App code, simulation rules, save formats and release/cache versions are unchanged.

## 0.16.0 — Connected transport, subsistence and state finances

- Roads, river transport and maintained sea routes move limited real food surplus
  toward nearby shortages. Export budgets, cargo capacity and spoilage prevent
  food creation or an unlimited worldwide food pool.
- Maritime and caravan commerce now contributes population-based, bounded state
  revenue. Empty caravan provinces no longer receive a fixed tax stipend.
- Persistent regional shortages reduce tax receipts and legitimacy and accumulate
  shocks. Sustained shortages can produce famine reports even outside droughts.
- Trade corridors exchange faith and carry existing epidemics alongside knowledge;
  ethnic-faith restrictions, immunity and rule settings still apply.
- Enemy wars interrupt civilian sea traffic and hostile jurisdictions interrupt
  caravans. Interrupted routes stop supplying colonies; recent maritime charts
  remain available for campaigning for up to fifty years without renewed contact.
- First-contact knowledge/crop exchange respects the diffusion setting, and new
  virgin-soil outbreaks respect the epidemic-frequency setting.
- Province/state inspectors explain local/effective food capacity, food movement,
  trade revenue and persistent shortages. Continue accepting v0.13–0.15 saves;
  derived transport budgets are rebuilt after loading without storing additional province grids.

## 0.15.0 — Governed colonies and gradual independence

- New colonies on unclaimed shores belong to their sending state, sharing map
  ownership and tradition. Foreign treaty settlements retain host sovereignty.
- Parent-owned outposts can begin at first landfall on empty coasts; permanent
  charters follow five years of viable ocean trade. Remove the separate 1300 CE
  gate and allow capable ports to fund smaller expeditions.
- Fix initial pioneer arrivals creating population without subtracting it from
  their source. All colonial/pioneer migration now moves real people.
- Maintained sea routes provide administrative distance and overseas war access.
  Dependencies can draw supplies from other homeland ports if their origin is lost.
- Connected overseas provinces accumulate autonomy based on their population
  relative to the homeland, distance, isolation, cultural ties and parent strength.
  Mature, substantial regions can become independent, sometimes through war.
- Migrants carry their actual source people/language; population is conserved.
  Gradual assimilation respects existing groups and the Assimilation setting.
  Contact slows cultural divergence; distant communities can develop daughter
  identities and languages. Young dependencies no longer lose ownership through
  the generic sparse-land abandonment rule.
- Colony/parent inspectors show ownership, supply, autonomy, regional population
  ratios and independence. Existing v0.13–0.14.1 saves remain readable; eligible
  unclaimed legacy charters can resume without annexing sovereign states.

## 0.14.1 — Inspectable, emergent traditions

- Map clicks and phone taps open the selected tradition inspector, with current
  member states, area/population, fallen states and dated historical peaks.
- Newly founded traditions can be inspected before their first history sample.
  Province tradition links and selected-tradition borders work consistently.
- Remove preset ancestral-family traditions from the map and rankings. Traditions
  now begin with states and pass to successors; stateless land remains neutral.
- Continue accepting v0.13.0 and v0.14.0 saves. Legacy family archives are retained
  for compatibility but hidden from rankings. Simulation rules are unchanged.

## 0.14.0 — Smoother playback, smaller saves and founding constraints

- Compact graph schema 3 interns object layouts and stores long numeric histories
  as binary blocks, preserving all historical records and shared references.
- Replaced bit-by-bit CRC with a lookup table. Raised expanded save capacity to
  512 MiB, file capacity to 256 MiB, metadata to 128 MiB and graph nodes to four
  million. Bounds remain to protect browser memory and reject oversized imports.
- Read legacy graph schemas 1/2 and accept validated v0.13.0 world saves. Continuing
  an old world uses the new founding rules; existing states are not deleted.
- Adapt map repaint frequency to measured render cost during playback, avoid
  rebuilding the composite for highlight-only animations, and cache unchanged
  timeline drawings. Rendering switches remain independent of simulation rules.
- Require more reliable density/surplus for founding new agrarian states; unmanaged
  rivers provide less organizational credit, and weakly storable crops have a
  lower residual founding chance. Dense farming, irrigation and administrative
  development remain eligible in every region. Peoples/cultures are unchanged.
- Added oversized-history, legacy codec, and regional founding regression checks.
- Reduce repeated neighborhood calculations without changing
  random draws or numerical results. Historical atlas recording reuses scratch
  buffers and builds territory runs only when an entity reaches a new peak.
- Remove duplicate map-display handlers, coalesce drag/zoom repaints into animation
  frames, reduce border/route drawing allocations and reuse numeric sorting setup
  for large rankings. City and route detail switches remain independent.
- Transfer imported file and decoded array buffers between the UI and save worker
  instead of copying them again; live simulation arrays remain usable while saving.
- Add repeatable performance benchmarks and deterministic regression checks for
  the optimized paths. See docs/OPTIMIZATION.md for methods and measured limits.
- Losslessly repack elevation as vertical residuals and zigzag variable-length
  integers, reducing the Earth asset by 146 KB without changing a terrain cell.
- Group typed-array bytes into planes before gzip and use exact-width integer
  blocks for numeric histories, reducing an initial compressed save by about 20%.
  Legacy graphs remain readable; decoded array memory budgets remain enforced.
- Run hot political cell loops in ordinary functions between the existing yield
  points, retaining responsive scheduling with less generator overhead.
- Store uniform arrays as a repeated byte pattern and restore independent arrays
  on load. This cuts initial raw save data by about 31%; gzip files shrink slightly.
  Encoding and decoding both enforce the restored-memory budget.
- Validate imported saves once before confirmation/recovery rather than rescanning
  the entire world during installation. Public save loading still validates input.
- Avoid encoding full imported terrain/climate maps to produce short seed URLs or
  reject unsupported map-share links. Explicit setup exports retain all maps.
- Skip expensive founding calculations for cells already ruled out by unchanged
  maturity, land-use and population criteria; probabilities and RNG order match.
- Read only autosave records during rotation and avoid repainting hidden save cards.

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
