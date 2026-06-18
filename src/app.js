import { quoteStudies } from './content.js?v=20260618';
import {
  calculateStudyStats,
  createStudyNote,
  getDailyStudy,
  toDateKey,
} from './training.js?v=20260618';
import { loadResults, saveResults } from './storage.js?v=20260618';

const state = {
  activeView: 'today',
  today: toDateKey(new Date()),
  notes: loadResults(),
};

const elements = {
  navButtons: [...document.querySelectorAll('.nav-button')],
  views: [...document.querySelectorAll('.view')],
  todayView: document.querySelector('#today-view'),
  philosophersView: document.querySelector('#philosophers-view'),
  notesView: document.querySelector('#notes-view'),
  archiveView: document.querySelector('#archive-view'),
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
  renderPhilosophers();
  renderNotes();
  renderArchive();
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
  const study = getDailyStudy(quoteStudies, state.today);
  const note = state.notes.find((item) => item.date === state.today && item.studyId === study.id);

  elements.todayView.replaceChildren(
    createQuoteHero(study),
    createResearchSections(study),
    note ? createSavedStudyPanel(study, note) : createStudyNoteForm(study),
  );
}

function createQuoteHero(study) {
  const hero = document.createElement('article');
  hero.className = 'prompt-panel quote-hero';
  hero.innerHTML = `
    <div class="prompt-meta">
      <span>${escapeHtml(study.philosopher)}</span>
      <span>${escapeHtml(study.period)}</span>
      <span>${state.today}</span>
    </div>
    <p class="quote-mark">“</p>
    <p class="argument-text">${escapeHtml(study.quote)}</p>
    <div class="quote-source">
      <strong>${escapeHtml(study.theme)}</strong>
      <span>${escapeHtml(study.source)}</span>
    </div>
    <div class="argument-map" aria-label="오늘의 연구 핵심">
      <div>
        <strong>핵심 질문</strong>
        <span>${escapeHtml(study.coreQuestion)}</span>
      </div>
      <div>
        <strong>전통</strong>
        <span>${escapeHtml(study.tradition)}</span>
      </div>
      <div>
        <strong>인물</strong>
        <span>${escapeHtml(study.portraitTone)}</span>
      </div>
    </div>
  `;
  return hero;
}

function createResearchSections(study) {
  const wrapper = document.createElement('section');
  wrapper.className = 'research-layout';
  wrapper.innerHTML = `
    <article class="research-card">
      <p class="eyebrow">Context</p>
      <h3>사상적 배경</h3>
      <p>${escapeHtml(study.background)}</p>
    </article>
    <article class="research-card major">
      <p class="eyebrow">Deep Reading</p>
      <h3>심층 해석</h3>
      <p>${escapeHtml(study.deepReading)}</p>
    </article>
    <article class="research-card">
      <p class="eyebrow">Tension</p>
      <h3>숨은 긴장</h3>
      <p>${escapeHtml(study.hiddenTension)}</p>
    </article>
    <article class="research-card">
      <p class="eyebrow">Misreading</p>
      <h3>오해하기 쉬운 지점</h3>
      <p>${escapeHtml(study.misunderstanding)}</p>
    </article>
    <article class="research-card">
      <p class="eyebrow">Opposition</p>
      <h3>반대 입장</h3>
      <p>${escapeHtml(study.opposingView)}</p>
    </article>
    <article class="research-card major">
      <p class="eyebrow">Now</p>
      <h3>오늘의 의미</h3>
      <p>${escapeHtml(study.modernMeaning)}</p>
    </article>
    <article class="research-card prompt-list">
      <p class="eyebrow">Questions</p>
      <h3>연구 질문</h3>
      <ul>
        ${study.studyPrompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join('')}
      </ul>
    </article>
    <article class="research-card keyword-card">
      <p class="eyebrow">Terms</p>
      <h3>핵심 개념</h3>
      <div class="keyword-list">
        ${study.keyTerms.map((term) => `<span>${escapeHtml(term)}</span>`).join('')}
      </div>
    </article>
  `;
  return wrapper;
}

function createStudyNoteForm(study) {
  const form = document.createElement('form');
  form.className = 'training-form study-form';
  form.innerHTML = `
    <section class="form-block">
      <h3>1. 오늘의 핵심 이해</h3>
      <label>
        내가 붙잡은 핵심
        <textarea name="keyInsight" required rows="4" placeholder="이 명언이 말하는 가장 깊은 뜻을 내 언어로 정리하세요."></textarea>
      </label>
    </section>
    <section class="form-block">
      <h3>2. 동의와 반대</h3>
      <label>
        나의 입장
        <textarea name="agreement" required rows="4" placeholder="어디에 동의하고, 어디에 걸리는지 적으세요."></textarea>
      </label>
    </section>
    <section class="form-block">
      <h3>3. 삶에 적용</h3>
      <label>
        오늘의 적용
        <textarea name="application" required rows="4" placeholder="오늘 내 삶의 어떤 장면에 적용할 수 있나요?"></textarea>
      </label>
    </section>
    <section class="form-block">
      <h3>4. 3문장 철학 에세이</h3>
      <label>
        짧은 에세이
        <textarea name="essay" required rows="5" placeholder="첫 문장: 해석. 둘째 문장: 나의 입장. 셋째 문장: 삶의 적용."></textarea>
      </label>
    </section>
    <section class="score-panel">
      <h3>오늘의 연구 깊이</h3>
      <label class="score-control">
        깊이 점수
        <select name="depthScore">
          <option value="5">5 오래 붙잡고 생각함</option>
          <option value="4">4 꽤 깊게 이해함</option>
          <option value="3" selected>3 핵심은 잡음</option>
          <option value="2">2 아직 흐릿함</option>
          <option value="1">1 다시 읽어야 함</option>
        </select>
      </label>
    </section>
    <button class="primary-action" type="submit">오늘의 연구 저장</button>
  `;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const note = createStudyNote({
      date: state.today,
      studyId: study.id,
      philosopher: study.philosopher,
      keyInsight: formData.get('keyInsight'),
      agreement: formData.get('agreement'),
      application: formData.get('application'),
      essay: formData.get('essay'),
      depthScore: Number(formData.get('depthScore')),
    });

    state.notes = [
      ...state.notes.filter((item) => !(item.date === state.today && item.studyId === study.id)),
      note,
    ];
    saveResults(state.notes);
    renderAll();
  });

  return form;
}

