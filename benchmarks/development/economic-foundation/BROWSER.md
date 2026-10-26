# Browser playback baseline

Headless Chromium, maximum simulation speed, political map, default annotation limits, autosave and event slowdown disabled. Each case warms up 20 years. Viewports emulate layout, not iPhone/iPad hardware or Safari. Frame gaps and Long Tasks measure actual browser scheduling; they differ from headless simulation slice times.

| Scene | Viewport | Completed years/s | Frame-gap p95 / p99 ms | Gaps >50 ms | Long tasks >50 ms | JS heap MiB |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| early | 1280×900 | 24.85 | 16.70 / 16.80 | 0 | 0 | 100.7 |
| developed | 1280×900 | 10.55 | 50.00 / 66.70 | 14 | 20 | 122.1 |
| early | 820×1180 | 9.87 | 16.80 / 16.80 | 0 | 0 | 98.0 |
| developed | 820×1180 | 8.36 | 49.90 / 116.50 | 13 | 15 | 127.6 |
| early | 390×844 | 9.87 | 16.70 / 16.80 | 0 | 0 | 96.9 |
| developed | 390×844 | 8.69 | 33.40 / 100.00 | 13 | 14 | 108.5 |

Eight-second windows are initial samples, not stable estimates of rare delays. JS heap is not total browser or device memory. Pending years and any errors/integrity issues are retained in browser.json.
