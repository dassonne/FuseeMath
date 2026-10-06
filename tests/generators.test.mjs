// Génère beaucoup d'exercices à chaque niveau et vérifie leur cohérence.
// Lancer : node tests/generators.test.mjs
import { SKILLS, MAX_BY_LEVEL, buildMission, PLANETS } from '../js/skills.js';
import { toWords } from '../js/util.js';

let failures = 0;
const fail = (msg, q) => { failures++; if (failures < 30) console.error('✗', msg, JSON.stringify(q).slice(0, 300)); };

// Écriture en lettres : quelques cas connus.
const words = { 1: 'un', 17: 'dix-sept', 21: 'vingt-et-un', 71: 'soixante-et-onze', 80: 'quatre-vingts', 81: 'quatre-vingt-un',
  91: 'quatre-vingt-onze', 100: 'cent', 200: 'deux-cents', 201: 'deux-cent-un', 380: 'trois-cent-quatre-vingts', 999: 'neuf-cent-quatre-vingt-dix-neuf', 1000: 'mille' };
for (const [n, w] of Object.entries(words)) if (toWords(Number(n)) !== w) fail(`toWords(${n}) = ${toWords(Number(n))}, attendu ${w}`, {});

for (const skill of SKILLS) {
  for (let L = skill.minLevel; L <= 5; L++) {
    for (let i = 0; i < 400; i++) {
      const q = skill.gen(L);
      const where = `${skill.id} L${L}`;
      if (!q.prompt || !q.hint || !q.explain) fail(`${where}: texte manquant`, q);
      if (/undefined|NaN/.test(q.prompt + q.explain + q.hint + (q.visual || '') + (q.say || ''))) fail(`${where}: undefined/NaN`, q);
      switch (q.type) {
        case 'numpad':
          if (!Number.isInteger(q.answer) || q.answer < 0) fail(`${where}: réponse invalide`, q);
          if (q.answer > 1000) fail(`${where}: réponse > 1000`, q);
          break;
        case 'choice':
          if (!q.choices.includes(q.answer)) fail(`${where}: réponse absente des choix`, q);
          if (new Set(q.choices).size !== q.choices.length) fail(`${where}: choix en double`, q);
          break;
        case 'order': {
          const sorted = [...q.items].sort((a, b) => a - b);
          const asc = JSON.stringify(sorted) === JSON.stringify(q.answer);
          const desc = JSON.stringify(sorted.reverse()) === JSON.stringify(q.answer);
          if (!asc && !desc) fail(`${where}: ordre incorrect`, q);
          if (q.items.some((n) => n >= MAX_BY_LEVEL[L] || n < 0)) fail(`${where}: nombre hors programme`, q);
          break;
        }
        case 'line':
          if (!(q.answer >= 1 && q.answer <= 9)) fail(`${where}: graduation invalide`, q);
          if (q.line.start + q.line.count * q.line.step > MAX_BY_LEVEL[L]) fail(`${where}: droite hors programme`, q);
          break;
        default: fail(`${where}: type inconnu`, q);
      }
    }
  }
}

for (let L = 1; L <= 5; L++) {
  const levels = Object.fromEntries(PLANETS.map((p) => [p.id, L]));
  for (const p of PLANETS) {
    const m = buildMission(levels, 5, ['n_compare', 'c_add'], p.id);
    if (m.length !== 5) fail(`mission ${p.id} L${L}: ${m.length} questions`, {});
    if (m.some((q) => !q.skill.startsWith(p.id[0]))) fail(`mission ${p.id}: notion d'une autre planète`, m);
  }
  if (buildMission(levels, 5).length !== 5) fail(`mission mélange L${L}`, {});
}

if (failures) { console.error(`\n${failures} échec(s)`); process.exit(1); }
console.log(`OK — ${SKILLS.length} notions vérifiées sur tous les niveaux`);
