# Atlas and maritime development — 0.16.0

The v0.16 transport economy connects these routes to food, state finances, faith
and epidemics. See [connected systems](NETWORKS.md) for the shared activity rules,
war interruption, budgets and validation.

## Traditions and historical rankings

Traditions group states by their inherited `civ` identity. A successor can share
its predecessor's tradition while having a new state name. Stateless populations
remain neutral; ancestral families no longer create default traditions. This is a political/cultural heritage view,
separate from the Peoples and Religion maps; it is not a new simulated institution.
Colours are stable hashes of identities. Labels use the geographic centre of
currently represented cells and the existing annotation controls.

The Stats tab includes recorded states, religions, traditions, peoples and wars, with an optional
living/ongoing filter. The first 100 ranked entries are displayed. Rows link to
entity histories. All four territorial groups offer current area/population and independent
historical maxima. Area is the sum of claimed cell areas in km², including claims
on sparse land; it is not cell count or effective administrative control. Area
and population footprints are sampled at initial history creation and annual
polity aggregation, before that phase changes ownership. Religious renown still
uses the existing religious update cadence; its new peak maps and peak metrics
use annual samples. Brief changes between samples are not retained.

Renown is an explanatory index rather than a historical or moral judgement:

- States: `6 ln(1 + peak population / 1000) + 2 sqrt(peak km² / 10000)
  + 0.8 sqrt(lifespan) + 2 recorded works + min(100, 0.1 conquests)`.
- Religions: `6 ln(1 + peak followers / 1000) + 2 sqrt(peak provinces)
  + 0.5 sqrt(lifespan) + 2 sponsoring states + 3 daughter faiths`.
- Wars: `5 ln(1 + participating realms' initial population / 1000)
  + 3 sqrt(provinces taken) + sqrt(duration) + 2 participants`.

War population is recorded at declaration, including initial allies. It is not
mobilized troops or casualties. Completed wars stop accumulating duration, even
when their end year is astronomical year zero.

## Rendering and addresses

City detail first culls off-screen sites, then prioritizes population. Minimum
screen-space marker separation decreases from 48 to 30 to 14 CSS pixels as zoom
increases; city names have a separate rectangle collision check. Turning the city
optimization off restores unrestricted city annotations, including at wide zoom.
City name/marker visibility switches still apply.

Route detail shares one visible-route budget between caravans and ocean routes.
The budget grows with viewport area and zoom, selects important populated ports,
and suppresses crowded endpoints. Display paths drop points closer than four
screen pixels while retaining endpoints. The original route geometry and all
trade/migration updates remain unchanged. Turning route optimization off restores
all original route paths. Both optimization choices persist independently.

Composites start with a cleared canvas and explicit drawing state. Fortified
frontiers use lighter, thinner strokes. Ordinary borders and fortifications have
visibility controls; repeatedly drawing the same state produces identical pixels.

Knowledge filters fade after ten seconds without interaction. The compact
Knowledge filters button restores them, and focused keyboard controls stay open.
Hidden filters are inert so they cannot capture map input or keyboard focus.

Ordinary default Earth runs use compact seed fragments, as earlier versions did.
Custom worlds or custom rules/climate retain full versioned setup fragments.
Incoming full setup links remain full so a refresh reproduces that setup. The
Copy link action always exports the full starting configuration. Progress is not
saved by either link format; imported worlds still require exported files.

## Overseas colonies and cultural exchange

The full dependency, autonomy, independence and cultural model is described in
[COLONIES.md](COLONIES.md). Colonies on unclaimed shores belong to their sending
state; treaty enclaves stay under their host. A first outpost can
start on an empty shore at landfall; permanent charters follow five years of
working ocean trade, without a separate 1300 CE gate. Government can
travel along maintained routes, and declared enemies can fight across those
corridors. Peaceful trade does not itself conquer an existing country.

Arrivals remove real source population and carry its culture and techniques.
Dependent settlements use gradual assimilation; substantial third minorities
block arrivals that the two-people representation cannot preserve. Sustained
contact slows cultural divergence. Distance and isolation can produce daughter
peoples whose languages descend from their founders, or hybrids through the
existing mixing model.

Small passenger movements can create two-way diasporas. Recent arrivals protect
those minorities from below-3% cleanup for forty years; continuing arrivals renew
support. Unsupported tiny minorities can merge through the normal model. A
failed hybrid attempt restores both original groups and their fractions.

Route and community budgets remain 128 each, with at most 256 maritime minority
records. Governance groups connected provinces once per five years, with bounded
scratch storage outside saves. Display optimizations never change these rules.
`npm run validate:maritime` checks 300 prepared years and ten-year integrity
checks without forcing founding RNG. It is a mechanics scenario, not a historical
replay or assurance that every full history reaches the same outcome.

## Historical footprint storage and display

`js/history.js` observes the same annual cell arrays without random draws or
changes to simulation rules. Each entity retains an area peak and an independent
population peak with year, area, population, cell count and color. Footprints use
sorted `(start, length)` runs in Uint32 arrays, including cell IDs above 65535.
A snapshot shared by both peaks is stored once; replacing one peak cannot mutate
the other. A snapshot survives an entity's extinction but resets on a new run.
Traditions aggregate inhabited cells of successor states sharing `civ`; stateless
cells are excluded. Tapping a coloured province opens its tradition inspector,
including live member states, population/area and separate historical peaks.
Newly founded traditions can be inspected before their first peak is sampled.
Legacy ancestral-family records remain in older saves but are hidden from rankings. Religion and people maps represent the cell's
dominant identity and count its whole population, rather than minority shares.
Uninhabited claims count toward state area, but not cultural footprints.

`js/history-ui.js` supplies inspector mini maps fitted around each footprint,
including footprints crossing the date line, and one shared raster cache.
Peak ranking links pause playback and open the historical extent on the main
map. A banner identifies the date and a return button restores the prior camera.
The simulation's current year and arrays are not rewound. Current city, label,
route and border layers and current-cell tooltips are suppressed while viewing
a historical footprint. The underlying terrain is the current base map.

War records store initial attacker/defender footprints at declaration and a
unique set of provinces captured in recorded battles. These are explicitly
labelled outbreak/capture maps, not maximum controlled territory or casualty
maps. Captures exclude peaceful transfers and initial rebel partitions.

Storage grows with recorded entities and compressed peak extents, not with every
simulated year. There is no replay archive or progress persistence: share/setup
URLs reproduce configuration only. Unrecorded footprints are shown as
unavailable rather than reconstructed from present-day ownership.

Map view buttons live in a collapsed cog panel on desktop and phones. Selection,
outside clicks and Escape close the panel; keyboard dismissal returns focus to
the cog. Its label shows the active view. All map legends fade after eight
inactive seconds (Knowledge retains ten seconds). The Legend button restores or
hides them. Focused controls stay accessible; faded legends are inert and do not
intercept map gestures.
