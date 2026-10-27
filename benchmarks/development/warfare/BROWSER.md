# Browser playback baseline

Headless Chromium, maximum simulation speed, political map, default annotation limits, autosave and event slowdown disabled. Each case warms up 20 years. Viewports emulate layout, not iPhone/iPad hardware or Safari. Frame gaps and Long Tasks measure actual browser scheduling; they differ from headless simulation slice times.

| Scene | Viewport | Completed years/s | Frame-gap p95 / p99 ms | Gaps >50 ms | Long tasks >50 ms | JS heap MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| early | 1280×900 | 24.86 | 16.70 / 16.80 | 0 | 0 | 106.5 |
| developed | 1280×900 | 11.62 | 50.00 / 66.70 | 9 | 12 | 139.9 |
| early | 820×1180 | 9.87 | 16.70 / 16.80 | 1 | 1 | 100.9 |
| developed | 820×1180 | 9.36 | 33.40 / 83.30 | 13 | 12 | 109.3 |
| early | 390×844 | 9.87 | 16.80 / 16.80 | 0 | 0 | 100.9 |
| developed | 390×844 | 9.48 | 33.40 / 83.30 | 11 | 12 | 138.1 |

Eight-second windows are initial samples, not stable estimates of rare delays. JS heap is not total browser or device memory. Pending years and any errors/integrity issues are retained in browser.json.
