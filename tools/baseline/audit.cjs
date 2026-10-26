// Verify provenance and completeness before archiving a measurement directory.
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),assert=require('node:assert/strict');
const {hash}=require('./engine.cjs');
function audit(out){
 const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8')),summary=JSON.parse(fs.readFileSync(path.join(out,'summary.json'),'utf8'));
 assert.equal(summary.protocol,manifest.identity.protocol.protocol);const ids=new Set();
 for(const file of fs.readdirSync(out).filter(f=>f.endsWith('.json.gz'))){const r=JSON.parse(z.gunzipSync(fs.readFileSync(path.join(out,file))));
  assert.deepEqual(r.source,manifest.identity.source,'A result used a different source: '+file);assert.equal(r.protocol,summary.protocol);assert.ok(!ids.has(r.definition.id));ids.add(r.definition.id);
  for(const t of r.trials){assert.equal(t.endYear-t.startYear,t.simulation.years);assert.ok(t.integrity.length);assert.equal(t.integrity.at(-1).year,t.endYear);assert.ok(t.integrity.every(x=>!x.issues.length),'Integrity issues in '+file);assert.ok(!t.finalSave.error,'Save error in '+file);assert.match(t.finalSave.rawSHA256,/^[a-f0-9]{64}$/);assert.equal(t.outcomes.snapshots.at(-1).year,t.endYear)}
 }
 assert.deepEqual([...ids].sort(),summary.runs.map(r=>r.id).sort());
 const browserPath=path.join(out,'browser.json');if(fs.existsSync(browserPath)){const b=JSON.parse(fs.readFileSync(browserPath));assert.deepEqual(b.source,manifest.identity.source);assert.ok(b.cases.every(c=>!c.errors.length&&!c.integrityIssues.length));assert.equal(b.cases.length,manifest.identity.protocol.browser.viewports.length*2)}
 const files=fs.readdirSync(out).filter(f=>!f.endsWith('.tmp')&&f!=='FILES.sha256').sort();fs.writeFileSync(path.join(out,'FILES.sha256'),files.map(f=>hash(fs.readFileSync(path.join(out,f)))+'  '+f).join('\n')+'\n');
 return {runs:ids.size,browser:fs.existsSync(browserPath),files:files.length};
}
if(require.main===module)try{console.log(JSON.stringify(audit(path.resolve(process.argv[2]||'benchmarks/baselines/v0.16.0'))))}catch(e){console.error(e);process.exitCode=1}
module.exports={audit};
