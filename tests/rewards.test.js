import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardLedger } from '../public/scripts/learning/rewards.js';
import { createMemoryStorage } from '../public/scripts/learning/storage.js';

test('reward ledger converts points to REAL tokens', () => {
  const ledger = createRewardLedger({ storage: createMemoryStorage(), conversionRate: 0.1, clock: { now: () => 0 } });
  const outcome = ledger.registerReward(50, { reason: 'questCompletion' });
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.tokens, 5);
  const summary = ledger.getSummary();
  assert.equal(summary.totalTokens, 5);
  assert.equal(summary.history.length, 1);
  assert.equal(summary.history[0].meta.reason, 'questCompletion');
});
