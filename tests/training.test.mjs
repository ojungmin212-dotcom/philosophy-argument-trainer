import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateStudyStats,
  createStudyNote,
  getDailyStudy,
} from '../src/training.js';
import { createMemoryStorage, loadResults, RESULTS_KEY, saveResults } from '../src/storage.js';

test('getDailyStudy picks a stable quote study for the same date', () => {
  const studies = [{ id: 'socrates' }, { id: 'kant' }, { id: 'nietzsche' }];

  assert.deepEqual(getDailyStudy(studies, '2026-06-18'), getDailyStudy(studies, '2026-06-18'));
});

test('createStudyNote stores reflection fields and schedules review', () => {
  const note = createStudyNote({
    date: '2026-06-18',
    studyId: 'socrates-examined-life',
    keyInsight: '성찰 없는 삶은 자기 삶의 주인이 되지 못한다.',
    agreement: '나는 동의한다. 습관만으로 사는 삶은 쉽게 남의 기준을 따라간다.',
    application: '오늘 결정 하나를 이유까지 적어 보겠다.',
    essay: '성찰은 삶을 늦추는 일이 아니다. 오히려 내가 왜 사는지 묻는 속도 조절이다. 묻지 않는 삶은 편하지만 깊어지기 어렵다.',
    depthScore: 5,
  });

  assert.equal(note.reviewDueDate, '2026-06-25');
  assert.equal(note.depthScore, 5);
  assert.equal(note.studyId, 'socrates-examined-life');
});

test('calculateStudyStats summarizes notes, philosophers, streak, and reviews', () => {
  const notes = [
    createStudyNote({
      date: '2026-06-16',
      studyId: 'socrates-examined-life',
      philosopher: '소크라테스',
      keyInsight: '',
      agreement: '',
      application: '',
      essay: '',
      depthScore: 4,
    }),
    createStudyNote({
      date: '2026-06-17',
      studyId: 'kant-star-law',
      philosopher: '칸트',
      keyInsight: '',
      agreement: '',
      application: '',
      essay: '',
      depthScore: 5,
    }),
  ];

  const stats = calculateStudyStats(notes, '2026-06-23');

  assert.equal(stats.completedCount, 2);
  assert.equal(stats.philosopherCount, 2);
  assert.equal(stats.streak, 2);
  assert.equal(stats.averageDepth, 4.5);
  assert.equal(stats.reviewQueueCount, 1);
});

test('storage adapter uses the quote study note key', () => {
  const store = createMemoryStorage();

  saveResults([{ studyId: 'kant-star-law', date: '2026-06-18' }], store);

  assert.equal(RESULTS_KEY, 'philosophyQuoteStudy.notes');
  assert.deepEqual(loadResults(store), [{ studyId: 'kant-star-law', date: '2026-06-18' }]);
});

test('storage adapter returns an empty list for invalid JSON', () => {
  const store = createMemoryStorage();

  store.setItem(RESULTS_KEY, '{bad json');

  assert.deepEqual(loadResults(store), []);
});
