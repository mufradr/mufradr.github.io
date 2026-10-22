# Asabiya History Engine

An interactive browser simulation of populations, states, cultures, and climate, hosted on GitHub Pages at https://mufradr.github.io/.

The current app identifies itself as version 0.7.2. All application code and embedded assets live in `index.html`; `.nojekyll` enables direct static serving on GitHub Pages. No package installation or build step is required.

## Run locally

With Python 3 installed, run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` in a modern browser. Click **Play** to advance the simulation and **Pause** to stop it. Use the map controls to explore views such as Terrain, Population, and Climate check.

Google Fonts are optional external resources; the app uses fallback fonts when they are unavailable.

## Development and validation

Edit `index.html` and reload the browser to see changes. There is no dependency manifest, build pipeline, or automated test suite in this repository.

For a manual smoke test:

1. Confirm the page loads with the title **Asabiya History Engine**.
2. Click **Play** and confirm the simulation date advances.
3. Click **Pause**, then select **Terrain** and confirm the map view updates.
4. Check the browser console for JavaScript errors.
