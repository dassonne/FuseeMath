// Progression sauvegardée sur l'appareil (localStorage), sans compte ni serveur.
import { PLANETS, factKey } from './skills.js';
import { todayStr, dayStr } from './util.js';

const KEY = 'fusee-maths-v1';
export const MISSION_SIZE = 5;
export const XP_TO_BOSS = 3; // missions réussies (≥ 4/5 du premier coup) avant d'affronter le boss du niveau
export const DAILY_GOAL = 3; // missions par jour (~10-15 minutes)
export const BOSS = { size: 8, toWin: 6 };
export const FLASH = { size: 12, seconds: 180, toWin: 10 }; // fluence fin de CE1 : 12 calculs en 3 minutes
export const TABLES_CHALLENGE = { seconds: 60, goal: 8 }; // fluence fin de CE1 : 8 résultats de tables en 1 minute

export const ALIEN_NAMES = {
  nombres: ['Bloup', 'Dizou', 'Centi', 'Grobo', 'Millux'],
  calcul: ['Plussy', 'Moinsor', 'Foisy', 'Calcula', 'Opéron'],
  problemes: ['Énigmo', 'Questo', 'Rébus', 'Malino', 'Sphinxy'],
  grandeurs: ['Mesuro', 'Horlo', 'Géomo', 'Kilox', 'Règlo'],
};
export const BOSS_NAMES = {
  nombres: 'Capitaine Numéros', calcul: 'Général Éclair', problemes: 'Grand Énigmator', grandeurs: 'Reine Géométra',
};
export const ALIEN_COLORS = { nombres: '#ff9f43', calcul: '#4d8dff', problemes: '#3ddc84', grandeurs: '#c77dff' };

export const ROCKETS = [
  { id: 'rouge', color: '#ff4d4d', name: 'Rouge', stars: 0 },
  { id: 'bleu', color: '#4d8dff', name: 'Bleue', stars: 0 },
  { id: 'vert', color: '#3ddc84', name: 'Verte', stars: 10 },
  { id: 'violet', color: '#b05cff', name: 'Violette', stars: 25 },
  { id: 'or', color: '#ffc93c', name: 'Dorée', stars: 50 },
  { id: 'arc', color: 'arc', name: 'Arc-en-ciel', stars: 100 },
];

export const BADGES = [
  { id: 'premier-vol', icon: '🚀', name: 'Premier décollage', desc: 'Termine ta première mission', test: (s) => s.missions >= 1 },
  { id: 'sans-faute', icon: '🎯', name: 'Sans faute', desc: 'Réussis une mission sans aucune erreur', test: (s) => s.perfect >= 1 },
  { id: 'tour', icon: '🪐', name: 'Tour des planètes', desc: 'Fais une mission sur chaque planète', test: (s) => PLANETS.every((p) => s.planets[p.id].played > 0) },
  { id: 'objectif', icon: '✅', name: 'Objectif atteint', desc: `Fais ${DAILY_GOAL} missions dans la journée`, test: (s) => s.goalsMet >= 1 },
  { id: 'boss1', icon: '⚔️', name: 'Chasseur de boss', desc: 'Bats ton premier boss', test: (s) => s.bossWins >= 1 },
  { id: 'eclair', icon: '⚡', name: 'Éclair', desc: 'Gagne un Défi éclair (12 calculs en 3 minutes)', test: (s) => s.flashWins >= 1 },
  { id: 'tables8', icon: '✖️', name: 'As des tables', desc: `Trouve ${TABLES_CHALLENGE.goal} résultats de tables en 1 minute`, test: (s) => s.records.tables >= TABLES_CHALLENGE.goal },
  { id: 'memory', icon: '🃏', name: 'Bonne mémoire', desc: 'Termine un memory des fractions', test: (s) => s.records.memory > 0 },
  { id: 'explorateur', icon: '🧭', name: 'Explorateur', desc: 'Termine 10 missions', test: (s) => s.missions >= 10 },
  { id: 'serie3', icon: '🔥', name: 'Régulier', desc: 'Joue 3 jours de suite', test: (s) => s.bestStreak >= 3 },
  { id: 'album10', icon: '👾', name: 'Collectionneur', desc: 'Capture 10 aliens', test: (s) => s.aliens.length >= 10 },
  { id: 'etoiles50', icon: '🌟', name: 'Chasseur d\'étoiles', desc: 'Gagne 50 étoiles', test: (s) => s.stars >= 50 },
  { id: 'objectif5', icon: '🗓️', name: 'Bon élève', desc: 'Atteins l\'objectif du jour 5 fois', test: (s) => s.goalsMet >= 5 },
  { id: 'precision', icon: '🏹', name: 'Précision', desc: 'Réussis 10 missions sans faute', test: (s) => s.perfect >= 10 },
  { id: 'astronaute', icon: '👩‍🚀', name: 'Astronaute', desc: 'Termine 30 missions', test: (s) => s.missions >= 30 },
  { id: 'serie7', icon: '📅', name: 'Une semaine dans l\'espace', desc: 'Joue 7 jours de suite', test: (s) => s.bestStreak >= 7 },
  ...PLANETS.map((p) => ({
    id: 'max-' + p.id, icon: '👑', name: 'Maître de ' + p.name, desc: `Bats le boss du niveau 5 sur ${p.name}`, test: (s) => s.planets[p.id].master,
  })),
];

