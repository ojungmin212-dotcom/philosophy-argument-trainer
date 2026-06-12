import { conceptCards, trainingPrompts } from './content.js';
import {
  STEP_LABELS,
  calculateGrowthStats,
  createTrainingResult,
  getDailyPrompt,
  toDateKey,
} from './training.js';
import { loadResults, saveResults } from './storage.js';

const state = {
  activeView: 'today',
  today: toDateKey(new Date()),
  results: loadResults(),
};

const elements = {
  navButtons: [...document.querySelectorAll('.nav-button')],
  views: [...document.querySelectorAll('.view')],
  todayView: document.querySelector('#today-view'),
  conceptsView: document.querySelector('#concepts-view'),
  notesView: document.querySelector('#notes-view'),
  growthView: document.querySelector('#growth-view'),
};

bindNavigation();
renderAll();
registerServiceWorker();

function bindNavigation() {
  elements.navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.activeView = button.dataset.view;
      renderNavigation();
    });
  });
}

function renderAll() {
  renderNavigation();
  renderToday();
  renderConcepts();
  renderNotes();
  renderGrowth();
}

function renderNavigation() {
  elements.navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === state.activeView);
  });
  elements.views.forEach((view) => {
    view.classList.toggle('active', view.id === `view-${state.activeView}`);
  });
}

function renderToday() {
  const prompt = getDailyPrompt(trainingPrompts, state.today);
  const completedToday = state.results.find((result) => result.date === state.today);

  elements.todayView.replaceChildren(
    createPromptPanel(prompt),
    completedToday ? createCompletedPanel(prompt, completedToday) : createTrainingForm(prompt),
  );
}

function createPromptPanel(prompt) {
  const panel = document.createElement('article');
  panel.className = 'prompt-panel';
  panel.innerHTML = `
    <div class="prompt-meta">
      <span>${prompt.topic}</span>
      <span>입문</span>
      <span>${state.today}</span>
    </div>
    <p class="argument-text">${escapeHtml(prompt.argumentText)}</p>
    <div class="argument-map" aria-label="논증 구조 시각화">
      <div>
        <strong>근거</strong>
        <span>이유를 찾기</span>
      </div>
      <div>
        <strong>전제</strong>
        <span>숨은 가정 보기</span>
      </div>
      <div>
        <strong>결론</strong>
        <span>핵심 주장 쓰기</span>
      </div>
    </div>
  `;
  return panel;
}

function createTrainingForm(prompt) {
  const form = document.createElement('form');
  form.className = 'training-form';
  form.innerHTML = `
    <section class="form-block">
      <h3>1. 주장과 근거</h3>
      <label>
        핵심 주장
        <input name="selectedClaim" type="text" required placeholder="이 논증이 최종적으로 말하려는 것" />
      </label>
      <label>
        근거
        <textarea name="selectedReasons" required rows="3" placeholder="주장을 지지하는 이유를 한 줄씩 적으세요."></textarea>
      </label>
    </section>

    <section class="form-block">
      <h3>2. 숨은 전제와 약점</h3>
      <label>
        숨은 전제
        <textarea name="hiddenPremiseAnswer" required rows="3" placeholder="이 논증이 몰래 기대고 있는 가정"></textarea>
      </label>
      <label>
        약점 또는 논리 오류
        <textarea name="weaknessAnswer" required rows="3" placeholder="빠진 조건, 과장, 성급한 결론 등을 찾으세요."></textarea>
      </label>
    </section>

    <section class="form-block">
      <h3>3. 반론과 내 입장</h3>
      <label>
        반론 1개
        <textarea name="counterargument" required rows="3" placeholder="상대 주장의 약점을 겨냥해 쓰세요."></textarea>
      </label>
      <label>
        내 입장 3문장
        <textarea name="position" required rows="4" placeholder="첫째 문장: 내 입장. 둘째 문장: 이유. 셋째 문장: 결론."></textarea>
      </label>
    </section>

    <section class="score-panel" aria-label="단계별 자기 점수">
      <h3>4. 자기 점수</h3>
      <div class="score-grid">
        ${Object.entries(STEP_LABELS).map(([key, label]) => createScoreControl(key, label)).join('')}
      </div>
    </section>

    <button class="primary-action" type="submit">훈련 저장</button>
  `;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const stepScores = Object.fromEntries(
      Object.keys(STEP_LABELS).map((key) => [key, Number(formData.get(key))]),
    );

    const result = createTrainingResult({
      date: state.today,
      promptId: prompt.id,
      selectedClaim: formData.get('selectedClaim'),
      selectedReasons: String(formData.get('selectedReasons'))
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      hiddenPremiseAnswer: formData.get('hiddenPremiseAnswer'),
      weaknessAnswer: formData.get('weaknessAnswer'),
      counterargument: formData.get('counterargument'),
      position: formData.get('position'),
      stepScores,
    });

    state.results = [...state.results.filter((item) => item.date !== state.today), result];
    saveResults(state.results);
    renderAll();
  });

  return form;
}

function createScoreControl(key, label) {
  return `
    <label class="score-control">
      <span>${label}</span>
      <select name="${key}">
        <option value="5">5 매우 잘함</option>
        <option value="4">4 잘함</option>
        <option value="3" selected>3 보통</option>
        <option value="2">2 어려움</option>
        <option value="1">1 다시 학습</option>
      </select>
    </label>
  `;
}

