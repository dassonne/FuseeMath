import { PLANETS, SKILLS, buildMission, buildFlash, NUM_MAX, TABLES_BY_LEVEL } from './skills.js';
import * as Store from './store.js';
import { rocket, planet, numberLine, alien } from './visuals.js';
import { pick, escapeHtml, fmt } from './util.js';

const app = document.getElementById('app');
let state = Store.load();
let mission = null;

const persist = () => Store.save(state);
const rocketColor = () => (Store.ROCKETS.find((r) => r.id === state.rocket) || Store.ROCKETS[0]).color;
const planetById = (id) => PLANETS.find((p) => p.id === id);

// ------------------------------------------------------------------ Sons & voix
let audioCtx;
function beep(notes, type = 'triangle') {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(([freq, start, dur]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, audioCtx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + start); o.stop(audioCtx.currentTime + start + dur);
    });
  } catch { /* pas d'audio disponible */ }
}
const sfx = {
  good: () => { beep([[880, 0, 0.08], [660, 0.05, 0.08], [440, 0.1, 0.1]], 'square'); beep([[523, 0.15, 0.15], [784, 0.25, 0.25]]); },
  bad: () => beep([[220, 0, 0.25], [196, 0.15, 0.3]]),
  win: () => beep([[523, 0, 0.15], [659, 0.12, 0.15], [784, 0.24, 0.15], [1047, 0.36, 0.4]]),
  boss: () => beep([[196, 0, 0.3], [185, 0.3, 0.3], [175, 0.6, 0.5]], 'sawtooth'),
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
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(toSpeech(text));
  u.lang = 'fr-FR'; u.rate = 0.9;
  const fr = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith('fr'));
  if (fr) u.voice = fr;
  speechSynthesis.speak(u);
}
const canSpeak = 'speechSynthesis' in window;

// ------------------------------------------------------------------ Mise en page
let keyHandler = null;
function setKeyHandler(fn) {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn;
  if (fn) document.addEventListener('keydown', fn);
}

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
  if (go) routes[go.dataset.go]();
});