function createSavedStudyPanel(study, note) {
  const panel = document.createElement('article');
  panel.className = 'completed-panel';
  panel.innerHTML = `
    <div class="result-header">
      <div>
        <p class="eyebrow">Saved Study</p>
        <h3>오늘의 연구 저장됨</h3>
      </div>
      <strong>${note.depthScore} / 5</strong>
    </div>
    <div class="comparison-grid">
      <section>
        <h4>오늘의 명언</h4>
        <dl>
          <dt>철학자</dt>
          <dd>${escapeHtml(study.philosopher)}</dd>
          <dt>명언</dt>
          <dd>${escapeHtml(study.quote)}</dd>
          <dt>출처</dt>
          <dd>${escapeHtml(study.source)}</dd>
        </dl>
      </section>
      <section>
        <h4>내 연구 노트</h4>
        <dl>
          <dt>핵심 이해</dt>
          <dd>${escapeHtml(note.keyInsight)}</dd>
          <dt>나의 입장</dt>
          <dd>${escapeHtml(note.agreement)}</dd>
          <dt>삶에 적용</dt>
          <dd>${escapeHtml(note.application)}</dd>
          <dt>3문장 에세이</dt>
          <dd>${escapeHtml(note.essay)}</dd>
        </dl>
      </section>
    </div>
    <button class="secondary-action" type="button">오늘 연구 다시 작성</button>
  `;

  panel.querySelector('button').addEventListener('click', () => {
    state.notes = state.notes.filter((item) => !(item.date === state.today && item.studyId === study.id));
    saveResults(state.notes);
    renderAll();
  });

  return panel;
}

function renderPhilosophers() {
  elements.philosophersView.replaceChildren(
    ...quoteStudies.map((study) => {
      const card = document.createElement('article');
      card.className = 'concept-card philosopher-card';
      card.innerHTML = `
        <p class="eyebrow">${escapeHtml(study.tradition)}</p>
        <h3>${escapeHtml(study.philosopher)}</h3>
        <p>${escapeHtml(study.portraitTone)}</p>
        <dl>
          <dt>시대</dt>
          <dd>${escapeHtml(study.period)}</dd>
          <dt>대표 명언</dt>
          <dd>${escapeHtml(study.quote)}</dd>
          <dt>핵심 질문</dt>
          <dd>${escapeHtml(study.coreQuestion)}</dd>
        </dl>
      `;
      return card;
    }),
  );
}

function renderNotes() {
  if (!state.notes.length) {
    elements.notesView.replaceChildren(createEmptyState('아직 저장된 연구 노트가 없습니다.'));
    return;
  }

  const studyById = new Map(quoteStudies.map((study) => [study.id, study]));
  elements.notesView.replaceChildren(
    ...[...state.notes]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((note) => {
        const study = studyById.get(note.studyId);
        const card = document.createElement('article');
        card.className = 'note-card';
        card.innerHTML = `
          <div class="note-header">
            <span>${escapeHtml(note.date)}</span>
            <strong>${escapeHtml(study?.philosopher ?? note.philosopher)}</strong>
            <span>${note.depthScore} / 5</span>
          </div>
          <p class="note-argument">${escapeHtml(study?.quote ?? '')}</p>
          <dl>
            <dt>핵심 이해</dt>
            <dd>${escapeHtml(note.keyInsight)}</dd>
            <dt>나의 입장</dt>
            <dd>${escapeHtml(note.agreement)}</dd>
            <dt>3문장 에세이</dt>
            <dd>${escapeHtml(note.essay)}</dd>
          </dl>
        `;
        return card;
      }),
  );
}

function renderArchive() {
  const stats = calculateStudyStats(state.notes, state.today);
  const archive = document.createElement('div');
  archive.className = 'growth-layout';
  archive.innerHTML = `
    <div class="stat-grid">
      <article class="stat-card">
        <span>연속 연구</span>
        <strong>${stats.streak}일</strong>
      </article>
      <article class="stat-card">
        <span>완료 연구</span>
        <strong>${stats.completedCount}건</strong>
      </article>
      <article class="stat-card">
        <span>만난 철학자</span>
        <strong>${stats.philosopherCount}명</strong>
      </article>
      <article class="stat-card">
        <span>평균 깊이</span>
        <strong>${stats.averageDepth.toFixed(1)}</strong>
      </article>
    </div>
    <article class="growth-panel archive-panel">
      <h3>명언 전체 목록</h3>
      <div class="archive-list">
        ${quoteStudies
          .map(
            (study) => `
              <section>
                <strong>${escapeHtml(study.philosopher)}</strong>
                <p>${escapeHtml(study.quote)}</p>
                <span>${escapeHtml(study.source)}</span>
              </section>
            `,
          )
          .join('')}
      </div>
    </article>
  `;
  elements.archiveView.replaceChildren(archive);
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
