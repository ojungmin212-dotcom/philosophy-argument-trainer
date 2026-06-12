export const STEP_LABELS = {
  claim: '주장 찾기',
  reasons: '근거 찾기',
  hiddenPremise: '숨은 전제',
  weakness: '약점 찾기',
  counterargument: '반론 작성',
  position: '입장 정리',
};

export function getDailyPrompt(prompts, dateString = toDateKey(new Date())) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error('훈련 문항이 없습니다.');
  }

  const hash = [...dateString].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return prompts[hash % prompts.length];
}

export function createTrainingResult(input) {
  const date = input.date ?? toDateKey(new Date());
  const stepScores = normalizeStepScores(input.stepScores);
  const selfScore = roundToTwo(average(Object.values(stepScores)));

  return {
    date,
    promptId: input.promptId,
    selectedClaim: input.selectedClaim ?? '',
    selectedReasons: input.selectedReasons ?? [],
    hiddenPremiseAnswer: input.hiddenPremiseAnswer ?? '',
    weaknessAnswer: input.weaknessAnswer ?? '',
    counterargument: input.counterargument ?? '',
    position: input.position ?? '',
    selfScore,
    stepScores,
    reviewDueDate: addDays(date, 3),
  };
}

export function calculateGrowthStats(results, today = toDateKey(new Date())) {
  const sortedResults = [...results].sort((a, b) => a.date.localeCompare(b.date));
  const scoreTotals = createEmptyScoreBuckets();

  sortedResults.forEach((result) => {
    Object.entries(normalizeStepScores(result.stepScores)).forEach(([key, score]) => {
      scoreTotals[key].total += score;
      scoreTotals[key].count += 1;
    });
  });

  const weakestArea = Object.entries(scoreTotals)
    .map(([key, value]) => ({
      key,
      label: STEP_LABELS[key],
      average: value.count ? roundToTwo(value.total / value.count) : 0,
    }))
    .filter((area) => area.average > 0)
    .sort((a, b) => a.average - b.average)[0] ?? {
    key: 'none',
    label: '아직 데이터 없음',
    average: 0,
  };

  return {
    completedCount: sortedResults.length,
    streak: calculateBestStreak(sortedResults.map((result) => result.date)),
    recentScores: sortedResults.slice(-5).map((result) => result.selfScore),
    weakestArea,
    reviewQueueCount: sortedResults.filter((result) => result.reviewDueDate <= today).length,
  };
}

export function toDateKey(date) {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeStepScores(scores = {}) {
  return Object.fromEntries(
    Object.keys(STEP_LABELS).map((key) => [key, clampScore(Number(scores[key] ?? 3))]),
  );
}

function clampScore(score) {
  if (Number.isNaN(score)) return 3;
  return Math.min(5, Math.max(1, score));
}

function createEmptyScoreBuckets() {
  return Object.fromEntries(Object.keys(STEP_LABELS).map((key) => [key, { total: 0, count: 0 }]));
}

function calculateBestStreak(dateStrings) {
  const uniqueDates = [...new Set(dateStrings)].sort();
  if (!uniqueDates.length) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = new Date(`${uniqueDates[index - 1]}T00:00:00`);
    const currentDate = new Date(`${uniqueDates[index]}T00:00:00`);
    const dayDifference = Math.round((currentDate - previous) / 86_400_000);

    if (dayDifference === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function average(numbers) {
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}
