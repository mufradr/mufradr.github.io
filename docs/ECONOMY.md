# Economic foundation — 0.17.0-dev.1

This describes the completed economic checkpoint. The later government checkpoint
adds control, autonomy and tribute accounting: see [GOVERNMENT.md](GOVERNMENT.md).

This completes chunk 2 of the civilization-development plan. It is a local
development version, not a published v0.17.0 release. Government/autonomy,
campaign sustainability and cities/knowledge remain separate later chunks.

## Food is a flow and an inventory

`computeK()` still calculates theoretical local support capacity. This is not a
warehouse of grain. Annual food is measured in person-rations: one unit feeds one
person for one simulated year. The existing population model still uses effective
capacity for long-term growth and migration.

Harvest is capped by both potential production and available labor:
`min(K, population × (1.04 + 0.26 × farming + 0.05 × herding))`.
Consequently an empty fertile continent produces no harvest and a small village
cannot export the full output of all its unused land. Potential capacity remains
available for growth; it is not reduced to the current small harvest.

Each annual food transaction:

1. Applies spoilage to opening stores, then records any overflow of storage capacity
   as waste. Storage depends on farmers, storable crops, administration and the
   condition of physical works. Neglect does not erase knowledge of grain storage.
2. Produces the actual harvest and releases local reserves toward any shortfall.
3. Moves bounded fresh-harvest surplus over the existing peaceful transport links.
   Imported food and reserve withdrawals are not exported again in the same year.
   Source budgets and delivery losses remain bounded.
4. Consumes food for the opening population. Any unmet needs constrain effective
   capacity; the existing growth model handles the resulting mortality pressure.
5. Deposits remaining surplus up to storage capacity and records the rest as waste.

The saved annual ledger satisfies:

`opening stores + harvest = consumption + spoilage + shipping loss + waste + closing stores`

`consumption + unmet needs = demand`

Births, migration and disease occur after this transaction and affect the next
year's demand. Stocks stay at their location when people leave; the next annual
transaction handles changed storage capacity. Stored grain is not permanently
added to production. Reserve release is currently local; emergency redistribution
of existing stocks through intermediate markets is not implemented here.

`S.foodStock` is a saved Float64 array. It starts empty. Capacity is:
`population × farming × (0.05 + 0.65 × cereal efficiency + 0.35 × administration) × works condition`.
Foragers have no grain stores. Tropical/spoilable crops lose more in storage;
administration and maintained storage reduce losses. Spoilage is bounded at
3–35% per year. Storage is a finite buffer, not immunity to prolonged famine.

## Knowledge and physical condition are separate

The existing technology fields retain knowledge/adoption. `S.works` is a saved
Float32 operational-condition array, bounded between 0.05 and 1. Maintained-road
and canal helpers apply condition where physical infrastructure affects food
production, transport, travel, administrative reach and governing capacity.

Wear and repair run annually inside the existing production pass; the clock
prevents repeated production calculations from applying maintenance twice in one
year. The previous year’s actual funding supports one year of maintenance, rather
than extrapolating a single funding value over a longer interval. Annualized wear depends on built works and terrain. Funded repair
gradually restores condition. A government’s previous budget determines funding;
local population density supports communal maintenance outside settled states.
No-road/no-canal foragers do not pay for imaginary infrastructure.

This models maintenance and repair of adopted infrastructure. It does not add
individual construction projects, explicit material inventories or ship units.

## One government budget

Tax/trade receipts, administration, wartime costs and infrastructure payments now
share one annual budget. The existing fiscal units are an abstract tax-capacity
measure, not a historical currency or the physical grain inventory. Revenue retains
the old ledger bonus and one-unit numerical regularizer. The treasury is a
normalized fiscal position, not a separate literal inventory of coins.

- Administrative costs retain the existing complexity-based calculation.
- Wartime spending is half annual revenue, translating the old normalized 0.02
  treasury penalty into an explicit payment. It is charged once. Mobilization,
  military labor losses and campaign supply are reserved for chunk 4.
