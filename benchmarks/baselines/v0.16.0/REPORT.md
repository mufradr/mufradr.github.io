# v0.16.0 development baseline

Measurements, not historical targets. Dates use the engine’s numeric calendar. Ordinary runs and injected stress fixtures are reported separately. See [method](../../../docs/BASELINE.md).

## historical-earth

| Run | Years / trial | First kingdom | First empire | Completed empire-state lifetime median | Major declines: sudden / gradual | Final colonies | Final gzip save MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| earth-development-01 | 10800 | -5,477 | -2,082 | 1,001 | 105 / 21 | 82 | 23.4 |
| earth-development-02 | 10800 | -5,645 | -2,378 | 888 | 116 / 18 | 75 | 25.5 |
| earth-development-03 | 10800 | -5,509 | -1,879 | 1,190 | 79 / 18 | 73 | 24.3 |

## ordinary-generated

| Run | Years / trial | First kingdom | First empire | Completed empire-state lifetime median | Major declines: sudden / gradual | Final colonies | Final gzip save MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| generated-development-01 | 10800 | -4,552 | -2,001 | 1,087 | 53 / 15 | 152 | 19.6 |

## prepared-stress

| Run | Years / trial | First kingdom | First empire | Completed empire-state lifetime median | Major declines: sudden / gradual | Final colonies | Final gzip save MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| stress-developed | 120 | 1,420 | 1,420 | 42 | 2 / 9 | 35 | 9.7 |
| stress-early | 120 | — | — | — | 0 / 0 | 0 | 7.2 |
| stress-maritime | 300 | 1,669 | — | — | 0 / 0 | 25 | 7.7 |

## Measured kernel cost and memory

Kernel timing excludes observation, integrity scans, startup, saving and rendering. Historical rows are a single run. Stress CPU rows use three independent engines within one child process, one engine at a time, with identical final checkpoints; repeat-process memory can include prior engines awaiting garbage collection. RSS includes the runner and save processing.

| Run | Kernel seconds / trial (median) | Slice p95 ms (median) | Slice p99 ms (median) | Maximum slice ms | Process peak RSS MiB | Final saved-world buffers MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| earth-development-01 | 351.56 | 3.68 | 9.56 | 105.94 | 1128.0 | 60.7 |
| earth-development-02 | 369.59 | 3.92 | 9.93 | 75.48 | 1367.7 | 61.0 |
| earth-development-03 | 327.47 | 3.36 | 9.05 | 59.60 | 1264.0 | 60.8 |
| generated-development-01 | 253.87 | 2.78 | 7.86 | 39.44 | 1046.5 | 58.3 |
| stress-developed | 7.58 | 5.83 | 16.54 | 90.18 | 499.5 | 56.6 |
| stress-early | 1.95 | 1.75 | 6.53 | 33.56 | 245.2 | 56.2 |
| stress-maritime | 7.10 | 2.43 | 8.74 | 40.50 | 289.2 | 56.2 |

Ongoing empire states are right-censored and excluded from completed-lifetime medians. Decline measures formal state IDs, so succession/replacement can register as abrupt loss without an equivalent collapse of population or civilization. Regional snapshots, all state observations, seed/settings, memory samples and exact checkpoint hashes are preserved in the compressed run files.
