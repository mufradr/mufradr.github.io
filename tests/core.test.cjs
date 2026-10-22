const test = require('node:test');
const assert = require('node:assert/strict');
const {loadCore, snapshot} = require('./core-harness.cjs');
const fixtures = require('./fixtures/simulation.json');

for (const kind of ['earth', 'generated']) {
  test(`${kind}: fixed-seed terrain, climate, population and history match the original app`, () => {
    const app = loadCore();
    app[kind]();
    app.start();
    assert.deepEqual(snapshot(app), fixtures[kind].initial);
    for (let year = 0; year < 3; year++) app.step();
    assert.deepEqual(snapshot(app), fixtures[kind].afterThreeYears);
    assert.equal(app.state.year, fixtures[kind].initial.year + 3);
    for (const i of app.world.landIdx) {
      assert.ok(Number.isFinite(app.state.pop[i]) && app.state.pop[i] >= 0);
    }
  });
}
