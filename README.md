# World Engine

An interactive browser simulation of populations, states, cultures, and climate,
hosted on GitHub Pages at https://mufradr.github.io/.

The app identifies itself as version 0.14.0. It is a static site: no package
installation or build step is required to run or publish it. `.nojekyll` enables
direct static serving on GitHub Pages.

## Run locally

With Python 3 installed, run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` in a modern browser. Click **Play** to advance the
simulation and **Pause** to stop it. Use the map controls to explore views such as
Terrain, Population, Cohesion (the ability to act together), and Climate check.
The **Aa** menu also has independent city-density and route-detail optimizations
that can each be disabled, plus border and fortification switches. It controls country, people and religion
names, city
markers, city names, colony annotations, and trade routes. Choices are remembered
in this browser. You can keep country names visible while hiding cities, or the reverse.

Google Fonts are optional external resources; fallback fonts work offline.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | Page structure and controls |
| `styles/base.css` | Base styles and safe-area defaults |
| `styles/app.css` | App layout, map controls, and responsive styles |
| `assets/earth.js` | Compressed elevation and Köppen climate data |
| `js/core.js` | World generation, climate, and simulation rules; no DOM dependency |
| `js/colonies.js` | Independent overseas settlements, immigration, and cultural development |
| `js/saves.js`, `js/save-codec.js` | Validated world checkpoints and binary graph format |
| `js/save-ui.js`, `js/save-store.js`, `js/save-worker.js` | Slots, IndexedDB, autosaves and background file processing |
| `js/history.js` | Compressed dated peak footprints and war map records |
| `js/history-ui.js` | Historical inspector previews and paused map views |
| `js/atlas.js` | Tradition identities, historical rankings and map detail selection |
| `js/experiments.js` | Versioned starting setups, sharing, and JSON import/export |
| `js/diagnostics.js` | On-demand simulation state consistency checks |
| `js/ui.js` | Map rendering, controls, simulation pacing, and startup |
| `tests/` | Simulation regression fixtures and browser checks |

Scripts load in order: Earth data, simulation core, colonies, atlas analysis, experiments, diagnostics, then interface. They use
classic scripts with shared bindings; preserve that order. Edit the relevant
file and reload the browser. Keep all these directories alongside `index.html`
when serving or publishing the site. Relative asset URLs also support hosting
under a subdirectory.

## Automated checks

Testing requires Node.js 24 and npm. Install the test dependencies and Chromium:

```sh
npm ci
npx playwright install chromium
npm test
```

On Linux, Playwright may also require system libraries:
`npx playwright install --with-deps chromium`. If using an existing Chromium,
set `CHROMIUM_PATH` to its executable. The tests automatically use
`/usr/bin/chromium` when present.

- `npm run test:core` checks Earth and generated-world elevations against the original
  terrain baseline, fixed-seed climate and history reproducibility, three simulation
  years, and finite, nonnegative population values.
- `npm run validate:maritime` checks 300 years of prepared ocean ports, settlements,
  passenger minorities and integrity without forcing founding success.
- `npm run validate:states` reports 6,500 years of early political development,
  including regional polity counts and the population shares held by states and
  tributary blocs. Use `npm run validate:states -- another-seed 6500` to compare seeds.
- `npm run test:regional` checks monsoon and desert climates, highland farming,
  non-metallurgical development paths, and ocean expeditions with return trade.
- `npm run test:browser` starts its own temporary server and checks Earth
  startup, map rendering, Play/Pause, Terrain selection, simulation pacing, and
  relative resource loading at both a domain root and a subdirectory.

`npm run benchmark:simulation` and `npm run benchmark:render` report repeatable CPU
and rendering measurements. See [performance notes](docs/OPTIMIZATION.md) for
scenarios, baseline comparison options and limitations.

Tests also run on GitHub Actions for pushes and pull requests. Test dependencies
are development tools; the published site does not use Node.js or Playwright.

For manual validation, start the local server, check that the simulation date
advances with Play and stops with Pause, try the map views, and inspect the
browser console for errors. Simulation-rule changes need additional checks of
the affected behavior; the regression suite does not cover all long-term outcomes.

See [atlas and maritime development notes](docs/ATLAS.md) for score formulas,
rendering limits, URL behaviour and settlement rules.

## Save and continue a world in 0.14.0

Open **Saves** for three named manual slots, previous-save backups, and three
rotating autosaves. Saving finishes the current year and pauses playback; loading
resumes paused. Autosaves run every minute of active play and when pausing, and
never overwrite manual slots. Loading keeps a separate recovery checkpoint.

Use **Export current world** or a slot's **Export file** to keep a `.worldengine`
file in Files/iCloud Drive. **Import world file** opens it on another device.
Local slots stay in this browser and may be cleared by browser/iOS storage
cleanup, so export important worlds. No account or server is needed. World saves
include custom terrain, simulation progress, histories, peak maps and RNG state;
setup links/files still only reproduce starting conditions. The loader accepts
v0.13.0 and current-version saves and validates imports before replacing the live
world.
See [save format and device-storage notes](docs/SAVES.md) and
[save/performance measurements and founding changes](docs/OPTIMIZATION.md).

## Atlas and statistics

Stats rankings for states/empires, religions, traditions and peoples include
current and peak area/population. Selecting a peak opens its recorded territory
on the paused main map; inspector pages also provide a dated mini map and a
selector for area versus population peaks. **Return to live map** restores the
present view, and Play resumes the current simulation. War maps show initial
participants and recorded captures. Records belong to the current run and are
not saved by setup/share links. Earlier unsampled footprints cannot be rebuilt.

**Traditions** colours successor states by inherited political tradition and stateless
peoples by ancestral family. **Stats** ranks states, religions, traditions, peoples and wars by an
explained renown/scale index. Area means claimed territory, measured in km², and separate peaks
need not occur in the same year. War scale uses populations of participating realms,
not casualties or mobilized soldiers.

Map views are tucked behind the **⚙** button at the top left. Choose a view to
close the panel, or toggle it with the button. Bottom-left map explanations fade
after eight seconds; **Legend** brings them back.

City detail prioritizes the largest visible cities and avoids crowded markers and
names in screen pixels. Route detail limits visible routes and simplifies only the
drawn paths; hidden routes still trade and populations still develop. Each limit
can be disabled independently in **Aa**. Knowledge filters fade after ten inactive
seconds and return through **Knowledge filters**; active keyboard use keeps them open.

Default Earth addresses use a short seed fragment. Custom setups and explicitly
shared links retain the full starting configuration to make refreshes reproducible.
**Setup → Copy link** always produces the full versioned setup. Neither address
format saves current progress; imported maps still require an exported setup file.

## Early states in 0.10.0

Farming communities need sustained settlement before chiefdom formation; advanced
settlers can bring established governing skills with them. Larger
realms depend on accounting, administration and transport; expansion slows when
territory exceeds governing capacity. Early states have a territorial ceiling until
law or road institutions develop; empire titles require stronger administration
and law. A capital victory can yield tribute rather
than immediate annexation. Forests impede travel before roads, while irrigated
river societies gain administrative reach, stability and earlier access to accounting.
These are geographic and institutional rules, not a scripted historical timeline.
See [the before/after balance comparison](docs/STATE_BALANCE.md) for measured
results and the remaining calibration limits.

## Simulation changes in 0.8.0

- Monsoon moisture survives farther inland. When observed-climate anchoring is
  enabled, the map uses observed climate classes to distinguish humid subtropical
  forest, seasonal woodland, steppe and desert. Elevation data are unchanged.
- Cool highland valleys can support crops without hot cereal-growing summers.
  Composting can emerge in farming villages; managed fields and terraces improve
  yields. Crowded farming communities can organize chiefdoms without metallurgy.
- Writing/accounting, road networks, portable records and intensive cropping have
  independent prerequisites: iron, coinage and wheeled transport are not universal
  requirements. Knowledge-view tooltips show each technique's prerequisites.
- Mature coastal ports can launch expeditions. Celestial navigation and portable
  records unlock ocean-going ships; on Earth this technology cannot emerge before
  800 CE. Voyages follow sea paths on a sphere, have finite kilometre ranges, and
  stop at land or very cold seas. Trade-wind and westerly headings influence routes.
- First contact can open return trade routes (blue dashed lines), exchange crops
  and ideas, and transmit crowd diseases. Contact does not automatically conquer
  or replace the destination's people. Routes fade if neither shore can sustain
  them; at most 128 are retained to keep simulation cost bounded.

Rebuild the world to apply climate and agricultural changes. These are coarse
simulation rules, not a reconstruction of measured local rainfall or a guarantee
of particular empires or discovery dates. The sea routes represent expeditions
and return trade, rather than individual animated boats.

For a longer, controlled development check, run `npm run validate:history`
(roughly 2–3 minutes on the cloud machine). It activates the farming-era hearths
in an initially foraging world and runs 4,010 years, checking that states develop
in both Mexico and the Andes. It is a development scenario, not a replay of the
entire historical timeline. The overseas tests likewise start with a prepared
Age-of-Sail port; they test the expedition mechanic without forcing a discovery
or asserting that every full history reaches the same date or outcome.

## Correctness and reproducibility in 0.8.1

See [CHANGELOG.md](CHANGELOG.md) for release history and
[docs/CORRECTNESS.md](docs/CORRECTNESS.md) for the buffer audit and checks.

- BCE years now schedule disease-pool and caravan updates at the same frequencies
  as CE years. Disease pools have an independent, initialized floating-point buffer.
- Sustained war can accumulate institutional coordination, which decays in peace.
  Every instability contribution, including institutional sclerosis, appears in
  the state inspector and recorded explanations.
- **Setup → Copy link** shares the starting world, seeds, applied climate settings,
  initial rules and engine version. **Export setup / Import setup** round trip the
  same configuration as JSON. Imported worlds include their height, temperature
  and precipitation maps and must be shared as files, not links.
- Setups recreate a run from the beginning. Progress and runtime rule edits are
  not saved. Configurations from other engine versions are rejected explicitly;
  corrected rules can change the outcome of an old seed. Legacy seed links still
  work, using the receiving browser's current settings.
- **Checks → Check simulation integrity** pauses at a completed year and checks
  numeric bounds, ownership, entity references, relationships and explanations.

This release does not rebalance abrupt civil-war fragmentation or add governed
overseas colonies. Ocean voyages can settle unpopulated land and establish trade;
existing inhabited shores are not automatically annexed.

## Independent overseas communities in 0.9.0

Late-game ocean voyages can found independent settler communities on suitable,
unclaimed coasts, or small enclaves accepted through peaceful treaties or mature
trade under a local government. Earth requires 1300 CE or later, ocean-going ships, navigation,
farming, a substantial sending population, and room to sustain newcomers. Founding
is probabilistic; it does not annex land belonging to another state.

Settlers leave the source population and carry culture, faith and practical
knowledge. On sparsely populated shores they begin as a minority, preserving the
existing majority. Sustained migration along a return route can grow the community;
after generations it can develop a daughter culture. Ordinary simulation rules
can then produce an independent local state. Communities can also dwindle, blend
into neighbours or lose their connection to the homeland.

Teal diamonds mark active communities on political, alliance, peoples and religion
maps. Zoom in for names or inspect the province for founding people, local culture,
settler descendants and current government. The Aa colony annotation switch controls these markers and names. At most 128 community records are retained; failed records can be
replaced when new communities form.

Maintained ocean trade retries settlement opportunities, supports immigration and
small two-way passenger movements, and preserves trade-supported minorities.
If a tiny mixed community cannot form a new people, both existing groups survive.
Host governments retain ownership; war blocks their acceptance of new arrivals.

National colony ownership, imperial administration and overseas conquest remain
future work. JSON setups still reproduce starting conditions rather than saving
an ongoing colony's progress.

`npm run benchmark:size` reports the static app payload and initial save size.
`npm run pack:earth` reproduces the lossless packed Earth asset; it changes
storage encoding without changing elevation or climate resolution. No build step
is needed to use or publish the checked-in packed asset.
