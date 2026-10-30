import test from 'node:test';
import assert from 'node:assert/strict';
import { xpForLevel, levelForXP, xpFromRemaining, huntMetrics, pauseHunt, resumeHunt, stopHunt, completeHunt } from '../src/domain/xp';
import type { HuntSession } from '../src/types';

test('shared experience table and threshold boundaries', () => {
  for (const [level, xp] of [[1,0],[8,4200],[20,98800],[25,204800],[26,232500],[50,1847300],[100,15694800]]) {
    assert.equal(xpForLevel(level), xp); assert.equal(levelForXP(xp), level);
    if (xp > 0) assert.equal(levelForXP(xp - 1), level - 1);
  }
  assert.equal(xpFromRemaining(20, 25), 111700);
  assert.equal(levelForXP(xpFromRemaining(20, 0)), 20, 'rounded 0% does not imply a level up');
  assert.throws(() => levelForXP(-1)); assert.throws(() => levelForXP(1.2));
});
test('pause time excluded and stop freezes duration before XP entry', () => {
  const s: HuntSession = { id:'h',characterId:'c',serverId:'s',startedAt:0,stoppedAt:null,startXP:100000,endXP:null,location:'',notes:'',intervals:[{start:0,end:null}],checkpoints:[],status:'running' };
  pauseHunt(s, 1200000); resumeHunt(s, 1800000); stopHunt(s, 3300000);
  assert.equal(huntMetrics(s, 9000000).seconds, 2700);
  assert.equal(huntMetrics(s, 9000000).rate, null);
  completeHunt(s, 115000);
  assert.equal(huntMetrics(s).gain, 15000); assert.equal(huntMetrics(s).rate, 20000);
  stopHunt(s, 12000000); assert.equal(huntMetrics(s).seconds, 2700);
});
test('zero duration, negative gain and checkpoint-only live pace', () => {
  const s: HuntSession = { id:'h',characterId:'c',serverId:'s',startedAt:0,stoppedAt:null,startXP:110000,endXP:null,location:'',notes:'',intervals:[{start:0,end:null}],checkpoints:[],status:'running' };
  assert.equal(huntMetrics(s,3600000).rate,null);
  s.checkpoints.push({id:'cp',at:1800000,xp:120000,activeSeconds:1800});
  assert.equal(huntMetrics(s,3600000).rate,20000);
  stopHunt(s,3600000); completeHunt(s,100000);
  assert.equal(huntMetrics(s).rate,-10000); assert.equal(huntMetrics(s).eta,null);
  s.durationOverride=0; assert.equal(huntMetrics(s).rate,null);
});
