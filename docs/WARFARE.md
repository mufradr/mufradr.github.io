# Campaign sustainability — 0.17.0-dev.3

This is chunk 4 of the civilization-development update. It builds on
[economic accounting](ECONOMY.md) and [government/dependencies](GOVERNMENT.md).
The checkpoint remains local; cities/knowledge and full historical calibration
are later chunks. There are no individual soldier or ship agents.

## One service population and one annual deployment budget

Each state stores a small military record: people mobilized, recruitment and
release, exhaustion, funding, supply, operations, losses and annual capacity.
Recruitment does **not** subtract people from the resident population: they are
already counted there. It removes a share of civilian labor instead. Deaths are
removed from the population once, and demobilization returns labor without
creating residents.

Annual recruitment is at most 1% of the state's population. Mobilization is
capped at 8%. War demand starts at 5% and rises to at most 8% with multiple enemies;
control, loyalty, funding and exhaustion reduce the target. Peace demand is 0.6%
for settled states or 1.2% for nomads. Release toward a lower target is gradual,
40% of the gap per year. Recounted population also clamps an oversized service
population and records the excess as demobilization. Service/labor planning uses
the latest political totals; the current political recount clamps forces before
field operations. Ownership and demographic changes are reconciled annually.

Supply and exhaustion determine the year's total service capacity. It is split
65% for offensives and 35% for defense. Every operation, raid or reinforcement
uses its actual commitment from that state's pool; three wars cannot each use a
fresh copy of the same army. The split retains a defensive reserve after offensive
campaigns. Commitments spend annual service capacity, not lives; casualties are
separate. Newly declared wars mobilize further in the next annual cycle rather
than producing an instant full army.

Engagement strength uses the committed force, equipment, cohesion, supply and
readiness. It no longer lets a small detachment borrow its entire state's population
and tax strength at every border. Local home guards provide bounded defense from
the province's non-drafted population; their engagement losses are recorded
separately from regular service casualties and other civilian deaths.

## Civilian work and actual food

Mobilized residents reduce harvest labor in the existing production calculation.
The effect is smaller for pastoral/foraging subsistence than for settled farming.
Technical knowledge, potential land productivity and stored food do not disappear
when workers are called up.

Soldiers' ordinary annual human ration is **already included** in population demand.
It is not charged again as a second full ration. Campaign supply depends on that
real coverage and on additional provisions for fodder and handling losses. These
extra provisions consume at most available surplus after ordinary human needs
and existing food transfers, before the remaining surplus enters stores. No
imaginary grain is produced by a tax receipt, route or large carrying-capacity value.

The food ledger adds `campaignUse` to its conserved identity:

`opening stores + harvest = human consumption + spoilage + shipping losses + campaign use + waste + closing stores`

`human consumption + unmet needs = population demand`

Campaign provisioning competes with reserve accumulation. Existing reserves can
buffer ordinary human shortages; they are not withdrawn again as an unlimited
military export budget. Poor ration coverage or lack of extra provisions lowers
field supply. There is no separate army warehouse with duplicated grain.

## Spending and projection

The old flat charge of half of government revenue while at war is removed.
Military requirements now depend on the actual service population, equipment,
wartime intensity and recent operational strain. Residual forces still cost money
while they demobilize after peace. This is the **single military payment** in the
existing government budget. Actual funded spending determines military funding;
credit limits, unpaid costs and infrastructure competition continue to apply.
Tribute capacity uses this same requirement, rather than also deducting the old
wartime levy. Neither a battle nor a protection commitment charges an additional
hidden treasury penalty.

Sustainable campaigning depends on:

- Administrative distance and maintained roads in the source territory.
- Terrain and forest at the destination, local food access, and provincial control.
- Available annual service capacity, current funding, supply and exhaustion.
- Fortifications, equipment, cohesion, ecological constraints and local resistance.
- For ocean operations: capable populated ports, range and an actual coastal link
  or known viable ocean corridor. Old charts alone are usable for at most fifty
  years without renewed activity. Wartime navigation can maintain a corridor even
  when peaceful commerce between enemies stops.

Sending ports have a shared annual throughput budget based on their population,
navigation and physical condition. Multiple operations and allied reinforcements
using one port share that capacity. A huge inland empire cannot send its entire
army through a tiny fishing village. Sea distance attenuates support; this is an
aggregate transport constraint, not a model of individually built ships.

## Vassal service and protection that reaches the battle