function defaults() {
  return {
    name: '', rocket: 'rouge', stars: 0, missions: 0, perfect: 0, bossWins: 0, flashWins: 0,
    planets: Object.fromEntries(PLANETS.map((p) => [p.id, { level: 1, xp: 0, played: 0, master: false }])),
    skills: {}, // id -> { attempts, firstTry, last }
    review: [], // notions ratées récemment, reproposées en priorité
    aliens: [], // aliens capturés (album)
    facts: {}, // faits des tables : '7x8' -> { box: 0..4, seen } (récupération espacée)
    records: { flash: 0, tables: 0, memory: 0 }, // meilleurs scores des défis (memory : moins de coups)
    badges: [], history: [], lastDay: null, streak: 0, bestStreak: 0,
    daily: { date: null, count: 0 }, goalsMet: 0,
    pin: null, sound: true, autoSpeak: false, tables: null, flashTimer: true,
  };
}

export function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const saved = JSON.parse(raw);
    const planets = Object.fromEntries(PLANETS.map((p) => [p.id, { ...d.planets[p.id], ...(saved.planets || {})[p.id] }]));
    return { ...d, ...saved, planets, records: { ...d.records, ...saved.records } };
  } catch {
    return d;
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage indisponible : on continue sans sauvegarder */ }
}

export function reset(state) {
  const keep = { name: state.name, pin: state.pin, sound: state.sound, autoSpeak: state.autoSpeak, tables: state.tables, flashTimer: state.flashTimer };
  return { ...defaults(), ...keep };
}

export const bossReady = (p) => p.xp >= XP_TO_BOSS && !p.master;
export const todayCount = (state) => (state.daily.date === todayStr() ? state.daily.count : 0);

export function recordAnswer(state, skillId, firstTry) {
  const st = state.skills[skillId] || (state.skills[skillId] = { attempts: 0, firstTry: 0, last: null });
  st.attempts++;
  if (firstTry) st.firstTry++;
  st.last = todayStr();
  state.review = state.review.filter((id) => id !== skillId);
  if (!firstTry) state.review = [skillId, ...state.review].slice(0, 8);
}

// Boîtes de récupération espacée pour les faits des tables.
export function recordFact(state, fact, ok) {
  if (!fact) return;
  const key = factKey(fact[0], fact[1]);
  const f = state.facts[key] || (state.facts[key] = { box: 0, seen: 0 });
  f.seen++;
  f.box = ok ? Math.min(4, f.box + 1) : 0;
}

