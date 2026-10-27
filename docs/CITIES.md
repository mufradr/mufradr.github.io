# Cities, learning and communities — 0.17.0-dev.4

Chunk 5 connects urban life to the [economy](ECONOMY.md),
[government](GOVERNMENT.md), [campaigns](WARFARE.md) and
[overseas communities](COLONIES.md). This is a local development checkpoint;
full historical calibration and publication as v0.17.0 follow at integration.

## Residents, food and work

Each existing city record now stores actual urban residents, separately from the
whole province. Rural residents are `province population − urban population`.
Urbanization relocates existing residents; it never creates extra people or an
extra set of food consumers. Births, migration, epidemics and military deaths
first change the town proportionally to its province. Annual urban relocation
then approaches a supportable target, faster in decline than growth (6% versus
1.8% of the remaining gap per year).

The target depends on farming, administration, maintained roads/works, portable
records, commerce, capital status and established institutions. Its baseline
share is bounded at 38%, then reduced by actual annual food coverage and security.
Food uses the same conserved production/transport ledger as the rest of the
simulation. Security reflects control, loyalty, war exhaustion and shocks;
stateless communities use local cohesion. A large carrying capacity alone cannot
support a town while its actual harvest or supply routes fail.

Urban residents spend 65% of their civilian labor outside harvesting. Mobilized
people are taken from the same workforce: the urban labor deduction applies only
to the non-drafted fraction, avoiding a second deduction for drafted townspeople.
Urban people still consume the ordinary single human ration. There is no new
urban food warehouse or separate campaign charge.

The ten-year site-discovery pass can identify settled, food-supported farming
communities with at least 12,000 province residents and a target of 1,500 urban
residents. A new town begins with at most 500 urban residents and grows toward
support. Holy sites may begin smaller. Cities need not belong to states. Sites
retain their names/founding dates through decline, conquest and recovery; there
is at most one city record per map cell. Map labels prioritize actual towns of at
least 3,000 residents, using the existing screen-space density limits.

## Institutions outlive governments

Civic institutions and scholarship develop gradually where urban density,
administrative/writing knowledge, food, security and maintained works support
them. State institutions draw support from the **existing** administration-paid
fraction; communal institutions depend on local commerce. No second education or
administration payment is charged. Institutions deteriorate with prolonged loss
of support rather than being deleted when ownership changes.

Actual civic residents add a small urban fiscal base, collected once through
the existing provincial collection factor. Urban administration adds
`min(8, 2 × log(1 + civic population / 10,000))` governing capacity. Culture uses
actual urban and scholarly residents, replacing the old whole-province proxy.
The strongest surviving scholarly town can host inventions instead of always
using the political capital. Normal population, local skill and other invention
prerequisites still apply.

`institutions × scholarship` provides bounded knowledge preservation. It improves
diffusion and reduces institutional/isolation losses, but does not eliminate
decay. A supported town lazily allocates one fixed-length technique archive. Every
five years it copies only locally present knowledge, decays stored knowledge and
can gradually teach back an already discovered technique. Empty ruins cannot
practice or teach. Archives are not a global invention unlock. Mature stateless
centres can make rare local inventions with population/skill/geography/date gates;
techniques requiring a multi-province state remain unavailable by that route.
At most two such discoveries occur globally per five-year pass.

## Contact, identity and bounded demographics

Each province retains **two peoples and three faiths**, using fixed typed-array
slots. The largest group determines the map colour. The faith slots include folk
beliefs, so a native organized faith, folk community and immigrant faith can
coexist. Population/follower censuses include represented minorities; dominant
province counts and historic map footprints remain separate. Minority-only
groups can remain alive. Older recorded peaks retain their original meaning;
past minority distributions cannot be reconstructed from an older save.

Ordinary and maritime migration move real source residents with their people and
faith, retaining existing minority headcounts. Moving people still carry their
identities when assimilation/conversion is disabled. Transfers into a province
with no compatible free slot are refused rather than erasing another community.
Large migrating groups seek compatible arrival cells; a blocked group can keep
searching. Small established minorities are no longer automatically discarded
merely for falling below 3% or losing a shipping subsidy.

Conversion and political integration change shares gradually. Contact through
neighbors and maintained trade routes spreads beliefs; political authority,
autonomy and local institutions affect integration. Ethnic-faith restrictions
and existing rule toggles remain applicable. Trade/contact also exchange bounded
cultural practices without renaming peoples or replacing their language/ancestry.
Persistent mixing can still produce daughter identities with recorded parents.
Political separation/isolation influence existing cultural divergence and church
schisms. A regional church branch relabels that parent congregation, preserves
other faiths and records the parent faith; it is organizational succession rather
than an instant conversion of every resident.

This remains an aggregate model: culture and faith are separate marginal shares,
not a household cross-tabulation. Ordinary emigrants represent a cohort of the
source's largest people and faith, capped by both available shares. Existing
large forced migrations still use their aggregate affiliation at departure;
the new arrival rules preserve host communities but do not reconstruct detailed
source households. Fixed slots can constrain contact in an already diverse port.
There are no individual citizens, clerics or scholar agents.

## Inspectors, saves and cost

Province inspectors explain urban/rural residents, recorded urban peak,
institutions, food/security and established archived techniques. State inspectors
show actual urban share, civic capacity and the current learning centre. Faith
inspectors distinguish followers/represented communities from dominant map cells.

Saves retain all these fields. v0.13–v0.16 and dev.1–dev.3 worlds remain readable.
Old city records counted the whole province; migration preserves their site
identity and stores that old peak separately. Starting urban residents are a
**labelled estimate**, 4–12% of province population depending on administration.
Their prior urban peak is unknown. No historical archive or faith minorities are
invented. Current-format partial/malformed fields are rejected before installation.
Envelope schema 1 and binary graph schema 3 are unchanged; older engines reject
the new engine version explicitly.

Four fixed faith arrays add **1,280,000 bytes** before compression. Each developed
city adds a small record and, when needed, a fixed technique archive. Annual work
visits city records, builds one holy-site index and reuses political/production
scans; it does not search all pairs of cities or provinces. The site census remains
ten-yearly. Bounded storage does not imply a zero runtime/save cost.

Focused tests cover growth/decline/recovery, workforce accounting, provincial
scholarship, archives after collapse, prerequisites, exact migration headcounts,
identity preservation, gradual conversion, minority censuses, old-save estimates,
exact continuation and desktop/phone inspectors. Prepared scenario and performance
results are preserved in the [checkpoint report](../benchmarks/development/cities/README.md).
Prepared worlds are not evidence of realistic historical urbanization rates.
