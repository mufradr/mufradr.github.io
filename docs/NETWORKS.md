# Connected systems — v0.16.0

This records the v0.16 network foundation. The later [economy](ECONOMY.md)
separates actual food flows and reserves from capacity; [government](GOVERNMENT.md)
adds control-dependent tax collection and matched tribute payments.

The integration goal is for a change in one system to have useful consequences
elsewhere. For example: war interrupts commerce and food deliveries; shortages
reduce tax receipts and legitimacy; fiscal pressure and shocks feed the existing
instability model; the weakened parent affects colonial autonomy. Conversely,
peaceful transport supports food security, revenue, knowledge and religious contact,
while also exposing connected communities to epidemics.

## Food and transport

Each year `computeK()` calculates local production as before. `transportEconomy()`
then redistributes a bounded part of that capacity before population growth and
migration. `S.K` represents effective capacity after deliveries for that year.
Production is recomputed next year, so imports never become permanent local yield.

- A farming or herding province can offer at most 15% of its surplus above its
  own population's needs. Foraging capacity alone cannot supply exports.
- Adjacent populated provinces can exchange food through roads or river transport.
  Both ends need access; terrain reduces capacity. Hostile borders block exchange.
- Local cargo is capped at 4% of the smaller province's population, multiplied by
  access and terrain factors. Delivery loses 10% of the exported food.
- Maintained peaceful sea routes also ship food. Their cap is 4% of the smaller
  endpoint's population, scaled by enabled seafaring and `1 / (1 + km / 6000)`.
  Delivery loses 20%. A route last maintained more than ten years ago is inactive.
- Transfers only fill an existing deficit. Source budgets remain tied to local
  production; imported food cannot be exported again during that year. Duplicate
  routes cannot exhaust a province's reserved supply.

Caravans generate commerce and contact, but their long desert paths do not carry
bulk food between endpoints. There is no worldwide food pool, storage, explicit
tonnage or grain-price market. Food capacity remains measured in people supported
annually, matching the existing population model.

## Commerce and government

Sea commerce contributes `min(endpoint populations) × 0.025`, scaled by sailing
and distance. Caravan endpoint commerce contributes `min(populations) × 0.02`;
populated caravan stops contribute `population × 0.01 × caravan activity`.
Total trade receipts per province are capped at 8% of its population. This replaces
the old fixed 1,500-unit stipend per active caravan cell, including empty deserts.

The ordinary political aggregation still calculates agricultural tax. Statecraft
replaces the legacy stipend with actual commerce and reduces agricultural receipts
by half the population-weighted shortfall fraction. Existing treasury, governing
burden, fiscal crisis, military strength and cultural-vigour calculations consume
that revenue; there is no separate disconnected colonial wallet.

Food stress smooths the population-weighted shortfall over time:
`stress = 0.9 × previous stress + 0.1 × current shortfall fraction`.
It adds `0.02 × stress` to shocks and removes `0.04 × stress` from legitimacy each
year, alongside existing recovery. A state with at least four provinces can report
persistent famine when stress exceeds 12% and current shortfall exceeds 15%.
Reports are checked every five years and limited to one per sixty years per state.
This also catches shortages outside the capital's drought region.

Food movement inside a country affects provincial capacity and shortages. State
import/export totals count crossings of its borders, rather than internal deliveries.
Inspectors show trade's share of tax receipts, stress, and annual food transfers;
province inspectors distinguish local production from effective food capacity.

## Contact, disease and war

Maintained sea routes exchange techniques every five years at the existing 8%
diffusion rate. Working caravans now exchange techniques at 4%. Both respect the
diffusion rule. Contact can spread missionary faith, with reduced acceptance under
another official faith; ethnic religions retain their family restrictions.
Already active outbreaks can travel along these routes, subject to destination
immunity and prior exposure. Disease records retain their original identity,
footprint and death accounting. First-contact susceptibility remains separate.

Civilian sea activity requires populated endpoints, sufficient voyage range,
enabled seafaring, and peace between endpoint states. War stops trade, settlers,
knowledge exchange and colony supply through that corridor. Caravans also check
intermediate jurisdictions. New caravan routes retain the full path; older saves'
sampled paths become complete when those routes are renewed.

Military use of known sea routes is separate: charts remain useful for up to fifty
years after contact even if war interrupts commerce. Same-owner routes also support
the existing administrative-distance model. Ships, convoys and naval interception
are abstract; this is not a physical blockade simulation.

The diffusion setting now also gates first-contact knowledge and crop exchange.
Settlers still carry their own skills when they move. Epidemic frequency zero
prevents new virgin-soil outbreaks; an existing epidemic can continue spreading,
as with the existing local disease model. Faith zero prevents missionary contact.

## Saves, cost and validation

Three reusable Float64 scratch grids use about 1.92 MB and stay outside saves.
They hold production, remaining export budgets and commerce. State totals and
stress are small ordinary saved fields. Starting/loading a world clears cached
references; the next year rebuilds the budgets. Validated v0.13–v0.15 saves remain
readable, and subsequent years use the new model.

Local redistribution visits potential exporters and their four neighbors. Sea
routes retain the existing 128-route limit. There is no global all-pairs search.
The new tests cover conservation and limits, roads and shipping, war interruption,
hostile caravan crossings, fiscal effects, faith and epidemics, settings, old saves,
exact continuation, and inspector behavior on desktop and phone.

`npm run validate:networks` runs three prepared developed Earth worlds for 150
years each, with regular integrity checks. `npm run validate:maritime` exercises
300 years of maritime development. These are stress/integration checks, not a
multi-seed calibration of dates, regional formation rates or historical realism.

For this release, the full 134-test suite passed, followed by two additional
first-contact/famine regressions (14 checks in the final network test file).
All three prepared 150-year worlds and the 300-year maritime scenario passed
regular integrity checks. These cover 750 simulated years across four runs.
In a local 120-sample timing after warmup, the transport pass alone took a median
0.44 ms in the early fixture and 2.20 ms in the developed fixture (95th percentiles
0.61/3.48 ms). That excludes rendering and the rest of the annual simulation and
does not predict iPhone performance.

## Further connections to investigate

The next substantial questions are stored reserves and harvest variability,
transport through multiple intermediate markets, explicit supply constraints on
campaigning, and the maintenance of infrastructure during prolonged fiscal decline.
Those need separate measurements and balance work. The current update establishes
bounded shared effects without claiming to complete the whole simulator.
