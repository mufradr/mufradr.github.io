# Browser playback baseline

Headless Chromium, maximum simulation speed, political map, default annotation limits, autosave and event slowdown disabled. Each case warms up 20 years. Viewports emulate layout, not iPhone/iPad hardware or Safari. Frame gaps and Long Tasks measure actual browser scheduling; they differ from headless simulation slice times.

| Scene | Viewport | Completed years/s | Frame-gap p95 / p99 ms | Gaps >50 ms | Long tasks >50 ms | JS heap MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| early | 1280×900 | 24.87 | 16.80 / 16.80 | 0 | 0 | 96.3 |
| developed | 1280×900 | 10.78 | 50.00 / 66.70 | 10 | 16 | 138.6 |
| early | 820×1180 | 9.87 | 16.80 / 16.80 | 0 | 0 | 98.1 |
| developed | 820×1180 | 8.97 | 33.40 / 100.10 | 12 | 13 | 101.2 |
| early | 390×844 | 9.87 | 16.80 / 16.80 | 0 | 1 | 95.6 |
| developed | 390×844 | 9.37 | 33.40 / 83.40 | 12 | 13 | 98.7 |

Eight-second windows are initial samples, not stable estimates of rare delays. JS heap is not total browser or device memory. Pending years and any errors/integrity issues are retained in browser.json.