function createCompletedPanel(prompt, result) {
  const panel = document.createElement('article');
  panel.className = 'completed-panel';
  panel.innerHTML = `
    <div class="result-header">
      <div>
        <p class="eyebrow">Saved</p>
        <h3>오늘 훈련 완료</h3>
      </div>
      <strong>${result.selfScore.toFixed(2)} / 5</strong>
    </div>
    <div class="comparison-grid">
      <section>
        <h4>모범 분석</h4>
        <dl>
          <dt>주장</dt>
          <dd>${escapeHtml(prompt.modelClaim)}</dd>
          <dt>근거</dt>
          <dd>${prompt.modelReasons.map(escapeHtml).join('<br />')}</dd>
          <dt>숨은 전제</dt>
          <dd>${escapeHtml(prompt.hiddenPremise)}</dd>
          <dt>약점</dt>
          <dd>${escapeHtml(prompt.weakness)}</dd>
          <dt>예시 반론</dt>
          <dd>${escapeHtml(prompt.sampleCounterargument)}</dd>
        </dl>
      </section>
      <section>
        <h4>내 답변</h4>
        <dl>
          <dt>주장</dt>
          <dd>${escapeHtml(result.selectedClaim)}</dd>
          <dt>근거</dt>
          <dd>${result.selectedReasons.map(escapeHtml).join('<br />') || '입력 없음'}</dd>
          <dt>숨은 전제</dt>
          <dd>${escapeHtml(result.hiddenPremiseAnswer)}</dd>
          <dt>반론</dt>
          <dd>${escapeHtml(result.counterargument)}</dd>
          <dt>입장</dt>
          <dd>${escapeHtml(result.position)}</dd>
        </dl>
      </section>
    </div>
    <button class="secondary-action" type="button">오늘 답변 다시 작성</button>
  `;

  panel.querySelector('button').addEventListener('click', () => {
    state.results = state.results.filter((item) => item.date !== state.today);
    saveResults(state.results);
    renderAll();
  });

  return panel;
}

function renderConcepts() {
  elements.conceptsView.replaceChildren(
    ...conceptCards.map((card) => {
      const article = document.createElement('article');
      article.className = 'concept-card';
      article.innerHTML = `
        <p class="eyebrow">${escapeHtml(card.id)}</p>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.definition)}</p>
        <dl>
          <dt>예시</dt>
          <dd>${escapeHtml(card.example)}</dd>
          <dt>주의</dt>
          <dd>${escapeHtml(card.commonMistake)}</dd>
          <dt>미니 퀴즈</dt>
          <dd>${escapeHtml(card.quiz)}</dd>
          <dt>답</dt>
          <dd>${escapeHtml(card.answer)}</dd>
        </dl>
      `;
      return article;
    }),
  );
}

function renderNotes() {
  if (!state.results.length) {
    elements.notesView.replaceChildren(createEmptyState('아직 저장된 논증 노트가 없습니다.'));
    return;
  }

  const promptById = new Map(trainingPrompts.map((prompt) => [prompt.id, prompt]));
  elements.notesView.replaceChildren(
    ...[...state.results]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((result) => {
        const prompt = promptById.get(result.promptId);
        const note = document.createElement('article');
        note.className = 'note-card';
        note.innerHTML = `
          <div class="note-header">
            <span>${escapeHtml(result.date)}</span>
            <strong>${escapeHtml(prompt?.topic ?? '훈련')}</strong>
            <span>${result.selfScore.toFixed(2)} / 5</span>
          </div>
          <p class="note-argument">${escapeHtml(prompt?.argumentText ?? '')}</p>
          <dl>
            <dt>내가 찾은 주장</dt>
            <dd>${escapeHtml(result.selectedClaim)}</dd>
            <dt>내 반론</dt>
            <dd>${escapeHtml(result.counterargument)}</dd>
            <dt>내 입장</dt>
            <dd>${escapeHtml(result.position)}</dd>
          </dl>
        `;
        return note;
      }),
  );
}

function renderGrowth() {
  const stats = calculateGrowthStats(state.results, state.today);
  const growth = document.createElement('div');
  growth.className = 'growth-layout';
  growth.innerHTML = `
    <div class="stat-grid">
      <article class="stat-card">
        <span>연속 학습</span>
        <strong>${stats.streak}일</strong>
      </article>
      <article class="stat-card">
        <span>완료 훈련</span>
        <strong>${stats.completedCount}개</strong>
      </article>
      <article class="stat-card">
        <span>복습 대기</span>
        <strong>${stats.reviewQueueCount}개</strong>
      </article>
      <article class="stat-card">
        <span>가장 약한 영역</span>
        <strong>${escapeHtml(stats.weakestArea.label)}</strong>
      </article>
    </div>
    <article class="growth-panel">
      <h3>최근 자기 점수</h3>
      <div class="score-bars">
        ${
          stats.recentScores.length
            ? stats.recentScores
                .map(
                  (score) => `
                    <div class="score-bar">
                      <span style="height: ${Math.max(8, score * 18)}%"></span>
                      <strong>${score.toFixed(1)}</strong>
                    </div>
                  `,
                )
                .join('')
            : '<p class="empty-copy">훈련을 완료하면 점수가 표시됩니다.</p>'
        }
      </div>
    </article>
  `;
  elements.growthView.replaceChildren(growth);
}

function createEmptyState(message) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = message;
  return empty;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // The app still works without offline caching.
    });
  });
}
