import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressionManager } from '../src/learning/progression.js';
import { createMemoryStorage } from '../src/learning/storage.js';

test('awarding points updates level and xp', () => {
  const progression = createProgressionManager({ storage: createMemoryStorage() });
  const award = progression.awardPoints(150, { reason: 'quest' });
  assert.equal(award.awarded, true);
  assert.equal(award.level, 2);
  const state = progression.getState();
  assert.equal(state.level, 2);
  assert.equal(state.xp, 150);
  assert.ok(state.xpToNextLevel < 120);
});

test('daily challenge streak increments once per day', () => {
  const progression = createProgressionManager({ storage: createMemoryStorage() });
  const first = progression.completeDailyChallenge({ dateKey: '2024-04-01', questId: 'initiation', bonusPoints: 10 });
  assert.equal(first.awarded, true);
  assert.equal(first.streak, 1);
  const repeat = progression.completeDailyChallenge({ dateKey: '2024-04-01', questId: 'initiation', bonusPoints: 10 });
  assert.equal(repeat.awarded, false);
  const second = progression.completeDailyChallenge({ dateKey: '2024-04-02', questId: 'initiation', bonusPoints: 10 });
  assert.equal(second.streak, 2);
});
