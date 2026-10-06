import { PLANETS, SKILLS, buildMission, MAX_BY_LEVEL } from './skills.js';
import * as Store from './store.js';
import { rocket, planet, numberLine } from './visuals.js';
import { pick, escapeHtml, fmt } from './util.js';

const app = document.getElementById('app');
let state = Store.load();
let mission = null;

const persist = () => Store.save(state);
const rocketColor = () => (Store.ROCKETS.find((r) => r.id === state.rocket) || Store.ROCKETS[0]).color;
const planetById = (id) => PLANETS.find((p) => p.id === id);

// ------------------------------------------------------------------ Sons & voix
let audioCtx;
function beep(notes) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(([freq, start, dur]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, audioCtx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + start); o.stop(audioCtx.currentTime + start + dur);
    });
  } catch { /* pas d'audio disponible */ }
}
const sfx = {
  good: () => beep([[523, 0, 0.15], [659, 0.1, 0.15], [784, 0.2, 0.25]]),
  bad: () => beep([[220, 0, 0.25], [196, 0.15, 0.3]]),
  win: () => beep([[523, 0, 0.15], [659, 0.12, 0.15], [784, 0.24, 0.15], [1047, 0.36, 0.4]]),
};

function toSpeech(html) {
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  return txt
    .replace(/(\d) (\d)/g, '$1$2')
    .replace(/×/g, ' fois ').replace(/−/g, ' moins ').replace(/\+/g, ' plus ')
    .replace(/= \?/g, 'égale combien ?').replace(/=/g, ' égale ')
    .replace(/(\d+) h (\d+)/g, '$1 heures $2').replace(/(\d+) h\b/g, '$1 heures')
    .replace(/(\d+) cm\b/g, '$1 centimètres').replace(/(\d+) km\b/g, '$1 kilomètres').replace(/(\d+) m\b/g, '$1 mètres')
    .replace(/(\d+) kg\b/g, '$1 kilos').replace(/(\d+) g\b/g, '$1 grammes').replace(/€/g, ' euros');
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(toSpeech(text));
  u.lang = 'fr-FR'; u.rate = 0.9;
  const fr = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith('fr'));
  if (fr) u.voice = fr;
  speechSynthesis.speak(u);
}
const canSpeak = 'speechSynthesis' in window;

// ------------------------------------------------------------------ Mise en page
function screen(html, cls = '') {
  if (canSpeak) speechSynthesis.cancel();
  setKeyHandler(null);
  app.className = cls;
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

const nav = (active) => `
  <nav class="tabbar">
    <button data-go="home" class="${active === 'home' ? 'on' : ''}"><span>🗺️</span>Carte</button>
    <button data-go="trophies" class="${active === 'trophies' ? 'on' : ''}"><span>🏅</span>Trophées</button>
    <button data-go="parent" class="${active === 'parent' ? 'on' : ''}"><span>👪</span>Parents</button>
  </nav>`;

app.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) { routes[go.dataset.go](); }
});

// ------------------------------------------------------------------ Accueil
function renderOnboarding() {
  let chosen = state.rocket;
  screen(`
    <main class="onboard">
      <div class="hero-rocket">${rocket(rocketColor(), 120)}</div>
      <h1>Fusée Maths</h1>
      <p class="lead">Bienvenue, jeune astronaute ! Comment t'appelles-tu ?</p>
      <input id="name" class="name-input" maxlength="20" autocomplete="off" placeholder="Ton prénom" value="${escapeHtml(state.name)}">
      <p class="lead small">Choisis ta fusée :</p>
      <div class="rocket-pick">${Store.ROCKETS.filter((r) => r.stars === 0).map((r) =>
        `<button class="rocket-opt ${r.id === chosen ? 'on' : ''}" data-r="${r.id}">${rocket(r.color, 64)}</button>`).join('')}</div>
      <button id="go" class="btn primary big">C'est parti ! 🚀</button>
    </main>`, 'space');
  app.querySelectorAll('.rocket-opt').forEach((b) => b.addEventListener('click', () => {
    chosen = b.dataset.r;
    app.querySelectorAll('.rocket-opt').forEach((x) => x.classList.toggle('on', x === b));
  }));
  const go = () => {
    const name = app.querySelector('#name').value.trim();
    if (!name) { app.querySelector('#name').focus(); app.querySelector('#name').classList.add('shake'); return; }
    state.name = name; state.rocket = chosen; persist(); renderHome();
  };
  app.querySelector('#go').addEventListener('click', go);
  app.querySelector('#name').addEventListener('keydown', (e) => e.key === 'Enter' && go());
}