// Jeux bonus (défis et memory) : étoiles, records, objectif du jour, sans changer les niveaux.
// g = { game: 'flash' | 'tables' | 'memory', score, total }
export function finishArcade(state, g) {
  const starsBefore = state.stars;
  const today = todayStr();
  const prev = state.records[g.game] || 0;
  let record, stars;
  if (g.game === 'memory') {
    record = !prev || g.score < prev; // moins de coups = mieux
    stars = g.score <= g.total + 3 ? 3 : g.score <= g.total * 2 ? 2 : 1;
  } else {
    record = g.score > prev;
    const goal = g.game === 'tables' ? TABLES_CHALLENGE.goal : FLASH.toWin;
    stars = g.score >= goal ? 3 : g.score >= goal / 2 ? 2 : 1;
    if (g.game === 'flash' && g.score >= FLASH.toWin) state.flashWins++;
  }
  if (record) state.records[g.game] = g.score;
  state.stars += stars;
  state.missions++;
  if (state.daily.date !== today) state.daily = { date: today, count: 0 };
  state.daily.count++;
  const goalReached = state.daily.count === DAILY_GOAL;
  if (goalReached) state.goalsMet++;
  if (state.lastDay !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    state.streak = state.lastDay === dayStr(y) ? state.streak + 1 : 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.lastDay = today;
  }
  state.history = [{ date: today, planet: g.game, kind: 'arcade', score: g.score, total: g.total }, ...state.history].slice(0, 30);
  const newBadges = BADGES.filter((b) => !state.badges.includes(b.id) && b.test(state));
  state.badges.push(...newBadges.map((b) => b.id));
  const newRockets = ROCKETS.filter((r) => r.stars > starsBefore && r.stars <= state.stars);
  return { stars, record, prev, newBadges, newRockets, goalReached };
}

export function starsFor(score, total) {
  if (score === total) return 3;
  return score / total >= 0.6 ? 2 : 1;
}

// Fin de mission : étoiles, niveau, boss, série de jours, badges. Renvoie ce qui a changé.
// m = { planetId, score, total, kind: 'normal' | 'boss' | 'flash', won, alienId }
export function finishMission(state, m) {
  const starsBefore = state.stars;
  let stars = starsFor(m.score, m.total);
  if (m.kind !== 'normal' && m.won) stars += 5;
  state.stars += stars;
  state.missions++;
  if (m.score === m.total) state.perfect++;

  const today = todayStr();
  if (state.lastDay !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1); const yesterday = dayStr(y);
    state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.lastDay = today;
  }
  if (state.daily.date !== today) state.daily = { date: today, count: 0 };
  state.daily.count++;
  const goalReached = state.daily.count === DAILY_GOAL;
  if (goalReached) state.goalsMet++;

  let levelUp = false, mastered = false;
  const p = m.planetId && state.planets[m.planetId];
  if (p) {
    p.played++;
    if (m.kind === 'normal') {
      if (m.score >= m.total - 1) p.xp = Math.min(XP_TO_BOSS, p.xp + 1);
      else if (m.score <= 1) p.xp = Math.max(0, p.xp - 1);
    } else if (m.won) {
      state.bossWins++;
      if (m.kind === 'flash') state.flashWins++;
      if (p.level < 5) { p.level++; p.xp = 0; levelUp = true; } else { p.master = true; mastered = true; }
    }
  }

  const newAlien = m.won && m.alienId && !state.aliens.includes(m.alienId);
  if (newAlien) state.aliens.push(m.alienId);

  state.history = [{ date: today, planet: m.planetId || 'melange', kind: m.kind, level: p ? p.level : null, score: m.score, total: m.total }, ...state.history].slice(0, 30);

  const newBadges = BADGES.filter((b) => !state.badges.includes(b.id) && b.test(state));
  state.badges.push(...newBadges.map((b) => b.id));
  const newRockets = ROCKETS.filter((r) => r.stars > starsBefore && r.stars <= state.stars);
  return { stars, levelUp, mastered, newBadges, newRockets, newAlien, goalReached };
}
