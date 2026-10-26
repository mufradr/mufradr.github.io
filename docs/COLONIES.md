# Overseas colonies — v0.15.0

Colonies are territorial dependencies of their sending state, rather than new
independent countries. Ownership is stored in the ordinary province owner grid,
so the parent receives the map colour, tradition, population and administrative
consequences of its overseas possessions. No individual ship units are added.

## Outposts, charters and trade

An organized state can establish a small dependent outpost on a suitable empty
coast on its first successful long ocean voyage. A permanent charter normally
follows a maintained return corridor of at least five years. Occupied shores need
that working corridor before settlement. The separate 1300 CE settlement gate is
removed; the existing Earth ocean-technology gate and knowledge prerequisites
still determine when voyages are possible.

The source must be a real coastal port with at least 8,000 people, farming,
navigation and ocean-going knowledge of at least 0.6. Voyages must be at least
2,000 km and within the source's sailing range. Destinations must be coastal,
warm enough, agriculturally suitable, not excessively crowded, and have room for
newcomers. Direct charter attempts remain probabilistic; a viable outpost can later earn a
charter through sustained contact. Empty-shore outposts have
20–500 actual settlers; ordinary initial expeditions have 300–4,000, capped at
4% of their source population. Occupied shores usually limit the first wave to
15% of existing population, with a 300-person minimum expedition on tiny coasts.
Those inhabitants remain represented when new arrivals become the majority.

A treaty settlement inside another state keeps its host's sovereignty. Alliances,
truces or established peaceful trade and local institutions can allow an enclave;
war blocks arrivals. Trade and a visiting settler community do not themselves
annex a foreign country. Unclaimed colonial sites receive their parent's owner ID.

Every five years, viable ports can send additional people, bounded by food space,
the source's actual population and the Migration setting. If the original port is
lost, another parent-owned port with a working route can supply the colony.
Smaller two-way passenger movements accompany trade every twenty years. The
route/community budgets remain 128 each and minority-support records 256.

Pioneers from smaller or stateless ports can still move across seas, but do not
receive a state charter. These arrivals now subtract real source population too:
the old unpeopled-land fallback could create people without removing them from
anywhere. Turning Migration off prevents new pioneer/colony migration.

## Government, supply and conflict

Maintained corridors contribute finite transport costs to the existing
administrative distance search, rather than leaving every ocean colony at the
unreachable distance sentinel. Costs rise with kilometres. Routes must have
living endpoints, recent maintenance, sufficient sailing range and enabled
seafaring. Government distance crosses only between provinces of the same owner.

Known ocean corridors also create weak maritime contacts between foreign states.
Declared enemies with capable ships can attack along those routes; peaceful
contacts are not attacks. This permits contested colonial independence and
reconquest using the existing war rules, without boat micromanagement.

Active dependencies are exempt from the generic sparse-land abandonment check:
the colonial governance system handles their isolation and autonomy. Capture,
civil war and state collapse can still change their owner. Territories are never
magically reassigned to an old parent after conquest. Recaptured dependencies
receive a new sixty-year minimum period before another normal independence event.
A colonial region connected by land to its parent's capital is treated as integrated.

## Population, culture and language

New arrivals use their actual source people's identity and language, not a
randomly created culture. Emigration preserves the source's minority headcount.
Incoming groups alter demographic fractions and transport techniques; they do
not delete a native population. A substantial third group blocks immigration
that the current two-people representation cannot preserve.

At dependent landing settlements, gradual demographic assimilation replaces the
generic instant majority-culture switch. Its rate depends on the Assimilation
setting, colonial community size, administration and supply. It changes cultural
shares without adding population. At Assimilation zero, that conversion stops,
and small existing minorities in active communities are protected from the usual
below-3% cleanup. The separate Mixing setting can still allow a hybrid identity.

Cultural divergence accumulates over generations. Distance speeds it; maintained
contact and assimilation slow it. A substantial community that becomes locally
distinct receives a daughter people/language through the existing language
inheritance model, retaining its ancestry. Existing hybrids are recognized as
descendants. The settler-community counter follows real growth/mortality and is
bounded by the represented population; it does not add a second set of births.

## Autonomy and independence

Once every five years, connected parent-owned land provinces are grouped into
regions. All connected overseas provinces change government together, not one
independent country per landing cell. The homeland population is the parent's
capital's land-connected region, excluding disconnected overseas possessions.

Normal independence needs **all** of the following:

- At least 60 years since founding or reintegration.
- At least 20,000 people in the connected overseas region.
- A colonial/descendant community of at least 2,000, including inland descendants.
- Regional population at least 20% of the homeland (denominator floor 10,000).
- Mean accumulated autonomy at least 0.72.

Autonomy approaches a bounded target gradually, usually in five-year steps.
Larger population ratios, distance, prolonged supply interruption and parent
instability raise it. Supply and assimilation/contact ties reduce it. Therefore
20% is eligibility, not an automatic independence switch or a promised date.
This is a coarse model of growing self-government and capacity, not an equation
calibrated to particular historical independence dates.

A cohesive, stable parent may contest independence through a civil independence
war when wars are enabled. A weak or disconnected parent can lose its dependency
peacefully. With an actually collapsed parent, a 20-year-old region with 5,000
people and a 500-person community can organize its own government; smaller
orphans continue without a centralized state, preserving their people.

Successor states inherit their parent's political tradition. Their local people
and language reflect actual immigration, assimilation and cultural development.

## Interface, saves and validation

On States/Alliances, clicking or tapping an active colonial landing opens its
province inspector. It shows the parent, governing state, community, supply,
autonomy, regional/homeland ratio and independence date. Parent inspectors link
their dependencies. These are live government records alongside historical maps.

Administration, outpost/charter stage, autonomy, isolation, identity development
and independence records are saved with the world and RNG state. The loader
accepts v0.13.0, v0.14.0 and v0.14.1 checkpoints. On continuation, an older
unclaimed community can resume its charter only if its parent and route survive.
Existing sovereign states and foreign hosts are not annexed by that upgrade.
New model rules intentionally change subsequent outcomes, while save/load within
this version preserves deterministic continuation.

Tests cover actual parent ownership, real emigrants, native minorities,
assimilation controls, earlier founding, administrative reach, alternative supply
ports, regional independence, population ratios, capture, orphaned parents,
maritime warfare, legacy saves and malformed governance fields. Browser checks
exercise map taps, inspectors and portable checkpoints on desktop and phone.
`npm run validate:maritime` runs a prepared 300-year ocean scenario with integrity
checks every ten years. This does not replace a future multi-seed calibration
of complete historical runs.

Validation for this release: all 122 automated tests passed. In the prepared
300-year maritime run, ten-year integrity checks passed; at 1800 it had 29 active
communities, 27 still owned dependencies, and one recorded independent region.
Region and settlement counts differ because connected settlements act together.
These controlled outcomes are not a multi-seed historical calibration.
