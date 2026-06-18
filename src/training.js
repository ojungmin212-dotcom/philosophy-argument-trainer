export function getDailyStudy(studies, dateString = toDateKey(new Date())) {
  if (!Array.isArray(studies) || studies.length === 0) {
    throw new Error('연구할 명언이 없습니다.');
  }

  const hash = [...dateString].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return studies[hash % studies.length];
}

export function createStudyNote(input) {
  const date = input.date ?? toDateKey(new Date());
  const depthScore = clampScore(Number(input.depthScore ?? 3));

  return {
    date,
    studyId: input.studyId,
    philosopher: input.philosopher ?? '',
    keyInsight: input.keyInsight ?? '',
    agreement: input.agreement ?? '',
    application: input.application ?? '',
    essay: input.essay ?? '',
    depthScore,
    reviewDueDate: addDays(date, 7),
  };
}

export function calculateStudyStats(notes, today = toDateKey(new Date())) {
  const sortedNotes = [...notes].sort((a, b) => a.date.localeCompare(b.date));
  const philosophers = new Set(sortedNotes.map((note) => note.philosopher).filter(Boolean));
  const depthScores = sortedNotes.map((note) => Number(note.depthScore)).filter((score) => !Number.isNaN(score));

  return {
    completedCount: sortedNotes.length,
    philosopherCount: philosophers.size,
    streak: calculateBestStreak(sortedNotes.map((note) => note.date)),
    averageDepth: depthScores.length ? roundToTwo(average(depthScores)) : 0,
    reviewQueueCount: sortedNotes.filter((note) => note.reviewDueDate <= today).length,
    recentNotes: sortedNotes.slice(-5).reverse(),
  };
}

export function toDateKey(date) {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampScore(score) {
  if (Number.isNaN(score)) return 3;
  return Math.min(5, Math.max(1, score));
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
