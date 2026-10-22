const fs = require('node:fs');
const path = require('node:path');
const { inflateSync } = require('node:zlib');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');

// Evaluate the DOM-free engine without adding a production testing API.
function loadCore() {
  const source = ['assets/earth.js', 'js/core.js', 'js/experiments.js', 'js/diagnostics.js']
    .map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  return Function('inflateSync', source + `
    return {
      earth() {
        const e = decodeEarth(inflateSync(Uint8Array.from(atob(EARTH_ELEV_B64), c => c.charCodeAt(0))), inflateSync(Uint8Array.from(atob(KOPPEN_B64), c => c.charCodeAt(0))));
        WD = genWorld({seed:'Earth', earth:true, height:e.height, kg:e.kg, fit:true});
      },
      generated() { WD = genWorld({seed:'regression-world', landFrac:P.landFrac}); },
      start() { newHistory('regression-history'); },
      step, inspect(code) {return eval(code);}, get world() {return WD;}, get state() {return S;}
    };
  `)(inflateSync);
}
function hash(array) {
  return createHash('sha256').update(Buffer.from(array.buffer, array.byteOffset, array.byteLength)).digest('hex');
}
function snapshot(app) {
  const w = app.world, s = app.state;
  return {
    landCells:w.landIdx.length,
    terrain:hash(w.elev), temperature:hash(w.T), rainfall:hash(w.Pr),
    year:s.year, population:hash(s.pop), peoples:hash(s.eth),
    states:hash(s.pol), chronicle:JSON.parse(JSON.stringify(s.chron))
  };
}
module.exports = {loadCore, snapshot};
