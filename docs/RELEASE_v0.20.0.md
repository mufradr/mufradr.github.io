# v0.20.0 — Connected civilization development

This release combines the economic, government, warfare and urban-development
checkpoints. It follows v0.16.0; the intermediate v0.17 development versions were
local checkpoints. The release number is v0.20.0 as requested.

Food is harvested by actual residents, moved in bounded amounts over maintained
connections, consumed once and stored with spoilage. Governments collect from
that economy, pay officials, forces, infrastructure and actual tribute, and can
run out of credit. Persistent financial/integration/isolation problems gradually
reduce provincial control and loyalty. Concessions, recovery, rebellion and
exceptional collapse remain possible. Colonies and vassals share these accounts.

Service uses residents already counted in the population. Recruitment removes
civilian labor; deaths are applied once. All fronts share annual offensive and
defensive capacity, with distance, terrain, provisions, ports, funding and
exhaustion limiting operations. Towns contain a subset of province residents;
food, security, commerce and physical works support urban growth. Civic and
scholarly institutions help government and preserve existing knowledge through
changes of regime. Migration, conversion, contact and political separation change
bounded demographic shares without automatically deleting established identities.

The existing province/state/faith/war inspectors explain these effects. Map city
labels rank actual urban residents; the existing zoom/detail limits remain.

## Integration corrections

A full dev.4 pilot exposed defense lock: many small states could rarely project
sufficient forces, while major states survived for millennia without qualifying
half-area decline. The corrected model can concentrate up to the existing 65%
offensive pool in one campaign, with a target-size bound. It never copies the army
for multiple fronts. A state's largest populated adjacent neutral province informs
next-year frontier planning: at most 5% mobilization demand, still limited by the
1% annual recruitment rate, authority, funding and exhaustion. Frontier forces
pay the same operating/provision costs as other campaigning forces. Losing that
exposure returns demand toward peacetime levels. Forests, hills, fiscal stress
and weak integration still constrain consolidation; there are no regional winners
or scripted imperial outcomes.

Maritime religious contact now scales with the source congregation's actual
share. A tiny diaspora no longer gets the same transmission probability as the
whole sending population. New founders require a free faith slot; existing
congregations are not overwritten. Even fractional resident communities retain
their identities during arrivals. Old checkpoints with an orphaned cultural share
but no corresponding minority ID migrate that share back to their recorded
primary people on a detached array.

Stable arrays are cached within carrying-capacity, technology and political cell
loops. Helpers still use the live world and arrays are rebound each call, including
after loading a different world. Regression comparisons retain every checkpoint
value, typed-array byte and RNG state against independent pre-cache loops.

## Validation and interpretation

The [release measurements](../benchmarks/releases/v0.20.0/README.md) preserve the
complete automated suite, genuine old-engine save migrations, exact-value/RNG
continuation, prepared interaction runs, ordinary multi-seed outcomes, CPU samples,
frame delays, memory and save sizes. Three Earth seeds and one generated world
use the original 10,800-year horizons and measurement definitions. Prepared worlds
are reported separately. Concurrent historical timings are excluded from CPU
comparisons; paired before/after CPU trials and browser playback run serially.
The v0.16 archive and its original reproducibility observation remain unchanged.

A seed is reproducible for a given engine and configuration; changed rules can
change the trajectory of an old seed. Save continuation checks compare exact
values/RNG and typed-array bytes. Binary encodings after subsequent entity creation
can differ in sharing of immutable static language metadata; the raw alias-topology
comparison is also recorded rather than equated with a numerical divergence.

This remains an aggregate model. Province cells are coarse, titles are diagnostic
classifications, and state-ID replacement is not equivalent to the destruction
of a population or civilization. A population threshold can produce an early
"kingdom" classification before an archaeological state would be recognized.
Three Earth histories cannot establish regional success probabilities or a
calibrated chronology. Crop/ecological suitability, endemic disease, administration
and long-distance contact still require wider regional calibration. Measurements
state the remaining CPU/save costs and frame delays; viewport emulation does not
measure physical iPhone/iPad hardware or Safari.

## Compatibility and rollback

Progress saves from v0.13.0, v0.14.0/v0.14.1, v0.15.0, v0.16.0 and all four v0.17
development checkpoints remain supported. Old cities start with labelled urban
estimates; no past urban peak, stored food, army casualty history or scholarly
archive is invented. Loading resumes paused. Keep exported originals when
continuing an older world: the v0.16 client cannot read v0.20 checkpoints.
Starting-setup links remain version-specific; they are not progress saves.

The previous published site is **v0.16.0**, commit
`7649533c839bfdc3b01be56be262eba970f026ad`. Its release tag and the annotated
`baseline/v0.16.0-before-civilization-development` tag preserve that tree. Restoring
that tree in a new commit returns the site to the prior published version without
rewriting shared history. The individual development commits remain available for
review; the release report records the measured source independently of its
pre-commit Git parent.