function levelDots(p) {
  let s = '';
  for (let i = 0; i < Store.XP_TO_LEVEL_UP; i++) s += `<i class="${i < p.xp ? 'on' : ''}"></i>`;
  return p.level >= 5 ? '<span class="max">👑 max</span>' : s;
}

function renderHome() {
  if (!state.name) return renderOnboarding();
  screen(`
    <header class="top">
      <div class="hello">${rocket(rocketColor(), 44)}<div><b>Salut ${escapeHtml(state.name)} !</b><small>${state.streak > 1 ? `🔥 ${state.streak} jours de suite` : 'Prêt pour une mission ?'}</small></div></div>
      <div class="star-count">⭐ ${state.stars}</div>
    </header>
    <main class="map">
      <p class="map-title">Choisis une planète à explorer :</p>
      <div class="planets">
        ${PLANETS.map((p) => {
          const ps = state.planets[p.id];
          return `<button class="planet-card" data-planet="${p.id}" style="--c:${p.colors[1]}">
            ${planet(p.colors[0], p.colors[1], p.ring)}
            <b>${p.name}</b><span class="theme">${p.emoji} ${p.theme}</span>
            <span class="lvl">Niveau ${ps.level}</span><span class="dots">${levelDots(ps)}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn mix" data-planet="">🌌 Mission mélange <small>un peu de tout</small></button>
    </main>
    ${nav('home')}`, 'space');
  app.querySelectorAll('[data-planet]').forEach((b) => b.addEventListener('click', () => startMission(b.dataset.planet || null)));
}

// ------------------------------------------------------------------ Mission
function startMission(planetId) {
  const levels = Object.fromEntries(PLANETS.map((p) => [p.id, state.planets[p.id].level]));
  mission = { planetId, questions: buildMission(levels, Store.MISSION_SIZE, state.review, planetId), idx: 0, attempts: 0, score: 0, results: [] };
  const p = planetId && planetById(planetId);
  screen(`
    <main class="launch">
      <div class="launch-rocket">${rocket(rocketColor(), 110)}</div>
      <h2>${p ? `Cap sur ${p.name} !` : 'Mission mélange !'}</h2>
      <p>${p ? `${p.emoji} ${p.theme} — niveau ${state.planets[p.id].level}` : 'Un peu de chaque planète'}</p>
      <p class="small">${Store.MISSION_SIZE} défis à relever</p>
    </main>`, 'space');
  setTimeout(renderQuestion, 1300);
}

function progressBar() {
  const n = mission.questions.length, pct = (mission.idx / n) * 100;
  return `<div class="progress"><div class="track"><div class="fill" style="width:${pct}%"></div>
    <div class="prog-rocket" style="left:${pct}%">${rocket(rocketColor(), 30)}</div></div><span>${mission.idx + 1}/${n}</span></div>`;
}

function answerArea(q) {
  switch (q.type) {
    case 'numpad':
      return `<div class="answer-box"><span class="answer-display" aria-live="polite"></span>${q.suffix ? `<span class="suffix">${q.suffix}</span>` : ''}</div>
        <div class="numpad">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
        <button data-k="del" aria-label="effacer">⌫</button><button data-k="0">0</button><button data-k="ok" class="ok">✓</button></div>`;
    case 'choice':
      return `<div class="choices ${q.choices.every((c) => c.length <= 2) ? 'symbols' : ''}">${q.choices.map((c) => `<button data-c="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div>`;
    case 'order':
      return `<div class="slots">${q.items.map(() => '<button class="slot-btn empty"></button>').join('')}</div>
        <div class="chips">${q.items.map((n, i) => `<button class="chip" data-i="${i}">${fmt(n)}</button>`).join('')}</div>
        <button class="btn primary validate" disabled>Valider ✓</button>`;
    case 'line':
      return `<div class="nl-wrap">${numberLine(q.line.start, q.line.step, q.line.count, q.line.labels)}</div>
        <button class="btn primary validate" disabled>Valider ✓</button>`;
  }
  return '';
}

function renderQuestion() {
  const q = mission.questions[mission.idx];
  mission.attempts = 0;
  locked = false;
  screen(`
    <header class="mission-top"><button class="close" aria-label="quitter">✕</button>${progressBar()}</header>
    <main class="question">
      <div class="q-card">
        <div class="q-prompt"><p>${q.prompt}</p>${canSpeak ? '<button class="speak" aria-label="écouter la consigne">🔊</button>' : ''}</div>
        ${q.visual ? `<div class="q-visual">${q.visual}</div>` : ''}
        <div class="q-answer">${answerArea(q)}</div>
        <div class="feedback" aria-live="assertive"></div>
      </div>
    </main>`, 'mission');

  app.querySelector('.close').addEventListener('click', () => {
    if (confirm('Quitter la mission ? Ta progression sur cette mission sera perdue.')) { clearTimeout(nextTimer); mission = null; renderHome(); }
  });
  const sayText = q.say || q.prompt;
  app.querySelector('.speak')?.addEventListener('click', () => speak(sayText));
  if (state.autoSpeak) setTimeout(() => speak(sayText), 300);

  const handlers = { numpad: bindNumpad, choice: bindChoice, order: bindOrder, line: bindLine };
  handlers[q.type](q);
}

let keyHandler = null;
function setKeyHandler(fn) {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn;
  if (fn) document.addEventListener('keydown', fn);
}

function bindNumpad(q) {
  const display = app.querySelector('.answer-display');
  let value = '';
  const show = () => { display.textContent = value ? fmt(Number(value)) : ''; display.classList.toggle('empty', !value); };
  const press = (k) => {
    if (locked) return;
    if (k === 'del') value = value.slice(0, -1);
    else if (k === 'ok') { if (value !== '') check(Number(value) === q.answer, () => { value = ''; show(); }); return; }
    else if (value.length < 4) value = (value + k).replace(/^0+(?=\d)/, '');
    show();
  };
  show();
  app.querySelectorAll('.numpad button').forEach((b) => b.addEventListener('click', () => press(b.dataset.k)));
  setKeyHandler((e) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter') press('ok');
  });
}

function bindChoice(q) {
  setKeyHandler(null);
  app.querySelectorAll('.choices button').forEach((b) => b.addEventListener('click', () => {
    if (locked || b.disabled) return;
    const ok = b.dataset.c === q.answer;
    b.classList.add(ok ? 'good' : 'bad');
    check(ok, () => { b.disabled = true; });
  }));
}

function bindOrder(q) {
  setKeyHandler(null);
  const slots = [...app.querySelectorAll('.slot-btn')], chips = [...app.querySelectorAll('.chip')];
  const validate = app.querySelector('.validate');
  let placed = [];
  const refresh = () => {
    slots.forEach((s, i) => {
      const idx = placed[i];
      s.textContent = idx === undefined ? '' : fmt(q.items[idx]);
      s.classList.toggle('empty', idx === undefined);
    });
    chips.forEach((c) => c.classList.toggle('used', placed.includes(Number(c.dataset.i))));
    validate.disabled = placed.length !== q.items.length;
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    const i = Number(c.dataset.i);
    if (!locked && !placed.includes(i)) { placed.push(i); refresh(); }
  }));
  slots.forEach((s, i) => s.addEventListener('click', () => {
    if (!locked && placed[i] !== undefined) { placed.splice(i, 1); refresh(); }
  }));
  validate.addEventListener('click', () => {
    const ok = placed.every((idx, i) => q.items[idx] === q.answer[i]);
    check(ok, () => { placed = []; refresh(); });
  });
}

