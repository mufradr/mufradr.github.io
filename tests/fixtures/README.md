# Simulation baseline

`simulation.json` was captured from the original inline scripts in commit
`7e3247b`, before extracting them into separate files. It records SHA-256 hashes
of complete terrain, climate, population, ethnicity, and polity arrays, plus the
chronicle, at initialization and after three simulation years.

Both the Earth world (with climate fitting) and a generated world are covered.
Seeds and options are specified in `../core-harness.cjs`. Tests run on Node.js 24.
These fixtures protect existing behavior; they do not establish that the model
is scientifically accurate or cover every long-term simulation outcome.

If an intentional simulation change requires updating these expectations, review
and explain the changed results rather than regenerating fixtures just to pass.
