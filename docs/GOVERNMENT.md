# Government and dependencies — 0.17.0-dev.2

The subsequent [campaign checkpoint](WARFARE.md) replaces the flat wartime charge
and adds mobilization, exhaustion, reachable reinforcements and withheld service.

Chunk 3 builds on the [economic foundation](ECONOMY.md). It is included in
v0.20.0 with campaigns and cities; see the [release guide](RELEASE_v0.20.0.md)
for integrated validation and remaining historical calibration limits.

## Provincial government

Four saved grids distinguish the government that last administered a province,
its control, loyalty and negotiated local autonomy. Cultural/institutional
integration remains its existing independent field. When ownership changes, the
new administration starts with bounded control and loyalty derived from local
integration; it does not inherit its enemy's full authority or erase local people,
food stocks, adopted knowledge or infrastructure.

Fiscal stress remembers debt, unpaid mandatory costs and excessive government
burden. Its annual smoothing weight is 8%, so one missed harvest or balanced year
does not instantly cause collapse or cure a long crisis. Provincial isolation uses
administrative travel distance relative to the government's reach. A disconnected
province is isolated; maintained overseas routes contribute to the existing
administrative distance calculation. Colonies also remember interrupted resupply.

Each year's political aggregation updates provincial values from the preceding
fiscal position and legitimacy. Control and loyalty move toward bounded targets
with annual weights of 2.5% when falling and 1.8% when recovering. Low integration,
weak legitimacy, fiscal stress and isolation lower those targets. Failed authority
also gradually erodes integration; effective government supports the existing
integration process. Succession causes a temporary legitimacy disturbance, which
fades over time instead of resetting an established society.

Governments concede autonomy slowly (1.2% toward the negotiated target per year).
Reintegration is slower still (0.4%). Autonomy improves local loyalty but lowers
central collection. The collection factor is:

`provincial control × (1 − 0.55 × autonomy)`

This multiplies existing agricultural tax potential. Actual trade receipts use
the state's population-weighted collection factor; they are not added twice as a
caravan stipend and trade income. Existing production, transport, travel and
integration limits continue to apply. Autonomy is a compromise with local elites,
not an unlimited fiscal bonus.

## Gradual separation, recovery and sudden crises

Provinces retain their state while control and loyalty deteriorate. A solvent,
legitimate government can restore authority after reconnection and repair; low
loyalty is not an irreversible countdown to extinction. High local autonomy can
persist during recovery without creating an independent state.

The regional process considers provinces held for at least 25 years, with at
least 500 residents, weak control and substantial autonomy. The parent cannot
have another such separation for 20 years. On five-year checks:

- Autonomy at least 55%, control below 45%, and loyalty at least 30% allow a
  peripheral region to negotiate self-government as a tributary vassal.
- Loyalty below 25%, control below 30%, and autonomy above 35% permit rebellion.
- The departing region must meet the existing minimum chiefdom population.
  It grows contiguously through other weak provinces, excludes the capital and
  dependent colonial sites, and takes at most 20% of the parent's provinces
  (at least one, capped at 256).

There are at most four such releases globally per five-year check, bounding
exceptional work in stress worlds. A regional release changes jurisdiction, not
population or knowledge. Negotiated releases start without a war. Rebellions
start a civil war when warfare is enabled. Overseas regions retain their separate
geographic grouping and age/population requirements.

Ordinary instability no longer directly rolls for a whole-realm breakup every
year. The old broad-collapse mechanisms require exceptional compound conditions:
a severe shock with very weak legitimacy and sustained fiscal failure, or recent
capital loss during war with already weak control and loyalty. A failing nomad
confederation can also split at succession when cohesion is below 25% together with fiscal
stress above 50%, legitimacy below 25%, or provincial loyalty below 30%. Tiny governments can still dwindle below the minimum population
needed to support a ruler. Conquest and depopulation can still end a government.

The old random abandonment of inhabited provinces simply for low cereal
extractability is removed. Abandoned empty territory can still lose administration.
This matters for non-cereal farming societies as well as gradual decline.

## Tribute and protection

Vassal relationships form an acyclic forest. Defeat, negotiation and coercive
raiding use the same relationship constructor. A one-year change in relative power
no longer ends dependence immediately. Mature, loyal and peaceful vassals can
still integrate through the existing diplomatic process.

Each annual tribute assessment happens **after all provincial tax aggregation and
before any government's annual spending**, so the result does not depend on
whether the recipient's state ID precedes the payer's:

1. Compute each state's domestic fiscal revenue from its own collection and trade.
   The inherited one-unit numerical regularizer and ledger bonus remain. Nomad
   governments use the greater of local tax receipts and a 4% pastoral-population
   extraction index. These are abstract fiscal units, not literal grain or coins.