function bindLine(q) {
  setKeyHandler(null);
  const validate = app.querySelector('.validate');
  let sel = null;
  const hits = [...app.querySelectorAll('.nl-hit')];
  hits.forEach((h) => h.addEventListener('click', () => {
    if (locked) return;
    sel = Number(h.dataset.idx);
    hits.forEach((x) => x.classList.toggle('sel', x === h));
    validate.disabled = false;
  }));
  validate.addEventListener('click', () => {
    check(sel === q.answer, () => { sel = null; hits.forEach((x) => x.classList.remove('sel')); validate.disabled = true; });
  });
}

const BRAVO = ['Bravo !', 'Super !', 'Génial !', 'Excellent !', 'Parfait !', 'Bien joué !', 'Trop fort !', 'Waouh !'];
const RETRY = ['Presque !', 'Pas tout à fait…', 'Essaie encore !', 'Oups !'];
let locked = false;
let nextTimer = null;

// Vérifie une réponse : indice à la 1re erreur, correction à la 2e.
function check(ok, resetInput) {
  const q = mission.questions[mission.idx];
  const fb = app.querySelector('.feedback');
  const card = app.querySelector('.q-card');
  if (ok) {
    locked = true;
    const first = mission.attempts === 0;
    if (first) mission.score++;
    mission.results.push(first);
    Store.recordAnswer(state, q.skill, first);
    persist();
    sfx.good();
    card.classList.add('win');
    fb.className = 'feedback good';
    fb.innerHTML = `<b>${pick(BRAVO)}</b> ${first ? '⭐' : ''}`;
    nextTimer = setTimeout(next, 1200);
    return;
  }
  sfx.bad();
  card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  mission.attempts++;
  if (mission.attempts === 1) {
    fb.className = 'feedback hint';
    fb.innerHTML = `<b>${pick(RETRY)}</b><p>💡 ${q.hint}</p>`;
    resetInput();
    return;
  }
  locked = true;
  mission.results.push(false);
  Store.recordAnswer(state, q.skill, false);
  persist();
  fb.className = 'feedback explain';
  fb.innerHTML = `<p>Voici la réponse :</p><p class="expl">${q.explain}</p><button class="btn primary">J'ai compris ➜</button>`;
  fb.querySelector('button').addEventListener('click', next);
  fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function next() {
  if (!mission) return;
  locked = false;
  mission.idx++;
  if (mission.idx < mission.questions.length) renderQuestion();
  else renderResult();
}

function renderResult() {
  setKeyHandler(null);
  const { planetId, score, results } = mission;
  const out = Store.finishMission(state, planetId, score);
  persist();
  sfx.win();
  const p = planetId && planetById(planetId);
  const msg = score === 5 ? 'Mission parfaite !' : score >= 3 ? 'Belle mission !' : 'Mission accomplie !';
  const sub = score === 5 ? 'Tout juste du premier coup, quel champion !' : score >= 3 ? 'Tu progresses très bien.' : 'Chaque mission te rend plus fort. Continue !';
  screen(`
    <main class="result">
      <h2>${msg}</h2>
      <div class="big-stars">${[1, 2, 3].map((i) => `<span class="${i <= out.stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
      <p>${sub}</p>
      <div class="recap">${results.map((r) => `<span class="${r ? 'ok' : 'ko'}">${r ? '✓' : '•'}</span>`).join('')}</div>
      ${out.levelUp ? `<div class="banner level">🎉 Tu passes au <b>niveau ${state.planets[planetId].level}</b> sur ${p.name} !</div>` : ''}
      ${out.newBadges.map((b) => `<div class="banner badge">${b.icon} Nouveau trophée : <b>${b.name}</b></div>`).join('')}
      ${out.newRockets.map((r) => `<div class="banner badge">${rocket(r.color, 28)} Nouvelle fusée débloquée : <b>${r.name}</b> !</div>`).join('')}
      <div class="result-actions">
        <button class="btn primary big" id="again">Encore une mission 🚀</button>
        <button class="btn" data-go="home">Retour à la carte</button>
      </div>
    </main>`, 'space');
  app.querySelector('#again').addEventListener('click', () => startMission(planetId));
  mission = null;
}

// ------------------------------------------------------------------ Trophées
function renderTrophies() {
  screen(`
    <header class="top"><h2>🏅 Mes trophées</h2><div class="star-count">⭐ ${state.stars}</div></header>
    <main class="trophies">
      <h3>Ma fusée</h3>
      <div class="garage">${Store.ROCKETS.map((r) => {
        const open = state.stars >= r.stars;
        return `<button class="rocket-opt ${r.id === state.rocket ? 'on' : ''} ${open ? '' : 'locked'}" data-r="${r.id}" ${open ? '' : 'disabled'}>
          ${rocket(r.color, 56)}<small>${open ? r.name : `🔒 ${r.stars} ⭐`}</small></button>`;
      }).join('')}</div>
      <h3>Trophées</h3>
      <div class="badges">${Store.BADGES.map((b) => {
        const got = state.badges.includes(b.id);
        return `<div class="badge-card ${got ? 'got' : ''}"><span>${got ? b.icon : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`;
      }).join('')}</div>
    </main>
    ${nav('trophies')}`, 'space');
  app.querySelectorAll('.garage .rocket-opt:not(.locked)').forEach((b) => b.addEventListener('click', () => {
    state.rocket = b.dataset.r; persist(); renderTrophies();
  }));
}

// ------------------------------------------------------------------ Espace parents
function renderPinGate() {
  const creating = !state.pin;
  let first = null, code = '';
  const draw = (msg) => {
    screen(`
      <header class="top"><h2>👪 Espace parents</h2></header>
      <main class="pin">
        <p>${msg}</p>
        <div class="pin-dots">${[0, 1, 2, 3].map((i) => `<i class="${i < code.length ? 'on' : ''}"></i>`).join('')}</div>
        <div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
          <button data-k="del">⌫</button><button data-k="0">0</button><button data-go="home">✕</button></div>
      </main>
      ${nav('parent')}`, 'parent-bg');
    app.querySelectorAll('.numpad [data-k]').forEach((b) => b.addEventListener('click', () => press(b.dataset.k)));
  };
  const press = (k) => {
    if (k === 'del') { code = code.slice(0, -1); return draw(currentMsg); }
    code += k;
    if (code.length < 4) return draw(currentMsg);
    if (creating && first === null) { first = code; code = ''; currentMsg = 'Confirme le code :'; return draw(currentMsg); }
    if (creating) {
      if (code === first) { state.pin = code; persist(); return renderParent(); }
      first = null; code = ''; currentMsg = 'Les codes ne correspondent pas. Choisis un code à 4 chiffres :'; return draw(currentMsg);
    }
    if (code === state.pin) return renderParent();
    code = ''; currentMsg = 'Code incorrect. Réessaie :'; draw(currentMsg);
  };
  let currentMsg = creating ? 'Première visite : choisis un code à 4 chiffres pour protéger cet espace.' : 'Entre ton code parent :';
  setKeyHandler(null);
  draw(currentMsg);
}

const PERIODS = ['', 'Période 1 (sept.–oct.)', 'Période 2 (nov.–déc.)', 'Période 3 (janv.–fév.)', 'Période 4 (mars–avril)', 'Période 5 (mai–juin)'];

function renderParent() {
  const rows = SKILLS.map((s) => {
    const st = state.skills[s.id];
    const pct = st ? Math.round((st.firstTry / st.attempts) * 100) : null;
    const cls = pct === null ? 'none' : pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low';
    return `<tr class="${cls}"><td>${planetById(s.planet).emoji} ${s.label}<small>dès le niveau ${s.minLevel}</small></td>
      <td>${st ? st.attempts : '–'}</td><td><span class="pct">${pct === null ? '–' : pct + ' %'}</span></td></tr>`;
  }).join('');
  const review = state.review.map((id) => SKILLS.find((s) => s.id === id)?.label).filter(Boolean);
  const totalQ = Object.values(state.skills).reduce((a, s) => a + s.attempts, 0);
  const totalOk = Object.values(state.skills).reduce((a, s) => a + s.firstTry, 0);

  screen(`
    <header class="top"><h2>👪 Espace parents</h2></header>
    <main class="parent">
      <section class="cards">
        <div><b>${state.missions}</b><small>missions</small></div>
        <div><b>${totalQ ? Math.round((totalOk / totalQ) * 100) : 0} %</b><small>réussi du 1<sup>er</sup> coup</small></div>
        <div><b>${state.bestStreak}</b><small>jours d'affilée (record)</small></div>
      </section>

      <section>
        <h3>Niveaux par planète</h3>
        <p class="note">Le niveau monte seul après ${Store.XP_TO_LEVEL_UP} missions réussies (au moins 4/5 du premier coup). Vous pouvez aussi l'ajuster.</p>
        ${PLANETS.map((p) => `<div class="lvl-row"><span>${p.emoji} <b>${p.name}</b> <small>${p.theme}</small></span>
          <span class="stepper"><button data-lv="${p.id}" data-d="-1" aria-label="baisser">−</button><b>${state.planets[p.id].level}</b><button data-lv="${p.id}" data-d="1" aria-label="monter">+</button></span>
          <small class="period">${PERIODS[state.planets[p.id].level]} · nombres jusqu'à ${fmt(MAX_BY_LEVEL[state.planets[p.id].level])}</small></div>`).join('')}
        <label class="row">Tout régler sur :
          <select id="period"><option value="">— choisir une période —</option>${PERIODS.slice(1).map((t, i) => `<option value="${i + 1}">${t}</option>`).join('')}</select></label>
      </section>

      <section>
        <h3>Notions à revoir</h3>
        ${review.length ? `<ul class="review">${review.map((r) => `<li>${r}</li>`).join('')}</ul>` : '<p class="note">Aucune pour l\'instant 👍</p>'}
      </section>

      <section>
        <h3>Détail par notion</h3>
        <table class="skills"><thead><tr><th>Notion</th><th>Essais</th><th>1<sup>er</sup> coup</th></tr></thead><tbody>${rows}</tbody></table>
      </section>

      <section>
        <h3>Dernières missions</h3>
        ${state.history.length ? `<ul class="history">${state.history.slice(0, 10).map((h) => {
          const p = planetById(h.planet);
          return `<li><span>${h.date.split('-').reverse().join('/')}</span><span>${p ? p.emoji + ' ' + p.name : '🌌 Mélange'}</span><b>${h.score}/${Store.MISSION_SIZE}</b></li>`;
        }).join('')}</ul>` : '<p class="note">Pas encore de mission.</p>'}
      </section>

      <section>
        <h3>Réglages</h3>
        <label class="row">Prénom <input id="pname" maxlength="20" value="${escapeHtml(state.name)}"></label>
        <label class="row"><input type="checkbox" id="snd" ${state.sound ? 'checked' : ''}> Effets sonores</label>
        <label class="row"><input type="checkbox" id="auto" ${state.autoSpeak ? 'checked' : ''} ${canSpeak ? '' : 'disabled'}> Lire chaque consigne à voix haute automatiquement</label>
        <div class="row-btns">
          <button class="btn" id="newpin">Changer le code</button>
          <button class="btn danger" id="reset">Remettre à zéro la progression</button>
        </div>
        <p class="note">Les données restent sur cet appareil (aucun compte, aucun envoi sur internet).</p>
      </section>
    </main>
    ${nav('parent')}`, 'parent-bg');

  app.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => {
    const p = state.planets[b.dataset.lv];
    p.level = Math.min(5, Math.max(1, p.level + Number(b.dataset.d))); p.xp = 0; persist(); renderParent();
  }));
  app.querySelector('#period').addEventListener('change', (e) => {
    const L = Number(e.target.value);
    if (!L) return;
    PLANETS.forEach((p) => { state.planets[p.id].level = L; state.planets[p.id].xp = 0; });
    persist(); renderParent();
  });
  app.querySelector('#pname').addEventListener('change', (e) => { const v = e.target.value.trim(); if (v) { state.name = v; persist(); } });
  app.querySelector('#snd').addEventListener('change', (e) => { state.sound = e.target.checked; persist(); });
  app.querySelector('#auto').addEventListener('change', (e) => { state.autoSpeak = e.target.checked; persist(); });
  app.querySelector('#newpin').addEventListener('click', () => { state.pin = null; persist(); renderPinGate(); });
  app.querySelector('#reset').addEventListener('click', () => {
    if (confirm('Effacer toutes les étoiles, trophées et niveaux ? Cette action est définitive.')) { state = Store.reset(state); persist(); renderParent(); }
  });
}

const routes = { home: renderHome, trophies: renderTrophies, parent: renderPinGate };

// Hors ligne / installation sur l'écran d'accueil.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (canSpeak) speechSynthesis.getVoices();
// Accès de test (?debug) : utilisé par les tests navigateur.
if (new URLSearchParams(location.search).has('debug')) window.__mission = () => mission;

renderHome();
