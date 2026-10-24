# Atlas and maritime development — 0.11.0

## Traditions and historical rankings

Traditions group states by their inherited `civ` identity. A successor can share
its predecessor's tradition while having a new state name. Stateless populations
use their ancestral people's family. This is a political/cultural heritage view,
separate from the Peoples and Religion maps; it is not a new simulated institution.
Colours are stable hashes of identities. Labels use the geographic centre of
currently represented cells and the existing annotation controls.

The Stats tab includes all recorded states, religions and wars, with an optional
living/ongoing filter. The first 100 ranked entries are displayed. Rows link to
entity histories. State rankings also offer current area/population and independent
historical maxima. Area is the sum of claimed cell areas in km², including claims
on sparse land; it is not cell count or effective administrative control. Area
and population maxima are sampled at annual aggregation, while religious reach
and follower maxima use the existing religious update cadence.

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

## Maritime communities

Maintained ocean routes retry founding in both directions. Every twenty years,
at most eight eligible routes prospect neighbouring landfalls by tracing actual
nearby great-circle voyages; they do not teleport settlements to adjacent land.
Settlers need agricultural capacity, food space, maritime knowledge and a sending
population. Immigration removes people from the sending port, preserving its
minority population when majority members leave.

Unclaimed sites can support independent communities. Foreign governments must
accept an enclave through an alliance/truce or at least twenty years of peaceful
trade, sufficient law and cohesion. Wars block acceptance. Ownership stays local;
there is no automatic imperial annexation. Existing substantial third minorities
still block settlement because cells represent only two prominent peoples.

Passenger movements can create small two-way diasporas. Recent arrivals protect
those minorities from immediate below-3% cleanup for forty years; continuing
arrivals renew support. Unsupported tiny minorities can merge through the normal
model. A failed attempt to create a hybrid people restores both original groups
and their fractions. Named communities can grow, develop daughter cultures,
become independent states through existing rules, or fail.

The route and community budgets remain 128 each, with at most 256 maritime
minority-support records. Display optimizations never change these mechanics.
`npm run validate:maritime` checks 300 years from prepared Age-of-Sail ports and a
known Atlantic route without forcing colony founding RNG. It is a controlled
mechanics scenario, not a historical replay or a promise that every full history
will reach the same outcome.