2. Assess tribute at 12% of domestic revenue. Incoming tribute is excluded from
   this base and cannot be forwarded repeatedly along a hierarchy.
3. Limit payment by domestic receipts left after estimated administration and
   current wartime requirements. Legitimacy/allegiance, independence pressure
   and protection credibility can further reduce willingness to pay. Tribute
   never takes a loan or spends the province's physical grain inventory.
4. Record exactly the same amount as the payer's committed expenditure and the
   recipient's receipt. Unaffordable or resisted tribute is recorded as withheld,
   not as fictitious income or automatically growing debt.

Budget identities are:

`revenue = domestic revenue + tribute received`

`spending = administration paid + military paid + infrastructure paid + tribute paid`

`balance = revenue − spending`

The same bounded treasury/credit rules from chunk 2 apply to the remaining costs.
The annual transfer ledger records payer, recipient, assessment, payment and total
withholding. Integrity checks verify transfer totals, matched contemporary budgets,
nonnegative bounded payments, fiscal identities and absence of dependency cycles.

Capable protectors join the defensive side of non-civil wars against their
vassals. They are not automatically enlisted in a vassal's aggression. A bankrupt,
fiscally overwhelmed or illegitimate protector may fail its obligation; incompatible
war sides also prevent joining. A shared war uses the protector's existing
wartime budget charge, without a second separate protection fee. Unprotected
attacks erode credibility; actual shared defense and peaceful years allow recovery.
This is a political protection model, not yet a campaign logistics simulation.

Dependency allegiance uses the same legitimacy/integration/fiscal/isolation/autonomy
loyalty target as provincial rule, with protection credibility. Sustained failed
protection, withholding and relative strength build independence pressure gradually.
After at least 15 years, pressure above 78% and allegiance below 40% can end the
relationship. A viable protector can contest it; a failed protector may lose it
peacefully. Explicit war between parent and vassal also ends dependence. Death of
the protector frees its vassals rather than leaving tribute payable to a dead state.

## Colonies and succession

Owned colonies pay through their parent's provincial tax collection. They do not
also pay a separate vassal tribute. Colonial autonomy and the province's concession
share a common value at government checks; fiscal weakness and legitimacy affect
both. Overseas population ratios, isolation and regional settler identity retain
their roles in maturity and independence. A mature region can negotiate independence
when relations remain sufficiently loyal; it need not always start a war.

A dynasty change retains the same polity and provincial inventories. Successor
polities inherit their parent's normalized fiscal position, including debt,
instead of receiving a fresh positive treasury. This is not a literal division of
coin reserves: chunk 2's treasury is a ratio against tax capacity. Material reserves
remain at their actual provinces and are not duplicated.

## Saves, implementation cost and remaining work

`governmentVersion: 1` adds three Float32 grids and one Int32 owner grid: 1,280,000
bytes of persistent array storage. The visited scratch grid adds 320,000 bytes
outside saves. Annual provincial work shares the existing sliced political scan;
dependency accounting uses state-level passes. Only actual separation checks run
the bounded regional traversal. There are no household, official or military-unit
agents and no all-pairs province searches.

Older v0.13–v0.16 and `0.17.0-dev.1` saves migrate to control/loyalty based on
existing integration, zero new autonomy, and no invented historical tribute.
Migration detaches the state root, preserves technique aliases and does not mutate
the caller's old checkpoint. New-schema missing/malformed fields and cycles are
rejected. The distinct dev.2 version keeps older clients from silently ignoring
new government state. Preserve explicit support for both development save versions
when preparing the final release.

This checkpoint tests mechanisms and accounting, not historically calibrated
collapse probabilities. Fixed thresholds, capped release work, a single provincial
administration value, abstract fiscal capacity and immediate war-side commitments
remain simplifications. Campaign sustainability in chunk 4 should consume these
same budgets and control/protection fields; it must not invent another tax or
military money pool. Full-seed historical comparison remains chunk 6.

## Measured checkpoint

The full automated run passed 174 tests; final colonial-decision changes passed
50 targeted tests. The final prepared network/maritime runs passed 750 simulated
years. A genuine economic-checkpoint save also migrated and continued successfully.
Compared with dev.1, paired CPU samples added 1.24% time in the early scene and
10.48% in the developed scene. The latter exceeds the provisional 10% allowance
and remains an integration item. Developed browser samples still have long frames.
See the [checkpoint report](../benchmarks/development/government/README.md) for raw
results, source hashes, test coverage, methodology and limitations.
