# Correctness and reproducibility contract

This document covers roadmap phase 1 in version 0.8.1. Checks establish internal
consistency and repeatability, not historical calibration.

## Calendar

The internal year uses astronomical numbering (0 displays as 1 BCE). Periodic
zero-offset checks work with negative years; positive-offset checks must use
`calendarPhase(year, period)`. Regression checks compare actual callback counts
across forty BCE and forty CE years, and test phases immediately around zero.

## Scratch-buffer audit

| Buffer | Use | Initialization / bounds |
| --- | --- | --- |
| `poolNext` | Disease-pool next state | Dedicated Float32Array; cleared on each pass; each land output assigned; values clamped to [0, 1]. |
| `bfsPar` | Caravan path parents | Each discovered cell receives a parent before use; the source gets -1. Disease updates no longer touch it. |
| `bfsD` | Caravan distances | Source assigned zero; every enqueued child gets a distance. Search is bounded to about 70 cells. |
| `bfsMark` / `bfsStamp` | Caravan visitation | Each search uses a fresh stamp; marks reset before Int32 overflow. |
| `q` | Founding, civil-war and mixing queues | Founding marks ethnicity before enqueue; civil war and mixing mark labels before enqueue, preventing duplicate visits. Capacity is the entire grid. |
| `lab` | Civil-war and mixing membership | Each participating cell is initialized before use. All enqueued labels, including unprocessed mixing queue entries, are cleared afterward. |

Regression checks poison disease and pathfinding buffers and exercise civil war
and mixing cleanup. Shared scratch arrays remain private to sequential simulation
passes; rendering does not write them.

## Integrity checks

`simulationIssues()` returns up to fifty consistency failures. It checks finite,
nonnegative populations/capacity, bounded disease and technique values, valid
ownership/people/religion/city/outbreak references, valid war participants,
reciprocal alliances/enemies, sea-route bounds and instability contribution sums.

Invoke it at completed-year boundaries. Ownership can change during a year while
aggregate polity statistics await the next aggregation; the checks do not demand
that cached totals or every capital ownership relation update midway through a
pass. The Checks-panel button completes an already-started year before checking.
The controlled long scenario also checks integrity every hundred years.

Successor states created inside the ruler/policy phase are excluded from that
phase's iteration snapshot. Their first policy update follows next year's
aggregation, preventing missing integration totals from producing NaN instability
and cultural values. A forced succession-fragmentation regression covers this.

## Reproducing experiments

Setup schema 1 stores the engine version, dataset identifier, actual world source
and seed, generation land share, climate anchoring, climate values used to build
the world, history seed and rules captured when that history started. Imported
map arrays use exact little-endian Float32/base64 encoding.

Validation rejects unsupported versions, missing parameters, nonfinite or
out-of-range settings, malformed maps and unsupported sources before applying
configuration. Restoration rolls back world, history and settings on failure.
Exports preserve the initial setup even if live controls have subsequently changed.
Links are available for Earth/generated worlds; imported maps use a JSON file.

Progress, random-generator continuation state and a timeline of live rule edits
are outside this format. Those belong to later save-game/replay work. An engine
version mismatch is an explicit error rather than a promise of identical results.

## Playback

The same completed years must produce the same state regardless of frame budget,
playback speed, or pausing with a partially executed generator. Tests compare
population, ownership, history, all technique arrays, disease pools and the next
random draw at .5, 25 and maximum speed. Browser checks also exercise pause/resume.

## Early political development (0.10.0)

The settlement-history array counts years of sustained farming, capped at 2,000;
non-farming years erode it and empty sites reset it. Agrarian founding requires at
least 600 years, except where advanced administration is already present (such as
settlers bringing institutions). Maturity and density scale the founding probability. Density is measured over
estimated settled valley area (35–100% of a coarse cell according to roughness),
so mountains do not suppress local village organization through whole-cell density.

Expansion probability falls beyond governing capacity. Before law or road
institutions reach 0.5, agrarian expansion stops at 150% of that capacity.
Accounting alone does not qualify a realm as an empire: non-nomadic empire titles
require average administration of 0.45 and capital law knowledge of 0.3.
A capital victory cannot
annex a realm beyond 150% of that capacity. Instead it can establish tribute.
Pastoral confederations also need transport and mounted skills to sustain wide
expansion. Forests raise land travel costs, while roads reduce them. Irrigated
river societies gain reach, slower interior cohesion decay, and access to accounting
at smaller populations. No rule names Europe or the Fertile Crescent or forces
an empire to appear on a particular date.

`npm run validate:states -- seed 6500` reports the default Earth's regional
population, polity counts and largest-state/tributary-bloc shares, checking integrity
every 100 years. Polity counts include chiefdoms, not just urban states. This is a
calibration aid; a successful run is not proof of historically correct dates or
that every seed will give the same regional ordering. The grid is too coarse to
resolve individual Mesopotamian city-states accurately.

## Atlas and maritime checks (0.11.0)

State area uses km² from world cells rather than a count. Annual maxima survive
territorial loss, religious population peaks are recorded, and completed wars
freeze duration even at year zero. Atlas scoring and screen-space selection are
read-only. City/route detail changes affect only rendering; route simplification
retains original paths and endpoints. Browser checks compare repeated composite
pixels and exercise independent annotation limits, desktop/mobile layouts,
knowledge-filter inactivity/keyboard focus, entity rankings and setup links.

Organized immigrant/passenger transfers subtract source population and maintain
source minority counts. Recent passenger arrivals support small diasporas without
replacing a third group. Failed small hybrid cultures restore both original
identities and fractions, as well as clearing scratch labels. Route prospecting
uses real voyage traces and a fixed per-period budget. Host acceptance and war
restrictions preserve local ownership. See [ATLAS.md](ATLAS.md) for mechanics and
bounded ledgers; the prepared 300-year scenario checks maritime integrity every
ten completed years.

## Known next modeling work

Civil-war partitioning and cohesion collapse can redistribute many provinces in
one year. A gradual-decline design should distinguish sustained weakening,
provincial secession and exceptional rapid fragmentation, then measure their
frequencies across seeds. This patch exposes the contributing pressures without
claiming to rebalance that distribution.

As of 0.9.0, overseas communities may grow independently on viable unclaimed
coasts, with emigrants deducted from source populations and minority representation
on inhabited sites. Colony counts, origins and demographic estimates have integrity
checks. National ownership, imperial supply/administration and conquest of inhabited
shores remain future mechanics.
