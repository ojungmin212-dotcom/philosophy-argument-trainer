import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateGrowthStats,
  createTrainingResult,
  getDailyPrompt,
} from '../src/training.js';
import { createMemoryStorage, loadResults, saveResults } from '../src/storage.js';

test('getDailyPrompt picks a stable prompt for the same date', () => {
  const prompts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  assert.deepEqual(getDailyPrompt(prompts, '2026-06-12'), getDailyPrompt(prompts, '2026-06-12'));
});

test('createTrainingResult stores step scores and review date', () => {
  const result = createTrainingResult({
    date: '2026-06-12',
    promptId: 'pleasure-life',
    selectedClaim: 'More pleasure makes a better life.',
    selectedReasons: ['Happiness is pleasure.'],
    hiddenPremiseAnswer: 'A better life is a happier life.',
    weaknessAnswer: 'It ignores meaning.',
    counterargument: 'Pleasure alone is not enough.',
    position: 'Pleasure matters. Meaning also matters. A good life needs both.',
    stepScores: {
      claim: 4,
      reasons: 4,
      hiddenPremise: 3,
      weakness: 3,
      counterargument: 2,
      position: 3,
    },
  });

  assert.equal(result.reviewDueDate, '2026-06-15');
  assert.equal(result.selfScore, 3.17);
});

test('calculateGrowthStats finds streak, weak area, and review queue', () => {
  const results = [
    createTrainingResult({
      date: '2026-06-10',
      promptId: 'a',
      selectedClaim: '',
      selectedReasons: [],
      hiddenPremiseAnswer: '',
      weaknessAnswer: '',
      counterargument: '',
      position: '',
      stepScores: {
        claim: 5,
        reasons: 4,
        hiddenPremise: 2,
        weakness: 3,
        counterargument: 2,
        position: 4,
      },
    }),
    createTrainingResult({
      date: '2026-06-11',
      promptId: 'b',
      selectedClaim: '',
      selectedReasons: [],
      hiddenPremiseAnswer: '',
      weaknessAnswer: '',
      counterargument: '',
      position: '',
      stepScores: {
        claim: 4,
        reasons: 4,
        hiddenPremise: 2,
        weakness: 3,
        counterargument: 1,
        position: 4,
      },
    }),
  ];

  const stats = calculateGrowthStats(results, '2026-06-13');
  assert.equal(stats.completedCount, 2);
  assert.equal(stats.streak, 2);
  assert.equal(stats.weakestArea.key, 'counterargument');
  assert.equal(stats.reviewQueueCount, 1);
});

test('storage adapter saves and loads training results', () => {
  const store = createMemoryStorage();

  saveResults([{ promptId: 'a', date: '2026-06-12' }], store);

  assert.deepEqual(loadResults(store), [{ promptId: 'a', date: '2026-06-12' }]);
});

test('storage adapter returns an empty list for invalid JSON', () => {
  const store = createMemoryStorage();

  store.setItem('philosophyArgumentTrainer.results', '{bad json');

  assert.deepEqual(loadResults(store), []);
});
