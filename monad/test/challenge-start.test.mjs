import test from 'node:test';import assert from 'node:assert/strict';
import {findChallengeStart,validateNativeRun} from '../shared/challenge-start.mjs';
test('finds exact creation block without an unbounded log request',async()=>{
  let reads=0;const client={getBlockNumber:async()=>50000n,readContract:async({blockNumber})=>{reads++;return blockNumber<12467n?0n:blockNumber<17888n?1n:2n;},getBlock:async({blockNumber})=>({timestamp:1700000000n+blockNumber})};
  const found=await findChallengeStart(client,{address:'test',abi:[],deploymentBlock:10000,id:2});assert.equal(found.blockNumber,17888);assert.equal(found.timestamp,1700017888);assert.ok(reads<20);
  await assert.rejects(()=>findChallengeStart(client,{deploymentBlock:10000,id:3}),/not found/);
});
test('native run eligibility rejects pre-challenge, future, excessive and dirty runs',()=>{
  const now=1791697000000,c={targetMeters:100,endsAt:Math.floor(now/1000)+3600,claimed:0,slots:10},r={started_at:new Date(now-120000).toISOString(),ended_at:new Date(now-60000).toISOString(),duration_sec:60,distance_meters:150,verdict:'CLEAN'};
  const created=Math.floor(now/1000)-600;assert.doesNotThrow(()=>validateNativeRun(r,c,created,now));
  for(const change of [{verdict:'PENDING'},{distance_meters:600},{duration_sec:NaN},{ended_at:new Date(now+60000).toISOString()},{started_at:new Date(now-900000).toISOString()}])assert.throws(()=>validateNativeRun({...r,...change},c,created,now));
  assert.throws(()=>validateNativeRun(r,{...c,claimed:10},created,now));
});
