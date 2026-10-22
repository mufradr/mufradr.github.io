const test = require('node:test');
const assert = require('node:assert/strict');
const {loadCore, snapshot} = require('./core-harness.cjs');
const original = require('./fixtures/simulation.json');

for (const kind of ['earth', 'generated']) {
  test(`${kind}: unchanged elevation, reproducible climate and history, valid population`, () => {
    const app = loadCore();
    app[kind](); app.start();
    const initial = snapshot(app);
    // Climate and agricultural rules intentionally change in 0.8.0. Keep the
    // original terrain baseline and check determinism without blessing new hashes.
    assert.equal(initial.terrain, original[kind].initial.terrain);
    assert.equal(initial.landCells, original[kind].initial.landCells);
    for (let year=0; year<3; year++) app.step();
    const progressed = snapshot(app);
    assert.equal(app.state.year, initial.year+3);
    assert.notEqual(progressed.population, initial.population);
    for (const i of app.world.landIdx) {
      assert.ok(Number.isFinite(app.state.pop[i]) && app.state.pop[i]>=0);
    }
    const repeat = loadCore();
    repeat[kind](); repeat.start();
    assert.deepEqual(snapshot(repeat), initial);
    for (let year=0; year<3; year++) repeat.step();
    assert.deepEqual(snapshot(repeat), progressed);
  });
}
