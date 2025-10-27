import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { LearningContentRepository } from '../public/scripts/learning/content.js';

const fetcher = async (url) => {
  const relative = url.startsWith('/') ? url.slice(1) : url;
  const fileUrl = new URL(`../public/${relative}`, import.meta.url);
  const payload = await fs.readFile(fileUrl, 'utf8');
  return {
    json: async () => JSON.parse(payload),
  };
};

test('learning content repository loads quests and modules', async () => {
  const repository = new LearningContentRepository({ fetcher });
  const enPayload = await repository.loadLanguage('en');
  assert.ok(Array.isArray(enPayload.modules));
  assert.ok(enPayload.modules.length >= 1);
  const monday = repository.getDailyChallenge('en', new Date('2024-04-01T00:00:00Z'));
  assert.equal(monday.quest.id, 'seven-labours');
  assert.equal(monday.bonusPoints, 25);
  const sunday = repository.getDailyChallenge('en', new Date('2024-03-31T00:00:00Z'));
  assert.equal(sunday.quest.id, 'initiation');
  assert.equal(sunday.bonusPoints, 15);
});
