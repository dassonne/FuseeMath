// Progression sauvegardée sur l'appareil (localStorage), sans compte ni serveur.
import { PLANETS } from './skills.js';
import { todayStr } from './util.js';

const KEY = 'fusee-maths-v1';
export const MISSION_SIZE = 5;
const XP_TO_LEVEL_UP = 3; // missions réussies (≥ 4/5 du premier coup) pour passer au niveau suivant

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
  { id: 'explorateur', icon: '🧭', name: 'Explorateur', desc: 'Termine 10 missions', test: (s) => s.missions >= 10 },
  { id: 'serie3', icon: '🔥', name: 'Régulier', desc: 'Joue 3 jours de suite', test: (s) => s.bestStreak >= 3 },
  { id: 'etoiles50', icon: '🌟', name: 'Chasseur d\'étoiles', desc: 'Gagne 50 étoiles', test: (s) => s.stars >= 50 },
  { id: 'precision', icon: '🏹', name: 'Précision', desc: 'Réussis 10 missions sans faute', test: (s) => s.perfect >= 10 },
  { id: 'astronaute', icon: '👩‍🚀', name: 'Astronaute', desc: 'Termine 30 missions', test: (s) => s.missions >= 30 },
  { id: 'serie7', icon: '📅', name: 'Une semaine dans l\'espace', desc: 'Joue 7 jours de suite', test: (s) => s.bestStreak >= 7 },
  ...PLANETS.map((p) => ({
    id: 'max-' + p.id, icon: '👑', name: 'Maître de ' + p.name, desc: `Atteins le niveau 5 sur ${p.name}`, test: (s) => s.planets[p.id].level >= 5,
  })),
];

function defaults() {
  return {
    name: '', rocket: 'rouge', stars: 0, missions: 0, perfect: 0,
    planets: Object.fromEntries(PLANETS.map((p) => [p.id, { level: 1, xp: 0, played: 0 }])),
    skills: {}, // id -> { attempts, firstTry, last }
    review: [], // notions ratées récemment, reproposées en priorité
    badges: [], history: [], lastDay: null, streak: 0, bestStreak: 0,
    pin: null, sound: true, autoSpeak: false,
  };
}

export function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const saved = JSON.parse(raw);
    return { ...d, ...saved, planets: { ...d.planets, ...saved.planets } };
  } catch {
    return d;
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage indisponible : on continue sans sauvegarder */ }
}

export function reset(state) {
  const keep = { name: state.name, pin: state.pin, sound: state.sound, autoSpeak: state.autoSpeak };
  return { ...defaults(), ...keep };
}

export function recordAnswer(state, skillId, firstTry) {
  const st = state.skills[skillId] || (state.skills[skillId] = { attempts: 0, firstTry: 0, last: null });
  st.attempts++;
  if (firstTry) st.firstTry++;
  st.last = todayStr();
  state.review = state.review.filter((id) => id !== skillId);
  if (!firstTry) state.review = [skillId, ...state.review].slice(0, 8);
}

export const starsFor = (score) => (score === MISSION_SIZE ? 3 : score >= 3 ? 2 : 1);

// Fin de mission : étoiles, niveau, série de jours, badges. Renvoie ce qui a changé.
export function finishMission(state, planetId, score) {
  const stars = starsFor(score);
  state.stars += stars;
  state.missions++;
  if (score === MISSION_SIZE) state.perfect++;

  const today = todayStr();
  if (state.lastDay !== today) {
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.lastDay = today;
  }

  let levelUp = false;
  const p = planetId && state.planets[planetId];
  if (p) {
    p.played++;
    if (score >= MISSION_SIZE - 1) p.xp++;
    else if (score <= 1) p.xp = Math.max(0, p.xp - 1);
    if (p.xp >= XP_TO_LEVEL_UP && p.level < 5) { p.level++; p.xp = 0; levelUp = true; }
  }

  state.history = [{ date: today, planet: planetId || 'melange', level: p ? p.level : null, score }, ...state.history].slice(0, 30);

  const newBadges = BADGES.filter((b) => !state.badges.includes(b.id) && b.test(state));
  state.badges.push(...newBadges.map((b) => b.id));
  const newRockets = ROCKETS.filter((r) => r.stars > state.stars - stars && r.stars <= state.stars);
  return { stars, levelUp, newBadges, newRockets };
}

export { XP_TO_LEVEL_UP };
