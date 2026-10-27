# Saved worlds — 0.17.0-dev.3

Open **Saves** on a phone, tablet or desktop. Three manual slots hold independent
histories. Give a slot a name and choose **Save here**. A save finishes any pending
simulation year, then leaves playback paused. Slot details show the year,
population, active states, terrain source, timestamp and engine version.

**Load** opens a slot at its saved year, paused; press Play to continue. Replacing
an occupied manual slot asks first and retains one **previous save**. Loading a
slot or file also keeps the current world in **Before last load**. This recovery
slot is separate from manual slots and the three rotating autosaves. If local
storage cannot hold recovery data, loading requires an explicit choice to
continue without that recovery copy. Export the current world first to keep it.
Deleting a manual slot deletes its previous-save backup too.

## Autosaves and device storage

Autosave is on by default. After one minute, the next completed simulation year
starts a save. Pausing also requests a save when the year has changed. Three
slots rotate from oldest to newest, independently of manual slots. Unchanged
paused worlds are not saved repeatedly. Only one save/load operation runs at a
time. Autosaves never capture a suspended generator midway through its year.

Slots use IndexedDB, not the small localStorage preference store. Transactions
replace a slot only after a successful commit; failures leave prior slots intact.
The app requests persistent storage on manual saves where supported. Availability
and persistence remain browser-controlled: private browsing, clearing site data,
changing the site's origin, or iOS storage cleanup can remove local saves. Opening
the app again shows the Saves tab when slots exist; it never silently replaces
one of them with the freshly generated world.

Saving when a tab is backgrounded is best effort. iOS may suspend the page before
an asynchronous save finishes, so periodic backups and exported files are the
reliable fallback. No server, account or automatic cloud synchronization is used.

## Export and import on iPhone/iPad

**Export current world** downloads a `.worldengine` file. Each occupied slot also
has **Export file**. Keep exports in Files or iCloud Drive, and use **Import world
file** on another device. A manual slot need not exist to export a world.
The file picker allows all files so Safari does not hide an unfamiliar extension;
file content and size are validated after selection. Setup JSON files and seed
links only recreate starting conditions; they are not progress saves.

Damaged, unsupported or structurally invalid imports are rejected before the
running world is replaced. Loading a valid file requires confirmation. This first
save schema accepts v0.13.0, v0.14.0, v0.14.1, v0.15.0 and this engine version; future releases need explicit
compatibility handling or migrations. Older local records are never deleted just
because their engine version differs; they remain exportable.

## Format and continuation

The data-only schema includes the complete world (including imported terrain),
current and initial rules, climate settings, every simulation array, entities,
chronicles, peak maps, migrations, disease records, maritime routes/communities,
and the random generator's current state. A small view record restores map mode,
knowledge selections, annotation switches, camera, speed and end-of-era pause state.
Playback always resumes paused. Historic map previews are not a replay state.

The codec records a graph with explicit references, typed-array byte blocks,
Maps and Sets, preserving shared technique arrays and entity references. Functions
are not serialized or evaluated. The RNG exposes its integer state without an
extra random draw. The binary format has a magic header, schema marker and CRC32
checksum; browsers supporting CompressionStream wrap it in gzip. This checksum
checks accidental damage; it is not an authenticity signature.

Encoding/compression and decoding/decompression run in a dedicated worker on
HTTP(S). Capturing a snapshot still requires a synchronous structured clone of the
world, so very large worlds can cause a brief pause. During loading, the worker
transfers the imported bytes and decoded array buffers instead of copying them
again; shared references are preserved. File URLs or browsers without
workers use a main-thread fallback. File input is limited to 256 MiB; expanded
saves are limited to 512 MiB, including a 128 MiB graph-header limit. The initial
Earth save is approximately 8.5 MiB compressed; size grows with recorded history.

Validation checks array types/sizes, references, parameters, entity identity,
terrain links and simulation consistency before swapping globals. The pre-existing
colony-coast diagnostic is advisory: communities with valid stored records are not
rejected merely because a valid land source fails the existing coastal-source
diagnostic. Destinations must still be coastal land and all locations valid.
No simulation rules or random sequence were intentionally changed.

Tests compare every world/state value and RNG state after saving and reloading an
advanced maritime world and continuing forty years, and exercise generated and
imported maps. Browser tests cover manual slots, previous/recovery backups,
rotating autosaves, reload persistence, pending-year completion, file round trips,
invalid imports, quota failures and desktop/phone layouts.

## v0.14 compact storage

Graph schema 3 shares object-property layouts, represents uniform arrays with one
byte pattern, packs long numeric histories into
exact-width integer or Float64 blocks and groups byte positions before gzip.
It restores histories as ordinary JavaScript arrays. Floating-point bytes,
signed zero and aliases remain exact. Full chronicles and peak maps are retained; no histories are pruned to fit a save.
Legacy graph schemas 1 and 2 remain readable. Engine v0.13.0, v0.14.0, v0.14.1 and v0.15.0 saves are accepted after
structural validation; subsequent simulated years use the updated founding rules.

The limits also include four million graph nodes. They protect browser memory,
not a paid storage tier. Actual available device memory and IndexedDB quota can
still be lower, so larger limits are not a guarantee on every iPhone/iPad. Export
remains available when local storage is full. See OPTIMIZATION.md for measurements.

Colony administration, autonomy, isolation, cultural development and independence
records are included in world saves. Legacy records acquire the additional fields
on continuation. Only eligible unclaimed communities can resume surviving parent
charters; already sovereign states and foreign treaty hosts retain ownership.


## v0.16 connected economy

Saves retain persistent food stress, dated food-crisis reports and the latest
state food/trade totals. The temporary production, export-budget and route-income
grids stay outside checkpoints. Starting or installing a world releases the old
cache; the next simulated year rebuilds the budgets from that world's population,
production, roads, routes and wars. Continuing older saves uses the new economics.


## Economic foundation development saves

The local 0.17.0-dev.1 build writes economyVersion 1 with food reserves and physical
infrastructure condition, the maintenance clock, and small food/government ledgers.
New arrays and ledger identities are validated before installation. Published
v0.16 and earlier saves receive empty stocks and intact condition on a detached
state root. Existing population, techniques, IDs and aliases are preserved; later
years follow the new model. Keep original exports for rollback.

The development engine version prevents the released v0.16 client from accepting
new saves while ignoring their economic fields. Final v0.17 release compatibility
must explicitly retain these development saves. See ECONOMY.md for rules and units.

### Government checkpoint (0.17.0-dev.2)

Government version 1 saves provincial control, loyalty, autonomy and the recorded
administrator, the annual clock, dependency allegiance/protection and the tribute
transfer ledger. Validated v0.13–v0.16 and economic-development saves gain initial
control/loyalty from existing integration, zero autonomy and no fabricated past
tribute. Partial new schemas, nonfinite/out-of-range values and dependency cycles
are rejected. `0.17.0-dev.1` remains accepted; old clients reject dev.2 saves.
Preserve both development versions in the final release's compatibility allowlist.
See [GOVERNMENT.md](GOVERNMENT.md) for units, accounting and migration limits.

### Campaign checkpoint (0.17.0-dev.3)

Warfare version 1 saves an annual clock and small state-level service, supply,
funding, exhaustion and casualty records. No new military map grids are saved.
Completed saves reject unsettled regular military deaths, invalid service pools
and broken manpower/food/fiscal identities. Legacy worlds and dev.1/dev.2 saves
start military bookkeeping without fabricated past armies or casualty histories.
The final release must keep all development versions in its compatibility list.
See [WARFARE.md](WARFARE.md) for accounting, scheduling and model limits.
