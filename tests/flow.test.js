import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { LearningContentRepository } from '../public/scripts/learning/content.js';
import { createProgressionManager } from '../public/scripts/learning/progression.js';
import { createRewardLedger } from '../public/scripts/learning/rewards.js';
import { LearningFlowEngine } from '../public/scripts/learning/flow.js';
import { createMemoryStorage } from '../public/scripts/learning/storage.js';

const fetcher = async (url) => {
  const relative = url.startsWith('/') ? url.slice(1) : url;
  const fileUrl = new URL(`../public/${relative}`, import.meta.url);
  const payload = await fs.readFile(fileUrl, 'utf8');
  return {
    json: async () => JSON.parse(payload),
  };
};

test('learning flow awards quest, sequence and daily rewards', async () => {
  const repository = new LearningContentRepository({ fetcher });
  const progression = createProgressionManager({ storage: createMemoryStorage() });
  const ledger = createRewardLedger({ storage: createMemoryStorage(), conversionRate: 0.05, clock: { now: () => Date.parse('2024-04-01T00:00:00Z') } });
  const flow = new LearningFlowEngine({
    contentRepository: repository,
    progressionManager: progression,
    rewardLedger: ledger,
    random: () => 0.2,
  });

  await flow.loadLanguage('en');
  const firstStep = flow.startQuest('seven-labours', { isDaily: true, bonusPoints: 25, dateKey: '2024-04-01' });
  assert.equal(firstStep.type, 'story');
  const sequenceDescriptor = flow.continue();
  assert.equal(sequenceDescriptor.type, 'sequence');
  const sequenceStep = flow.getCurrentStep();
  let result;
  for (let index = 0; index < sequenceStep.sequence.length; index += 1) {
    const target = sequenceStep.sequence[index];
    result = flow.submitSequence(target.id);
    if (index < sequenceStep.sequence.length - 1) {
      assert.equal(result.status, 'progress');
    } else {
      assert.equal(result.status, 'complete');
    }
  }
  const quizDescriptor = result.nextStep;
  assert.equal(quizDescriptor.type, 'quiz');
  const correctOption = quizDescriptor.options.find((option) => option.correct);
  const quizResult = flow.answer(correctOption.id);
  assert.equal(quizResult.status, 'correct');
  const completion = quizResult.nextStep;
  assert.equal(completion.type, 'complete');
  assert.equal(completion.quest.id, 'seven-labours');
  assert.equal(completion.questReward.awarded, true);
  assert.ok(completion.dailyResult.awarded);
  const state = progression.getState();
  assert.equal(state.level, 2);
  assert.ok(state.xp >= 120);
  const summary = ledger.getSummary();
  assert.ok(summary.totalTokens > 0);
  assert.ok(summary.history.length >= 2);
});