- Required infrastructure upkeep depends on population, adopted roads/canals/
  administrative storage, and condition. Poor condition increases repair need.
- Infrastructure can use available receipts and a bounded draw on positive
  treasury reserves. Mandatory costs have access to the existing bounded credit
  line. When credit is exhausted, unpaid costs remain explicit.
- The existing normalized treasury range remains -2 to 1. Capped surplus and
  debt relief are recorded explicitly, rather than silently appearing as income.

The budget records requested and actual administrative/military payments, required
and actual infrastructure spending, unpaid costs, revenue, balance, treasury
movement, discarded surplus, and debt relief. Its recorded identities are checked
by diagnostics. Existing fiscal pressure consumes the combined governing burden.
Persistent underfunding can thus damage works and future food access/revenue;
recovery can fund repairs. Later government and war chunks will consume these
same accounting fields instead of inventing separate money pools. New polity
creation still follows the existing treasury initialization policy; reconciling
inherited fiscal positions when governments split belongs to the government chunk.

Inspectors distinguish theoretical local capacity, actual harvest, and the support
change from reserves and trade; a local reserve release is not labelled an import.
They show reserves in months, infrastructure condition, the budget
balance relative to revenue, upkeep funding and unpaid costs. These explanations
stay in the existing province/state pages.

## Saves and development versions

New saves have `economyVersion: 1`, stocks, condition, the maintenance clock and
small food/budget ledgers. Graph storage remains schema 3; the general world
envelope remains schema 1. The distinct `0.17.0-dev.1` engine version prevents a
published v0.16 client from accepting new saves and silently ignoring the economy.

Validated v0.13–v0.16 worlds migrate to **zero** stored food and intact condition.
Migration creates a detached state root and preserves existing entity/tech aliases;
validation does not add fields to the caller's legacy root. Installed arrays are
adopted normally. Missing or malformed fields in a new-schema save are rejected.
Migration is not a promise to reproduce the old model’s future: continued years
use the new economics. Keep exported original saves as well as the rollback tag.

## Cost and validation approach

Two saved grids add 960,000 bytes of live array storage (640,000 for reserves and
320,000 for condition). Three reusable food-flow/storage-capacity grids add 1,920,000 scratch bytes
outside saves. The storage-capacity cache avoids recalculating unchanged inputs
between harvest and storage. The flow calculations reuse the existing transport preparation and
aggregation passes. A verified subsistence-only shortcut skips market and storage
scans when no farms, herds, stores, states or routes can require them. Maintenance reuses `computeK()`; there are no
all-pairs searches or household/ship agents. Uniform initial arrays use the
existing compact save representation.

The tests cover food conservation, labor limits, capacity, spoilage, short versus
prolonged shortages, funded repair and neglect, unchanged technical knowledge,
physical transport/yield effects, fiscal identities, credit limits, old-save
migration, malformed inputs, exact save continuation and mobile/desktop inspectors.
The v0.16.0 archive stays frozen. Performance and long-run balance remain separate
questions; calibration across the full seed set belongs to the final integration
chunk, rather than tuning this foundation to force particular historical winners.

## Completed checkpoint

All 158 automated tests and 750 prepared stress years passed. The paired isolated
CPU sample added 0.58% kernel time in the early scene and 6.60% in the developed
scene; gzip save sizes grew 0.23% and 2.09%. These are prepared workloads, not
historical calibration or measurements on a physical iPhone. Developed browser
scenes still have occasional long frames. Full results, provenance, limitations
and reproduction steps are in the [economic checkpoint report](../benchmarks/development/economic-foundation/README.md).

The published v0.16.0 rollback tag and its measurement archive are unchanged.
Retain explicit support for `0.17.0-dev.1` saves when the final v0.17.0 save-version
allowlist is updated. The next chunk should build government/autonomy and gradual
decline on the food, funding, infrastructure and unpaid-cost fields established here.
