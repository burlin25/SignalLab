import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {analyze} from '../dist/stats.mjs';

const fixtures=JSON.parse(readFileSync(new URL('./reference.json',import.meta.url)));
for(const [{counts,expected},decision] of fixtures.map((fixture,i)=>[fixture,[0,1,2,1,1,1][i]])){
  test(`Reference comparison for ${counts.join(', ')}`,()=>{
    const result=analyze(...counts,.005);
    for(const [key,value] of Object.entries(expected)){
      const tolerance=key==='p'?1e-7:1e-12;
      assert.ok(Math.abs(result[key]-value)<tolerance,key);
    }
    assert.equal(result.choice,decision);
  });
}
test('Rejects invalid counts',()=>{
  for(const counts of [[0,0,5,1],[5,6,5,1],[5,1.5,5,1],[NaN,1,5,1],[5,1,5,-1],[2**53,1,5,1]]){
    assert.equal(analyze(...counts,.005),null);
  }
});
test('Sparse, zero and very large samples',()=>{
  assert.equal(analyze(1,0,1,1,.005).weak,true);
  const zero=analyze(100,0,100,0,.005);
  assert.equal(zero.p,1);
  assert.equal(zero.relative,null);
  assert.equal(zero.choice,1);
  assert.equal(analyze(10**15,10**14,10**15,2*10**14,.005).choice,0);
});

test("Clear negative effect favors A",()=>{
  assert.equal(analyze(10000,960,10000,800,.005).choice,2);
});