// ------------------------------------------------------------------ Accueil
function renderOnboarding() {
  let chosen = state.rocket;
  screen(`
    <main class="onboard">
      <div class="hero-rocket">${rocket(rocketColor(), 120)}</div>
      <h1>Fusée Maths</h1>
      <p class="lead">Des aliens farceurs ont envahi les planètes des maths ! Toi seul peux les capturer. Comment t'appelles-tu, jeune astronaute ?</p>
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
    const input = app.querySelector('#name'), name = input.value.trim();
    if (!name) { input.focus(); input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); return; }
    state.name = name; state.rocket = chosen; persist(); renderHome();
  };
  app.querySelector('#go').addEventListener('click', go);
  app.querySelector('#name').addEventListener('keydown', (e) => e.key === 'Enter' && go());
}

function levelDots(p) {
  if (p.master) return '<span class="max">👑 Maître</span>';
  if (Store.bossReady(p)) return '<span class="boss-tag">⚔️ Boss !</span>';
  let s = '';
  for (let i = 0; i < Store.XP_TO_BOSS; i++) s += `<i class="${i < p.xp ? 'on' : ''}"></i>`;
  return s;
}

function dailyGoal() {
  const n = Store.todayCount(state);
  if (n >= Store.DAILY_GOAL) return '<div class="goal done">✅ Objectif du jour atteint, bravo !</div>';
  return `<div class="goal">🎯 Objectif du jour : ${Array.from({ length: Store.DAILY_GOAL }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')} <small>${n}/${Store.DAILY_GOAL} missions</small></div>`;
}

function renderHome() {
  if (!state.name) return renderOnboarding();
  screen(`
    <header class="top">
      <div class="hello">${rocket(rocketColor(), 44)}<div><b>Salut ${escapeHtml(state.name)} !</b><small>${state.streak > 1 ? `🔥 ${state.streak} jours de suite` : 'Prêt pour une mission ?'}</small></div></div>
      <div class="star-count">⭐ ${state.stars}</div>
    </header>
    <main class="map">
      ${dailyGoal()}
      <div class="planets">
        ${PLANETS.map((p) => {
          const ps = state.planets[p.id];
          return `<button class="planet-card ${Store.bossReady(ps) ? 'has-boss' : ''}" data-planet="${p.id}" style="--c:${p.colors[1]}">
            ${planet(p.colors[0], p.colors[1], p.ring)}
            <b>${p.name}</b><span class="theme">${p.emoji} ${p.theme}</span>
            <span class="lvl">Niveau ${ps.level}</span><span class="dots">${levelDots(ps)}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn mix" data-planet="">🌌 Mission mélange <small>un peu de tout</small></button>
    </main>
    ${nav('home')}`, 'space');
  app.querySelectorAll('[data-planet]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.planet || null;
    if (id && Store.bossReady(state.planets[id])) renderBossIntro(id);
    else startMission(id, 'normal');
  }));
}

// ------------------------------------------------------------------ Missions & combats
function makeFoe(planetId, kind) {
  const pid = planetId || pick(PLANETS).id, L = state.planets[pid].level;
  const boss = kind !== 'normal';
  return {
    id: boss ? `${pid}-boss-${L}` : `${pid}-${L}`, planet: pid, level: L, boss,
    name: boss ? Store.BOSS_NAMES[pid] : Store.ALIEN_NAMES[pid][L - 1], color: Store.ALIEN_COLORS[pid],
  };
}
const foeSvg = (f, size) => alien(f.color, f.level, f.boss, size);

function renderBossIntro(planetId) {
  const p = planetById(planetId), L = state.planets[planetId].level;
  const foe = makeFoe(planetId, 'boss');
  const flash = planetId === 'calcul';
  sfx.boss();
  screen(`
    <main class="launch boss-intro">
      <div class="boss-big">${foeSvg(foe, 150)}</div>
      <h2>${foe.name} t'attend !</h2>
      <p>C'est le boss du niveau ${L} sur ${p.name}.</p>
      <p class="rule">${flash
        ? (state.flashTimer ? `⚡ <b>Défi éclair</b> : ${Store.FLASH.size} calculs en 3 minutes. Réussis-en ${Store.FLASH.toWin} pour gagner !` : `⚡ <b>Défi éclair</b> : ${Store.FLASH.size} calculs. Réussis-en ${Store.FLASH.toWin} du premier coup pour gagner !`)
        : `⚔️ ${Store.BOSS.size} défis. Réussis-en ${Store.BOSS.toWin} du premier coup pour gagner !`}</p>
      <p class="small">${L < 5 ? `Si tu gagnes : niveau ${L + 1} débloqué !` : 'Si tu gagnes : tu deviens Maître de la planète !'}</p>
      <div class="result-actions">
        <button class="btn primary big" id="fight">Combattre ⚔️</button>
        <button class="btn" id="later">Plus tard : mission normale</button>
      </div>
    </main>`, 'space');
  app.querySelector('#fight').addEventListener('click', () => startMission(planetId, flash ? 'flash' : 'boss'));
  app.querySelector('#later').addEventListener('click', () => startMission(planetId, 'normal'));
}

function startMission(planetId, kind) {
  const levels = Object.fromEntries(PLANETS.map((p) => [p.id, state.planets[p.id].level]));
  const opts = { tables: state.tables };
  const questions = kind === 'flash' ? buildFlash(levels.calcul, Store.FLASH.size, opts)
    : buildMission(levels, kind === 'boss' ? Store.BOSS.size : Store.MISSION_SIZE, state.review, planetId, opts);
  const foe = makeFoe(planetId, kind);
  mission = { planetId, kind, questions, idx: 0, attempts: 0, score: 0, hits: 0, results: [], foe, deadline: null, timer: null };
  const p = planetId && planetById(planetId);
  screen(`
    <main class="launch">
      <div class="launch-rocket">${rocket(rocketColor(), 100)}</div>
      <h2>${p ? `Cap sur ${p.name} !` : 'Mission mélange !'}</h2>
      <div class="encounter">${foeSvg(foe, 90)}<p>${kind === 'normal' ? `Un alien sauvage apparaît : <b>${foe.name}</b> !` : `Le boss <b>${foe.name}</b> est prêt !`}</p></div>
      <p class="small">${kind === 'normal' ? 'Chaque bonne réponse le touche. Capture-le !' : 'Concentre-toi bien !'}</p>
    </main>`, 'space');
  setTimeout(() => {
    if (mission && kind === 'flash' && state.flashTimer) {
      mission.deadline = Date.now() + Store.FLASH.seconds * 1000;
      mission.timer = setInterval(tick, 250);
    }
    if (mission) renderQuestion();
  }, 1700);
}

function tick() {
  if (!mission || !mission.deadline) return;
  const left = Math.max(0, Math.ceil((mission.deadline - Date.now()) / 1000));
  const el = app.querySelector('.timer');
  if (el) { el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; el.classList.toggle('urgent', left <= 30); }
  if (left === 0) { clearTimeout(nextTimer); renderResult(); }
}

function stopMission() {
  if (!mission) return;
  clearInterval(mission.timer);
  clearTimeout(nextTimer);
}

function arena() {
  const f = mission.foe, total = mission.questions.length;
  const hp = Math.max(0, total - mission.hits);
  return `<div class="arena">
    <div class="hero">${rocket(rocketColor(), 54)}</div>
    <div class="laser"></div>
    <div class="foe"><div class="bubble"></div>${foeSvg(f, f.boss ? 78 : 64)}</div>
    <div class="foe-info"><b>${f.name}</b><div class="hp"><div class="hp-fill" style="width:${(hp / total) * 100}%"></div></div></div>
  </div>`;
}

function progressBar() {
  const n = mission.questions.length;
  return `<div class="progress"><span>${mission.idx + 1}/${n}</span>${mission.deadline ? '<span class="timer"></span>' : ''}</div>`;
}

function answerArea(q) {
  switch (q.type) {
    case 'numpad':
      return `<div class="answer-box"><span class="answer-display" aria-live="polite"></span>${q.suffix ? `<span class="suffix">${q.suffix}</span>` : ''}</div>
        <div class="numpad">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
        <button data-k="del" aria-label="effacer">⌫</button><button data-k="0">0</button><button data-k="ok" class="ok" aria-label="valider">✓</button></div>`;
    case 'choice':
      return `<div class="choices ${q.choices.every((c) => c.length <= 2) ? 'symbols' : ''}" style="--n:${Math.min(4, q.choices.length)}">${q.choices.map((c) => `<button data-c="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div>`;
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
    ${arena()}
    <main class="question">
      <div class="q-card">
        <div class="q-prompt"><p>${q.prompt}</p>${canSpeak ? '<button class="speak" aria-label="écouter la consigne">🔊</button>' : ''}</div>
        ${q.visual ? `<div class="q-visual">${q.visual}</div>` : ''}
        <div class="q-answer">${answerArea(q)}</div>
        <div class="feedback" aria-live="assertive"></div>
      </div>
    </main>`, 'mission' + (mission.kind !== 'normal' ? ' boss-fight' : ''));
  tick();

  app.querySelector('.close').addEventListener('click', () => {
    if (confirm('Quitter la mission ? Ta progression sur cette mission sera perdue.')) { stopMission(); mission = null; renderHome(); }
  });
  const sayText = q.say || q.prompt;
  app.querySelector('.speak')?.addEventListener('click', () => speak(sayText));
  if (state.autoSpeak) setTimeout(() => speak(sayText), 300);

  ({ numpad: bindNumpad, choice: bindChoice, order: bindOrder, line: bindLine })[q.type](q);
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
  app.querySelectorAll('.choices button').forEach((b) => b.addEventListener('click', () => {
    if (locked || b.disabled) return;
    const ok = b.dataset.c === q.answer;
    b.classList.add(ok ? 'good' : 'bad');
    check(ok, () => { b.disabled = true; });
  }));
}

function bindOrder(q) {
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

const BRAVO = ['Bravo !', 'Super !', 'Génial !', 'Excellent !', 'Parfait !', 'Bien joué !', 'Trop fort !', 'Waouh !', 'En plein dans le mille !'];
const RETRY = ['Presque !', 'Pas tout à fait…', 'Essaie encore !', 'Oups !'];
const TAUNTS = ['Hé hé !', 'Raté !', 'Gloup gloup !', 'Même pas mal !', 'Hi hi hi !'];
let locked = false;
let nextTimer = null;

function animate(el, cls) {
  if (!el) return;
  el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls);
}

function hitFoe() {
  mission.hits++;
  const total = mission.questions.length;
  const fill = app.querySelector('.hp-fill');
  if (fill) fill.style.width = `${(Math.max(0, total - mission.hits) / total) * 100}%`;
  animate(app.querySelector('.arena'), 'shoot');
  animate(app.querySelector('.foe'), 'hit');
}

function taunt() {
  const b = app.querySelector('.bubble');
  if (b) { b.textContent = pick(TAUNTS); animate(b, 'show'); }
  animate(app.querySelector('.foe'), 'laugh');
}

// Vérifie une réponse : indice à la 1re erreur, correction à la 2e.
// Défi éclair : pas d'indice, la correction s'affiche brièvement pour garder le rythme.
function check(ok, resetInput) {
  const q = mission.questions[mission.idx];
  const fb = app.querySelector('.feedback');
  const card = app.querySelector('.q-card');
  const flash = mission.kind === 'flash';
  if (ok) {
    locked = true;
    const first = mission.attempts === 0;
    if (first) mission.score++;
    mission.results.push(first);
    Store.recordAnswer(state, q.skill, first);
    persist();
    sfx.good();
    hitFoe();
    card.classList.add('win');
    fb.className = 'feedback good';
    fb.innerHTML = `<b>${pick(BRAVO)}</b> ${first ? '⭐' : ''}`;
    nextTimer = setTimeout(next, flash ? 650 : 1200);
    return;
  }
  sfx.bad();
  taunt();
  animate(card, 'shake');
  mission.attempts++;
  if (mission.attempts === 1 && !flash) {
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
  if (flash) {
    fb.innerHTML = `<p class="expl">${q.explain}</p>`;
    nextTimer = setTimeout(next, 1600);
    return;
  }
  fb.innerHTML = `<p>Voici la réponse :</p><div class="expl">${q.explain}</div><button class="btn primary">J'ai compris ➜</button>`;
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
  if (!mission) return;
  stopMission();
  const { planetId, kind, score, results, foe } = mission;
  const total = mission.questions.length;
  const won = kind === 'normal' ? mission.hits === total
    : kind === 'flash' ? score >= Store.FLASH.toWin : score >= Store.BOSS.toWin;
  const out = Store.finishMission(state, { planetId, score, total, kind, won, alienId: foe.id });
  persist();
  if (won) sfx.win(); else sfx.bad();
  const p = planetId && planetById(planetId);

  let title, sub;
  if (kind === 'normal') {
    title = won ? (score === total ? 'Mission parfaite !' : 'Alien capturé !') : 'Mission accomplie !';
    sub = won ? `Tu as capturé <b>${foe.name}</b> !` : `${foe.name} s'est échappé… Il reviendra, et tu seras encore plus fort !`;
  } else {
    title = won ? 'Boss vaincu !' : 'Le boss résiste…';
    sub = won ? `Tu as battu <b>${foe.name}</b> !` : `Tu as réussi ${score} défi${score > 1 ? 's' : ''} sur ${total}. Il en fallait ${kind === 'flash' ? Store.FLASH.toWin : Store.BOSS.toWin}. Entraîne-toi et retente ta chance !`;
  }
  screen(`
    <main class="result">
      <h2>${title}</h2>
      <div class="foe-result ${won ? 'caught' : 'fled'}">${foeSvg(foe, 110)}</div>
      <p>${sub}</p>
      <div class="big-stars">${[1, 2, 3].map((i) => `<span class="${i <= Math.min(3, out.stars) ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
      <p class="small">+${out.stars} étoile${out.stars > 1 ? 's' : ''}${kind !== 'normal' && won ? ' (bonus de boss inclus)' : ''}</p>
      <div class="recap">${results.map((r) => `<span class="${r ? 'ok' : 'ko'}">${r ? '✓' : '•'}</span>`).join('')}</div>
      ${out.levelUp ? `<div class="banner level">🎉 Niveau <b>${state.planets[planetId].level}</b> débloqué sur ${p.name} !</div>` : ''}
      ${out.mastered ? `<div class="banner level">👑 Tu es Maître de ${p.name} !</div>` : ''}
      ${out.newAlien ? '<div class="banner badge">👾 Nouvel alien dans ton album !</div>' : ''}
      ${out.goalReached ? '<div class="banner badge">✅ Objectif du jour atteint !</div>' : ''}
      ${out.newBadges.map((b) => `<div class="banner badge">${b.icon} Nouveau trophée : <b>${b.name}</b></div>`).join('')}
      ${out.newRockets.map((r) => `<div class="banner badge">${rocket(r.color, 28)} Nouvelle fusée débloquée : <b>${r.name}</b> !</div>`).join('')}
      ${p && Store.bossReady(state.planets[planetId]) && kind === 'normal' ? `<div class="banner boss">⚔️ Le boss de ${p.name} est apparu !</div>` : ''}
      <div class="result-actions">
        <button class="btn primary big" id="again">${kind !== 'normal' && !won ? 'Réessayer ⚔️' : 'Encore une mission 🚀'}</button>
        <button class="btn" data-go="home">Retour à la carte</button>
      </div>
    </main>`, 'space');
  app.querySelector('#again').addEventListener('click', () => {
    if (planetId && Store.bossReady(state.planets[planetId])) renderBossIntro(planetId);
    else startMission(planetId, 'normal');
  });
  mission = null;
}

// ------------------------------------------------------------------ Trophées & album
function renderTrophies() {
  const caught = new Set(state.aliens);
  screen(`
    <header class="top"><h2>🏅 Mes trophées</h2><div class="star-count">⭐ ${state.stars}</div></header>
    <main class="trophies">
      <h3>Ma fusée</h3>
      <div class="garage">${Store.ROCKETS.map((r) => {
        const open = state.stars >= r.stars;
        return `<button class="rocket-opt ${r.id === state.rocket ? 'on' : ''} ${open ? '' : 'locked'}" data-r="${r.id}" ${open ? '' : 'disabled'}>
          ${rocket(r.color, 56)}<small>${open ? r.name : `🔒 ${r.stars} ⭐`}</small></button>`;
      }).join('')}</div>
      <h3>Album des aliens <small>(${state.aliens.length}/${PLANETS.length * 10})</small></h3>
      ${PLANETS.map((p) => `<div class="album-row"><p>${p.emoji} ${p.name}</p><div class="album">${[
        ...[1, 2, 3, 4, 5].map((L) => ({ id: `${p.id}-${L}`, name: Store.ALIEN_NAMES[p.id][L - 1], level: L, boss: false })),
        ...[1, 2, 3, 4, 5].map((L) => ({ id: `${p.id}-boss-${L}`, name: `Boss niv. ${L}`, level: L, boss: true })),
      ].map((a) => `<div class="album-card ${caught.has(a.id) ? 'got' : ''} ${a.boss ? 'is-boss' : ''}">
          ${alien(caught.has(a.id) ? Store.ALIEN_COLORS[p.id] : '#ffffff22', a.level, a.boss, 54)}
          <small>${caught.has(a.id) ? a.name : '?'}</small></div>`).join('')}</div></div>`).join('')}
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
  let currentMsg = creating ? 'Première visite : choisissez un code à 4 chiffres pour protéger cet espace.' : 'Entrez votre code parent :';
  const draw = () => {
    screen(`
      <header class="top"><h2>👪 Espace parents</h2></header>
      <main class="pin">
        <p>${currentMsg}</p>
        <div class="pin-dots">${[0, 1, 2, 3].map((i) => `<i class="${i < code.length ? 'on' : ''}"></i>`).join('')}</div>
        <div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
          <button data-k="del" aria-label="effacer">⌫</button><button data-k="0">0</button><button data-go="home" aria-label="fermer">✕</button></div>
      </main>
      ${nav('parent')}`, 'parent-bg');
    app.querySelectorAll('.numpad [data-k]').forEach((b) => b.addEventListener('click', () => press(b.dataset.k)));
  };
  const press = (k) => {
    if (k === 'del') { code = code.slice(0, -1); return draw(); }
    code += k;
    if (code.length < 4) return draw();
    if (creating && first === null) { first = code; code = ''; currentMsg = 'Confirmez le code :'; return draw(); }
    if (creating) {
      if (code === first) { state.pin = code; persist(); return renderParent(); }
      first = null; code = ''; currentMsg = 'Les codes ne correspondent pas. Choisissez un code à 4 chiffres :'; return draw();
    }
    if (code === state.pin) return renderParent();
    code = ''; currentMsg = 'Code incorrect. Réessayez :'; draw();
  };
  draw();
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
  const customTables = Array.isArray(state.tables);
  const tablesShown = customTables ? state.tables : TABLES_BY_LEVEL[state.planets.calcul.level];

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
        <p class="note">Après ${Store.XP_TO_BOSS} missions réussies (au moins 4/5 du premier coup), un boss apparaît. Le battre fait passer au niveau suivant.
          Sur Calculo, le boss est un « Défi éclair » : ${Store.FLASH.size} calculs en 3 minutes, la fluence attendue en fin de CE1.</p>
        ${PLANETS.map((p) => {
          const ps = state.planets[p.id];
          return `<div class="lvl-row"><span>${p.emoji} <b>${p.name}</b> <small>${p.theme}</small></span>
          <span class="stepper"><button data-lv="${p.id}" data-d="-1" aria-label="baisser">−</button><b>${ps.level}</b><button data-lv="${p.id}" data-d="1" aria-label="monter">+</button></span>
          <small class="period">${PERIODS[ps.level]} · ${ps.master ? '👑 maîtrisé' : Store.bossReady(ps) ? '⚔️ boss à affronter' : `${ps.xp}/${Store.XP_TO_BOSS} missions avant le boss`}</small></div>`;
        }).join('')}
        <label class="row">Tout régler sur :
          <select id="period"><option value="">— choisir une période —</option>${PERIODS.slice(1).map((t, i) => `<option value="${i + 1}">${t}</option>`).join('')}</select></label>
        <p class="note">Niveau 1 : nombres jusqu'à ${fmt(NUM_MAX[1])}. Dès le niveau 2 : nombres jusqu'à ${fmt(NUM_MAX[2])} et fractions, comme le prévoit le programme 2025.</p>
      </section>

      <section>
        <h3>Tables de multiplication</h3>
        <label class="row"><input type="radio" name="tmode" value="auto" ${customTables ? '' : 'checked'}> Automatique selon le niveau de Calculo</label>
        <label class="row"><input type="radio" name="tmode" value="custom" ${customTables ? 'checked' : ''}> Choisir les tables à travailler</label>
        <div class="tables ${customTables ? '' : 'disabled'}">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) =>
          `<label class="tbl ${tablesShown.includes(t) ? 'on' : ''}"><input type="checkbox" value="${t}" ${tablesShown.includes(t) ? 'checked' : ''} ${customTables ? '' : 'disabled'}>×${t}</label>`).join('')}</div>
        <label class="row"><input type="checkbox" id="flashTimer" ${state.flashTimer ? 'checked' : ''}> Chronomètre pour le Défi éclair (3 minutes)</label>
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
          const kind = h.kind === 'flash' ? ' ⚡' : h.kind === 'boss' ? ' ⚔️' : '';
          return `<li><span>${h.date.split('-').reverse().join('/')}</span><span>${p ? p.emoji + ' ' + p.name : '🌌 Mélange'}${kind}</span><b>${h.score}/${h.total || Store.MISSION_SIZE}</b></li>`;
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
    p.level = Math.min(5, Math.max(1, p.level + Number(b.dataset.d))); p.xp = 0; p.master = false; persist(); renderParent();
  }));
  app.querySelector('#period').addEventListener('change', (e) => {
    const L = Number(e.target.value);
    if (!L) return;
    PLANETS.forEach((p) => Object.assign(state.planets[p.id], { level: L, xp: 0, master: false }));
    persist(); renderParent();
  });
  app.querySelectorAll('input[name=tmode]').forEach((r) => r.addEventListener('change', () => {
    state.tables = r.value === 'custom' ? TABLES_BY_LEVEL[Math.max(2, state.planets.calcul.level)].slice() : null;
    persist(); renderParent();
  }));
  app.querySelectorAll('.tables input').forEach((c) => c.addEventListener('change', () => {
    const chosen = [...app.querySelectorAll('.tables input:checked')].map((x) => Number(x.value));
    if (!chosen.length) { c.checked = true; return; } // au moins une table
    state.tables = chosen; persist();
    c.parentElement.classList.toggle('on', c.checked);
  }));
  app.querySelector('#flashTimer').addEventListener('change', (e) => { state.flashTimer = e.target.checked; persist(); });
  app.querySelector('#pname').addEventListener('change', (e) => { const v = e.target.value.trim(); if (v) { state.name = v; persist(); } });
  app.querySelector('#snd').addEventListener('change', (e) => { state.sound = e.target.checked; persist(); });
  app.querySelector('#auto').addEventListener('change', (e) => { state.autoSpeak = e.target.checked; persist(); });
  app.querySelector('#newpin').addEventListener('click', () => { state.pin = null; persist(); renderPinGate(); });
  app.querySelector('#reset').addEventListener('click', () => {
    if (confirm('Effacer toutes les étoiles, trophées, aliens et niveaux ? Cette action est définitive.')) { state = Store.reset(state); persist(); renderParent(); }
  });
}

const routes = { home: renderHome, trophies: renderTrophies, parent: renderPinGate };

// Hors ligne / installation sur l'écran d'accueil.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (canSpeak) speechSynthesis.getVoices();
// Accès de test (?debug) : utilisé par les tests navigateur.
if (new URLSearchParams(location.search).has('debug')) {
  window.__mission = () => mission;
  window.__state = () => state;
}

renderHome();
