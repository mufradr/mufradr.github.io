# Browser playback baseline

Headless Chromium, maximum simulation speed, political map, default annotation limits, autosave and event slowdown disabled. Each case warms up 20 years. Viewports emulate layout, not iPhone/iPad hardware or Safari. Frame gaps and Long Tasks measure actual browser scheduling; they differ from headless simulation slice times.

| Scene | Viewport | Completed years/s | Frame-gap p95 / p99 ms | Gaps >50 ms | Long tasks >50 ms | JS heap MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| early | 1280×900 | 24.83 | 16.80 / 16.80 | 0 | 0 | 97.5 |
| developed | 1280×900 | 9.05 | 66.60 / 83.40 | 22 | 29 | 119.8 |
| early | 820×1180 | 9.87 | 16.80 / 16.80 | 1 | 1 | 96.5 |
| developed | 820×1180 | 6.06 | 66.60 / 133.30 | 23 | 24 | 119.0 |
| early | 390×844 | 9.87 | 16.80 / 16.80 | 0 | 0 | 96.9 |
| developed | 390×844 | 7.98 | 33.40 / 133.30 | 13 | 14 | 107.8 |

Eight-second windows are initial samples, not stable estimates of rare delays. JS heap is not total browser or device memory. Pending years and any errors/integrity issues are retained in browser.json.
