# Browser playback baseline

Headless Chromium, maximum simulation speed, political map, default annotation limits, autosave and event slowdown disabled. Each case warms up 20 years. Viewports emulate layout, not iPhone/iPad hardware or Safari. Frame gaps and Long Tasks measure actual browser scheduling; they differ from headless simulation slice times.

| Scene | Viewport | Completed years/s | Frame-gap p95 / p99 ms | Gaps >50 ms | Long tasks >50 ms | JS heap MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| early | 1280×900 | 24.87 | 16.80 / 16.80 | 0 | 0 | 108.2 |
| developed | 1280×900 | 9.60 | 50.00 / 66.60 | 12 | 16 | 134.2 |
| early | 820×1180 | 9.87 | 16.80 / 16.80 | 0 | 0 | 104.9 |
| developed | 820×1180 | 7.37 | 33.40 / 100.00 | 12 | 15 | 129.7 |
| early | 390×844 | 9.87 | 16.80 / 16.80 | 0 | 0 | 103.6 |
| developed | 390×844 | 7.97 | 33.40 / 100.00 | 11 | 12 | 147.3 |

Eight-second windows are initial samples, not stable estimates of rare delays. JS heap is not total browser or device memory. Pending years and any errors/integrity issues are retained in browser.json.