A capable protector can still join defense of its vassal. Willing, capable vassals
also owe service when their protector is attacked. Low allegiance, independence
pressure or exhaustion can produce withheld service; it feeds dependency pressure
and fades after peace. These rules do not automatically conscript dependents into
wars of aggression.

Being named in a coalition does not create free strength. A protector or vassal
can contribute from its own remaining defensive pool only when it can reach the
recipient through an adjacent friendly land relationship or a viable maritime
corridor. Up to three direct dependency partners can reinforce an engagement;
contributions are bounded by the receiving need, distance, readiness and any port
capacity. The helper pays its existing military budget and bears its own casualties.
There is no extra army or fictional payment credited to the protected state.
Shared defense without a viable supply connection no longer automatically restores
protection credibility. Land adjacency is snapshotted from the completed border map
for each campaign year; a half-rebuilt map cannot make aid depend on scan order.

## Losses, exhaustion and peace

Both unsuccessful and successful engagements produce regular military losses,
bounded by the forces committed. Military deaths reduce the service roster
immediately. The existing political aggregation builds a scratch list of recruitment
homes; at the completed annual boundary, each casualty is distributed across those
homes and deducted once from the actual resident grid. This still works if the
state was annexed or the homes changed owner during the campaign.

The annual record checks:

`opening mobilized + recruited − demobilized − combat deaths − attrition deaths = remaining mobilized`

Population deductions are measured from the Float32 resident grid. The small
rounding difference is recorded explicitly; physical population is never credited
back as part of recovery. No pending military deaths are allowed in a validated
completed checkpoint. The casualty-distribution scratch list is not serialized.

Local militia deaths are removed at the engagement province and recorded separately.
Other civilian deaths and forced displacement are also distinct. The old automatic
7% population reduction on every capture and 6% reduction on all civil-war provinces
are removed. Raids no longer turn a looted economic value into an additional
population subtraction. Military, militia, civilian and displacement effects each
have one defined application; bookkeeping does not repeat the physical loss.

Long wars, active operations, difficult projection, insufficient food and unpaid
forces build exhaustion. Poor supply also creates bounded additional field attrition.
Peace with good supplies and funding demobilizes forces and restores readiness over
years. Persistent exhaustion discourages new wars; exhaustion and supply/fiscal
problems increase peace pressure in existing wars, alongside stalemate and duration.
Ending peace is idempotent and does not refund food, wages or already incurred losses.

War inspectors distinguish regular combat losses, local militia and civilian deaths.
State inspectors show the service population, funding, supply, exhaustion, operations
and annual/cumulative regular military losses. Casualty histories begin with this
model; old wars do not receive invented casualty totals.

## Saves, cost and boundaries

World envelopes remain schema 1, binary graphs remain schema 3. `warfareVersion: 1`
and the annual military clock distinguish the new state. Validated v0.13–v0.16 and
`0.17.0-dev.1`/`dev.2` worlds receive an empty military clock; state military records
are initialized without invented historical armies or casualties when their annual
process resumes. Migration detaches the state root. The dev.3 engine version keeps
old clients from accepting saves while silently discarding campaign state. Final
v0.17.0 must retain all development save versions explicitly.

There are no new saved map grids. One reusable Int32 next-link array adds 320,000
scratch bytes; small maps hold state heads and used ports. Routine labor, provisioning
and recruitment-home bookkeeping share existing map scans. Casualty distribution
visits only homes of states with losses. Supply routes and directly related coalition
members are inspected when needed; there are no all-pairs province searches.

This is not a calibrated reconstruction of army sizes, professional military
institutions, naval construction, siege duration or battle tactics. Home guards and
service fractions are aggregate approximations. Large migrating populations retain
their existing migration/settlement conflict model; they are not additional regular
state army agents. A campaign uses source-state and port aggregates rather than
routing every ration through intermediate hostile provinces. Compare the full fixed
historical seed set at integration before claiming realistic wars or longevity.

## Verified checkpoint

All 191 automated tests and 990 prepared campaign/network/maritime years passed.
A genuine dev.2 save migrated without invented existing armies and continued forty
years without integrity issues. The developed paired CPU sample adds 1.20% time
relative to the government checkpoint; it is not a cumulative v0.16.0 comparison.
Short browser samples still show occasional long frames. Full results, reproducible
harnesses, source hashes and limitations are in the [checkpoint report](../benchmarks/development/warfare/README.md).
