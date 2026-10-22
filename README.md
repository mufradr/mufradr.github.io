# Asabiya History Engine

An interactive browser simulation of populations, states, cultures, and climate,
hosted on GitHub Pages at https://mufradr.github.io/.

The app identifies itself as version 0.7.2. It is a static site: no package
installation or build step is required to run or publish it. `.nojekyll` enables
direct static serving on GitHub Pages.

## Run locally

With Python 3 installed, run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` in a modern browser. Click **Play** to advance the
simulation and **Pause** to stop it. Use the map controls to explore views such as
Terrain, Population, and Climate check.

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

- `npm run test:core` checks fixed-seed Earth and generated-world terrain,
  climate, and history against baselines captured before the refactor, including
  three simulation years and finite, nonnegative population values.
- `npm run test:browser` starts its own temporary server and checks Earth
  startup, map rendering, Play/Pause, Terrain selection, simulation pacing, and
  relative resource loading at both a domain root and a subdirectory.

Tests also run on GitHub Actions for pushes and pull requests. Test dependencies
are development tools; the published site does not use Node.js or Playwright.

For manual validation, start the local server, check that the simulation date
advances with Play and stops with Pause, try the map views, and inspect the
browser console for errors. Simulation-rule changes need additional checks of
the affected behavior; the regression suite does not cover all long-term outcomes.
