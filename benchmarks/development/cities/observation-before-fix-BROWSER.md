# Browser playback baseline

Headless Chromium, maximum simulation speed, political map, default annotation limits, autosave and event slowdown disabled. Each case warms up 20 years. Viewports emulate layout, not iPhone/iPad hardware or Safari. Frame gaps and Long Tasks measure actual browser scheduling; they differ from headless simulation slice times.

| Scene | Viewport | Completed years/s | Frame-gap p95 / p99 ms | Gaps >50 ms | Long tasks >50 ms | JS heap MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| early | 1280×900 | 24.75 | 16.80 / 33.30 | 1 | 0 | 108.8 |
| developed | 1280×900 | 9.86 | 50.00 / 66.70 | 8 | 16 | 146.4 |
| early | 820×1180 | 9.87 | 16.80 / 16.80 | 0 | 0 | 104.1 |
| developed | 820×1180 | 8.23 | 33.40 / 83.40 | 13 | 13 | 134.0 |
| early | 390×844 | 9.87 | 16.70 / 16.80 | 0 | 1 | 106.4 |
| developed | 390×844 | 7.97 | 33.40 / 99.90 | 11 | 11 | 139.5 |

Eight-second windows are initial samples, not stable estimates of rare delays. JS heap is not total browser or device memory. Pending years and any errors/integrity issues are retained in browser.json.
