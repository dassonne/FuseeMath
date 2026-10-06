// Petites fonctions utilitaires partagées.

export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tire `count` éléments distincts dans un tableau.
export const sample = (arr, count) => shuffle(arr).slice(0, count);

// Nombres affichés « à la française » : 1 000 avec espace fine.
export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Écriture des nombres en lettres (orthographe rectifiée de 1990,
// celle enseignée à l'école : traits d'union partout).
const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function below100(n) {
  if (n < 17) return UNITS[n];
  if (n < 20) return 'dix-' + UNITS[n - 10];
  if (n < 70) {
    const t = Math.floor(n / 10), r = n % 10;
    if (r === 0) return TENS[t];
    if (r === 1) return TENS[t] + '-et-un';
    return TENS[t] + '-' + UNITS[r];
  }
  if (n < 80) return n === 71 ? 'soixante-et-onze' : 'soixante-' + below100(n - 60);
  if (n === 80) return 'quatre-vingts';
  return 'quatre-vingt-' + below100(n - 80);
}

export function toWords(n) {
  if (n === 1000) return 'mille';
  if (n < 100) return below100(n);
  const c = Math.floor(n / 100), r = n % 100;
  const head = c === 1 ? 'cent' : UNITS[c] + '-cent';
  if (r === 0) return c > 1 ? head + 's' : head;
  return head + '-' + below100(r);
}

// Propositions de QCM numériques autour de la bonne réponse.
export function numChoices(answer, spread = 10, count = 4, min = 0) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < count && guard++ < 200) {
    const delta = rand(1, spread) * (chance(0.5) ? 1 : -1);
    const v = answer + delta;
    if (v >= min) set.add(v);
  }
  return shuffle([...set]);
}

export const NAMES = ['Léo', 'Inès', 'Tom', 'Jade', 'Sami', 'Lina', 'Hugo', 'Emma', 'Noah', 'Chloé', 'Adam', 'Lou'];

// Date locale (et non UTC) au format AAAA-MM-JJ.
export function dayStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export const todayStr = () => dayStr();

export const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Fractions : lecture « un cinquième », « trois quarts » (jamais « un sur cinq »).
const ORDINALS = { 2: 'demi', 3: 'tiers', 4: 'quart', 5: 'cinquième', 6: 'sixième', 8: 'huitième', 10: 'dixième' };
export function fractionWords(n, d) {
  if (n === d) return 'un';
  const ord = ORDINALS[d];
  if (n === 1) return `un ${ord}`;
  const plural = d === 3 ? 'tiers' : d === 2 ? 'demis' : ord + 's';
  return `${toWords(n)} ${plural}`;
}

// Écriture fractionnaire « en chiffres » : 1 au-dessus, 5 en dessous.
export const fracHtml = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
