# World Engine

An interactive browser simulation of populations, states, cultures, and climate,
hosted on GitHub Pages at https://mufradr.github.io/.

The app identifies itself as version 0.8.0. It is a static site: no package
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
The **Aa** toggle shows or hides map names and city markers for an unobstructed map view.

Google Fonts are optional external resources; fallback fonts work offline.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | Page structure and controls |
| `styles/base.css` | Base styles and safe-area defaults |
| `styles/app.css` | App layout, map controls, and responsive styles |
| `assets/earth.js` | Compressed elevation and Köppen climate data |
| `js/core.js` | World generation, climate, and simulation rules; no DOM dependency |
| `js/ui.js` | Map rendering, controls, simulation pacing, and startup |
| `tests/` | Simulation regression fixtures and browser checks |

Scripts load in order: Earth data, simulation core, then interface. They use
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
- `npm run test:regional` checks monsoon and desert climates, highland farming,
  non-metallurgical development paths, and ocean expeditions with return trade.
- `npm run test:browser` starts its own temporary server and checks Earth
  startup, map rendering, Play/Pause, Terrain selection, simulation pacing, and
  relative resource loading at both a domain root and a subdirectory.

Tests also run on GitHub Actions for pushes and pull requests. Test dependencies
are development tools; the published site does not use Node.js or Playwright.

For manual validation, start the local server, check that the simulation date
advances with Play and stops with Pause, try the map views, and inspect the
browser console for errors. Simulation-rule changes need additional checks of
the affected behavior; the regression suite does not cover all long-term outcomes.

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
