# v0.20.0 outcome measurements

Measurements, not historical targets. Dates use the engine’s numeric calendar. Ordinary runs and injected stress fixtures are reported separately. See [method](../../../docs/BASELINE.md).

## historical-earth

| Run | Years / trial | First kingdom | First empire | Completed empire-state lifetime median | Major declines: sudden / gradual | Final colonies | Final gzip save MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| earth-development-01 | 10800 | -5,962 | -1,677 | 2,043 | 1 / 5 | 50 | 24.9 |
| earth-development-02 | 10800 | -6,212 | -1,186 | 2,708 | 0 / 8 | 36 | 24.7 |
| earth-development-03 | 10800 | -5,764 | -1,677 | 2,111 | 3 / 9 | 42 | 24.2 |

## ordinary-generated

| Run | Years / trial | First kingdom | First empire | Completed empire-state lifetime median | Major declines: sudden / gradual | Final colonies | Final gzip save MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| generated-development-01 | 10800 | -4,578 | -1,733 | 1,507 | 4 / 5 | 124 | 29.4 |

## prepared-stress

| Run | Years / trial | First kingdom | First empire | Completed empire-state lifetime median | Major declines: sudden / gradual | Final colonies | Final gzip save MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |

## Concurrent history timing and memory (not CPU comparisons)

Kernel timing excludes observation, integrity scans, startup, saving and rendering. Historical rows are a single run. Stress CPU rows use three independent engines within one child process, one engine at a time, with identical final checkpoints; repeat-process memory can include prior engines awaiting garbage collection. RSS includes the runner and save processing.

| Run | Kernel seconds / trial (median) | Slice p95 ms (median) | Slice p99 ms (median) | Maximum slice ms | Process peak RSS MiB | Final saved-world buffers MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| earth-development-01 | 964.80 | 9.37 | 27.97 | 527.18 | 1354.2 | 64.5 |
| earth-development-02 | 984.58 | 9.17 | 29.29 | 499.27 | 1323.2 | 63.1 |
| earth-development-03 | 904.08 | 8.69 | 27.02 | 584.62 | 1354.6 | 64.2 |
| generated-development-01 | 526.35 | 5.31 | 15.71 | 160.76 | 1451.7 | 63.5 |

Ongoing empire states are right-censored and excluded from completed-lifetime medians. Decline measures formal state IDs, so succession/replacement can register as abrupt loss without an equivalent collapse of population or civilization. Regional snapshots, all state observations, seed/settings, memory samples and exact checkpoint hashes are preserved in the compressed run files.
