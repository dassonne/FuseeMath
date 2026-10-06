// Générateurs d'exercices, alignés sur les repères annuels de CE1 (cycle 2).
//
// Le niveau (1 à 5) suit les 5 périodes de l'année (programme 2025) :
//   1 = sept.–oct.  nombres jusqu'à 200, moitié / demi / quart, tables de 1, 2, 5, 10
//   2 = nov.–déc.   nombres jusqu'à 1 000, fractions unitaires et écriture chiffrée, tables 1 à 6 et 10
//   3 = janv.–fév.  calculs jusqu'à 500, fractions non unitaires, table de 7, soustraction posée
//   4 = mars–avril  calculs jusqu'à 1 000, comparer et additionner des fractions, table de 8
//   5 = mai–juin    consolidation, toutes les tables de 0 à 10
// (d'après le programme 2025 et le livret d'accompagnement CE1 d'éduscol)
//
// Chaque générateur renvoie une question :
//   { prompt, say?, visual?, type, answer, choices?, items?, line?, suffix?, hint, explain }
// type : 'numpad' | 'choice' | 'order' | 'line'
import { rand, pick, chance, shuffle, sample, numChoices, fmt, toWords, NAMES, fractionWords, fracHtml } from './util.js';
import * as V from './visuals.js';

// Étendue des nombres (numération) et des calculs, par niveau.
export const NUM_MAX = [0, 200, 1000, 1000, 1000, 1000];
export const CALC_MAX = [0, 100, 200, 500, 1000, 1000];
const maxN = (L) => NUM_MAX[L];
const calcN = (L) => CALC_MAX[L];

// Tables de multiplication travaillées selon le niveau (toutes, de 0 à 10, en fin de CE1).
export const TABLES_BY_LEVEL = [[], [1, 2, 5, 10], [1, 2, 3, 4, 5, 6, 10], [1, 2, 3, 4, 5, 6, 7, 10], [1, 2, 3, 4, 5, 6, 7, 8, 10], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]];
const tablesFor = (L, opts) => (opts && opts.tables && opts.tables.length ? opts.tables : TABLES_BY_LEVEL[L]);

// Indices pour retrouver un résultat de table à partir de ce qu'on connaît déjà
// (commutativité, doubles, 10 fois moins 1 fois, décomposition), comme dans le livret CE1.
export function multHint(a, b) {
  if (a === 0 || b === 0) return 'Zéro fois un nombre, ou un nombre fois zéro, ça fait toujours 0.';
  if (a === 1 || b === 1) return 'Une fois un nombre, c\'est ce nombre.';
  if (a === 10 || b === 10) return `${a === 10 ? b : a} fois 10, c'est ${a === 10 ? b : a} dizaines.`;
  if (a > b && b <= 6) return `${a} × ${b}, c'est pareil que ${b} × ${a} : utilise la table de ${b}.`;
  const has = (f) => a === f || b === f, other = (f) => (a === f ? b : a);
  if (has(2)) return `2 fois ${other(2)}, c'est le double de ${other(2)}.`;
  if (has(4)) return `4 fois ${other(4)}, c'est le double de 2 fois ${other(4)} (${2 * other(4)}).`;
  if (has(8)) return `8 fois ${other(8)}, c'est le double de 4 fois ${other(8)} (${4 * other(8)}).`;
  if (has(9)) return `9 fois ${other(9)}, c'est 10 fois ${other(9)} (${10 * other(9)}) moins ${other(9)}.`;
  if (has(5)) return `5 fois ${other(5)}, c'est la moitié de 10 fois ${other(5)} (${10 * other(5)}).`;
  if (has(3)) return `3 fois ${other(3)}, c'est le double de ${other(3)} (${2 * other(3)}) plus ${other(3)}.`;
  // Il reste 6 × 6, 6 × 7, 7 × 7… : 5 fois, plus le reste.
  const [x, y] = a >= b ? [a, b] : [b, a];
  return `${x} fois ${y}, c'est 5 fois ${y} (${5 * y}) plus ${x - 5} fois ${y} (${(x - 5) * y}).`;
}

export const PLANETS = [
  { id: 'nombres', name: 'Numéris', theme: 'Nombres', emoji: '🔢', colors: ['#ffd27a', '#e07b1f'], ring: false },
  { id: 'calcul', name: 'Calculo', theme: 'Calcul', emoji: '➕', colors: ['#8be0ff', '#2962d9'], ring: true },
  { id: 'problemes', name: 'Problémia', theme: 'Problèmes', emoji: '🧩', colors: ['#b8f28b', '#2a9d4b'], ring: false },
  { id: 'grandeurs', name: 'Géomia', theme: 'Mesures & formes', emoji: '📐', colors: ['#f4a6ff', '#8a2be2'], ring: true },
  { id: 'temps', name: 'Chronos', theme: 'Le temps', emoji: '⏰', colors: ['#9ff3e6', '#13867a'], ring: false },
];

// « de » ou « d' » devant une voyelle : « d'autocollants », « d'œufs ».
const de = (word) => (/^[aeiouyéèêœh]/i.test(word) ? `d'${word}` : `de ${word}`);

const decomp = (n) => [Math.floor(n / 100), Math.floor((n % 100) / 10), n % 10];

// ---------------------------------------------------------------- Nombres
const nombres = [
  {
    id: 'n_blocks', label: 'Lire un nombre en centaines, dizaines, unités', minLevel: 1,
    gen(L) {
      const n = rand(11, Math.min(maxN(L) - 1, 599));
      const [c, d, u] = decomp(n);
      return {
        prompt: 'Quel nombre est représenté ?', visual: V.blocks(n), type: 'numpad', answer: n,
        hint: 'Une plaque = 100, une barre = 10, un petit cube = 1. Compte les plaques, puis les barres, puis les cubes.',
        explain: `${c ? c + ' centaine' + (c > 1 ? 's' : '') + ' + ' : ''}${d} dizaine${d > 1 ? 's' : ''} + ${u} unité${u > 1 ? 's' : ''} = <b>${fmt(n)}</b>`,
      };
    },
  },
  {
    id: 'n_compose', label: 'Composer un nombre', minLevel: 1,
    gen(L) {
      if (L >= 4 && chance(0.5)) {
        const d = rand(10, Math.floor(maxN(L) / 10) - 1), u = rand(0, 9), n = d * 10 + u;
        return {
          prompt: `Quel nombre fait <b>${d} dizaines</b> et <b>${u} unité${u > 1 ? 's' : ''}</b> ?`, type: 'numpad', answer: n,
          hint: `10 dizaines = 1 centaine. Donc ${d} dizaines = ${d * 10}.`,
          explain: `${d} dizaines = ${fmt(d * 10)}, plus ${u} : <b>${fmt(n)}</b>`,
        };
      }
      const n = rand(L === 1 ? 10 : 100, maxN(L) - 1);
      const [c, d, u] = decomp(n);
      const parts = [];
      if (c) parts.push(`<b>${c} centaine${c > 1 ? 's' : ''}</b>`);
      parts.push(`<b>${d} dizaine${d > 1 ? 's' : ''}</b>`);
      parts.push(`<b>${u} unité${u > 1 ? 's' : ''}</b>`);
      const ordered = L >= 3 && chance(0.4) ? shuffle(parts) : parts;
      return {
        prompt: `Quel nombre a ${ordered.slice(0, -1).join(', ')} et ${ordered.at(-1)} ?`, type: 'numpad', answer: n,
        hint: 'Écris le chiffre des centaines, puis celui des dizaines, puis celui des unités.',
        explain: `${c ? c * 100 + ' + ' : ''}${d * 10} + ${u} = <b>${fmt(n)}</b>`,
      };
    },
  },
  {
    id: 'n_digit', label: 'Valeur des chiffres', minLevel: 2,
    gen(L) {
      const n = rand(100, maxN(L) - 1);
      const [c, d, u] = decomp(n);
      if (L >= 4 && chance(0.4)) {
        const tot = Math.floor(n / 10);
        return {
          prompt: `Combien y a-t-il de dizaines <b>en tout</b> dans ${fmt(n)} ?`, type: 'numpad', answer: tot,
          hint: `Chaque centaine contient 10 dizaines. ${c} centaine${c > 1 ? 's' : ''} = ${c * 10} dizaines.`,
          explain: `${c * 10} dizaines (dans les centaines) + ${d} = <b>${tot} dizaines</b>`,
        };
      }
      const which = pick([['centaines', c], ['dizaines', d], ['unités', u]]);
      return {
        prompt: `Dans <b>${fmt(n)}</b>, quel est le chiffre des <b>${which[0]}</b> ?`, type: 'numpad', answer: which[1],
        hint: 'De droite à gauche : unités, dizaines, centaines.',
        explain: `${fmt(n)} : ${c} centaines, ${d} dizaines, ${u} unités. Réponse : <b>${which[1]}</b>`,
      };
    },
  },
  {
    id: 'n_compare', label: 'Comparer deux nombres', minLevel: 1,
    gen(L) {
      const m = maxN(L);
      let a = rand(1, m - 1), b;
      const r = Math.random();
      if (r < 0.1) b = a;
      else if (r < 0.45 && a >= 10) {
        const s = String(a).split('').reverse().join(''); b = Number(s) === a ? a + 1 : Number(s);
      } else b = Math.max(0, Math.min(m - 1, a + rand(-15, 15) || 1));
      const ans = a < b ? '<' : a > b ? '>' : '=';
      return {
        prompt: 'Choisis le bon signe.', say: `Compare ${a} et ${b}. Choisis le bon signe.`,
        visual: `<div class="big-expr">${fmt(a)} <span class="slot">?</span> ${fmt(b)}</div>`,
        type: 'choice', choices: ['<', '=', '>'], answer: ans,
        hint: 'Compare d\'abord les centaines, puis les dizaines, puis les unités. La pointe du signe montre le plus petit nombre.',
        explain: `${fmt(a)} <b>${ans}</b> ${fmt(b)}`,
      };
    },
  },
  {
    id: 'n_order', label: 'Ranger des nombres', minLevel: 1,
    gen(L) {
      const count = L >= 3 ? 5 : 4, m = maxN(L);
      const base = rand(0, m - 60);
      const set = new Set();
      while (set.size < count) set.add(chance(0.5) ? rand(base, Math.min(base + 60, m - 1)) : rand(1, m - 1));
      const items = [...set];
      const desc = L >= 3 && chance(0.4);
      const answer = items.slice().sort((x, y) => (desc ? y - x : x - y));
      return {
        prompt: desc ? 'Range du <b>plus grand</b> au <b>plus petit</b>.' : 'Range du <b>plus petit</b> au <b>plus grand</b>.',
        type: 'order', items: shuffle(items), answer,
        hint: 'Cherche d\'abord le nombre qui a le moins (ou le plus) de centaines, puis de dizaines.',
        explain: answer.map(fmt).join(desc ? ' &gt; ' : ' &lt; '),
      };
    },
  },
  {
    id: 'n_line', label: 'Placer un nombre sur la droite graduée', minLevel: 1,
    gen(L) {
      const step = pick(L === 1 ? [1, 1, 10] : [1, 10, 10, 100]);
      const span = step * 10;
      const start = step === 100 ? 0 : rand(0, Math.floor((maxN(L) - span) / span)) * span;
      const idx = rand(1, 9);
      const target = start + idx * step;
      return {
        prompt: `Touche la graduation du nombre <b>${fmt(target)}</b>.`, type: 'line', answer: idx,
        line: { start, step, count: 10, labels: [0, 10] },
        hint: `Chaque trait avance de ${step}. Pars de ${fmt(start)} et compte de ${step} en ${step}.`,
        explain: `${fmt(start)} + ${idx} × ${step} = <b>${fmt(target)}</b> (le ${idx}<sup>e</sup> trait)`,
      };
    },
  },
  {
    id: 'n_words', label: 'Nombres écrits en lettres', minLevel: 1,
    gen(L) {
      const n = rand(L === 1 ? 11 : 100, maxN(L) - 1);
      return {
        prompt: 'Écris ce nombre en chiffres :', say: `Écris ce nombre en chiffres : ${n}`,
        visual: `<div class="words">${toWords(n)}</div>`, type: 'numpad', answer: n,
        hint: 'Découpe le nombre : d\'abord les centaines (« cent »), puis le reste.',
        explain: `${toWords(n)} = <b>${fmt(n)}</b>`,
      };
    },
  },
  {
    id: 'n_neighbors', label: 'Suivant, précédent, suites', minLevel: 1,
    gen(L) {
      const m = maxN(L), kind = pick(L >= 2 ? ['after', 'before', 'seq', 'seq'] : ['after', 'before', 'seq']);
      if (kind === 'seq') {
        const step = pick(L >= 3 ? [2, 5, 10, 100] : L === 2 ? [2, 5, 10] : [2, 10]);
        const start = rand(0, Math.max(0, m - step * 5) / step) * step + (step === 100 ? rand(0, 9) * 10 : 0);
        const seq = [0, 1, 2, 3].map((i) => start + i * step);
        const ans = start + 4 * step;
        if (ans >= m + 1) return this.gen(L);
        return {
          prompt: 'Quel nombre vient ensuite ?', say: `Complète la suite : ${seq.join(', ')}, et après ?`,
          visual: `<div class="big-expr">${seq.map(fmt).join(', ')}, <span class="slot">?</span></div>`, type: 'numpad', answer: ans,
          hint: `Regarde de combien on avance à chaque fois : ${seq[0]} → ${seq[1]}.`,
          explain: `On ajoute ${step} à chaque fois : ${fmt(seq[3])} + ${step} = <b>${fmt(ans)}</b>`,
        };
      }
      // Nombres « pièges » en fin de dizaine/centaine.
      const n = chance(0.6) ? rand(1, Math.floor(m / 10) - 1) * 10 + (kind === 'after' ? 9 : 0) : rand(1, m - 2);
      const ans = kind === 'after' ? n + 1 : n - 1;
      return {
        prompt: `Quel nombre vient juste <b>${kind === 'after' ? 'après' : 'avant'}</b> ${fmt(n)} ?`, type: 'numpad', answer: ans,
        hint: kind === 'after' ? 'Ajoute 1. Attention quand on arrive à 10 unités !' : 'Enlève 1. Attention quand il n\'y a plus d\'unités !',
        explain: `${fmt(n)} ${kind === 'after' ? '+' : '−'} 1 = <b>${fmt(ans)}</b>`,
      };
    },
  },
  {
    id: 'n_double', label: 'Doubles et moitiés', minLevel: 2,
    gen(L) {
      if (chance(0.5)) {
        const n = L >= 4 ? rand(10, 250) : rand(2, 50);
        return {
          prompt: `Quel est le <b>double</b> de ${n} ?`, type: 'numpad', answer: 2 * n,
          hint: `Le double, c'est ${n} + ${n}.`, explain: `${n} + ${n} = <b>${2 * n}</b>`,
        };
      }
      const h = L >= 4 ? rand(5, 250) : rand(1, 50), n = 2 * h;
      return {
        prompt: `Quelle est la <b>moitié</b> de ${n} ?`, type: 'numpad', answer: h,
        hint: `Cherche le nombre qui, ajouté à lui-même, donne ${n}.`, explain: `${h} + ${h} = ${n}, donc la moitié est <b>${h}</b>`,
      };
    },
  },
  {
    id: 'n_frac_name', label: 'Fractions : nommer (un demi, un tiers…)', minLevel: 1,
    gen(L) {
      const dens = L === 1 ? [2, 4] : L === 2 ? [2, 3, 4, 5, 6, 8, 10] : FRAC_DENS;
      const d = pick(dens), kind = fracKind(d);
      if (L === 1 && chance(0.4)) {
        return {
          prompt: `Quelle partie de la figure est coloriée ?`, visual: V.fraction(d, kind), type: 'choice',
          choices: d === 2 ? shuffle(['la moitié', 'un quart', 'le tout']) : shuffle(['un quart', 'la moitié', 'le tout']),
          answer: d === 2 ? 'la moitié' : 'un quart',
          hint: 'Compte en combien de parts égales la figure est partagée.',
          explain: d === 2 ? 'La figure est partagée en 2 parts égales : une part, c\'est <b>la moitié</b> (un demi).' : 'La figure est partagée en 4 parts égales : une part, c\'est <b>un quart</b>.',
        };
      }
      const others = sample(dens.filter((x) => x !== d), Math.min(3, dens.length - 1));
      return {
        prompt: 'Quelle fraction de la figure est coloriée ?', visual: V.fraction(d, kind), type: 'choice',
        choices: shuffle([d, ...others]).map((x) => fractionWords(1, x)), answer: fractionWords(1, d),
        hint: 'Compte en combien de parts égales le tout est partagé. Dans « cinquième » on entend cinq, dans « tiers » le t de trois.',
        explain: `Le tout est partagé en ${d} parts égales : une part, c'est <b>${fractionWords(1, d)}</b>.`,
      };
    },
  },
  {
    id: 'n_frac_equal', label: 'Fractions : parts égales ou pas ?', minLevel: 1,
    gen(L) {
      const d = pick(L === 1 ? [2, 4] : [2, 3, 4]), equal = chance(0.5), kind = pick(['rect', 'disc']);
      const name = fractionWords(1, d);
      return {
        prompt: `La partie coloriée est-elle <b>${name}</b> de la figure ?`, visual: V.fraction(d, kind, 1, !equal), type: 'choice',
        choices: ['Oui', 'Non'], answer: equal ? 'Oui' : 'Non',
        hint: `Pour parler ${name.replace('un ', 'd\'un ')}, il faut que le tout soit partagé en ${d} parts <b>égales</b>. Regarde bien la taille des parts.`,
        explain: equal ? `Oui : le tout est partagé en ${d} parts égales, une part est <b>${name}</b>.`
          : `<b>Non</b> : les parts ne sont pas égales, donc ce n'est pas ${name}.`,
      };
    },
  },
  {
    id: 'n_frac_write', label: 'Fractions : écriture en chiffres', minLevel: 2,
    gen(L) {
      const d = pick(L >= 3 ? FRAC_DENS : [2, 3, 4, 5, 6, 8, 10]), n = L >= 3 && chance(0.5) ? rand(1, d) : 1;
      const good = `${n}/${d}`, inv = `${d}/${n}`;
      const opts = new Set([good]);
      if (inv !== good) opts.add(inv); // erreur classique : inversion
      while (opts.size < 4) opts.add(`${pick([1, n])}/${pick(FRAC_DENS)}`);
      if (chance(0.5)) return {
        prompt: `Comment s'écrit en chiffres <b>${fractionWords(n, d)}</b> ?`, type: 'choice', choices: shuffle([...opts]), answer: good,
        hint: `Dis d'abord la fraction avec des mots : « ${fractionWords(n, d)} ». Le nombre de parts du partage s'écrit en bas.`,
        explain: `${fractionWords(n, d)} s'écrit ${fracHtml(n, d)}`,
      };
      const words = new Set([fractionWords(n, d)]);
      while (words.size < 4) words.add(fractionWords(pick([1, n]), pick(FRAC_DENS)));
      return {
        prompt: 'Comment se lit cette fraction ?', visual: `<div class="big-expr">${fracHtml(n, d)}</div>`,
        say: 'Comment se lit cette fraction ?', type: 'choice', choices: shuffle([...words]), answer: fractionWords(n, d),
        hint: `Le nombre du bas dit en combien de parts égales on partage (${d} : ${fractionWords(1, d).replace('un ', '')}), celui du haut combien on en prend.`,
        explain: `${fracHtml(n, d)} se lit <b>${fractionWords(n, d)}</b>`,
      };
    },
  },
  {
    id: 'n_frac_many', label: 'Fractions : plusieurs parts (deux tiers, trois quarts…)', minLevel: 3,
    gen() {
      const d = pick([3, 4, 5, 6, 8, 10]), n = rand(2, d);
      const good = `${n}/${d}`, opts = new Set([good, `${d}/${n}`, `${n - 1}/${d}`, `${n}/${d + (d < 10 ? 1 : -1)}`].filter((x) => !x.startsWith('0/')));
      while (opts.size < 4) opts.add(`${rand(1, d)}/${d}`);
      return {
        prompt: 'Quelle fraction de la figure est coloriée ?', visual: V.fraction(d, fracKind(d), n), type: 'choice',
        choices: shuffle([good, ...sample([...opts].filter((x) => x !== good), 3)]), answer: good,
        hint: `Compte les parts égales (en bas), puis les parts coloriées (en haut).`,
        explain: `${n} parts coloriées sur un tout partagé en ${d} parts égales : ${fracHtml(n, d)} (${fractionWords(n, d)})${n === d ? ', c\'est le tout !' : ''}`,
      };
    },
  },
  {
    id: 'n_frac_compare', label: 'Fractions : comparer', minLevel: 4,
    gen() {
      let a, b, why;
      if (chance(0.5)) { // fractions unitaires : plus il y a de parts, plus elles sont petites
        [a, b] = sample(FRAC_DENS, 2).map((d) => [1, d]);
        why = 'Pour un même tout, plus il y a de parts, plus chaque part est petite.';
      } else { // même nombre de parts
        const d = pick(FRAC_DENS.filter((x) => x > 2)), [n1, n2] = sample(Array.from({ length: d }, (_, i) => i + 1), 2);
        [a, b] = [[n1, d], [n2, d]];
        why = 'Les parts ont la même taille : il suffit de compter combien on en prend.';
      }
      const va = a[0] / a[1], vb = b[0] / b[1], ans = va < vb ? '<' : va > vb ? '>' : '=';
      return {
        prompt: 'Choisis le bon signe.', say: `Compare ${fractionWords(...a)} et ${fractionWords(...b)}.`,
        visual: `<div class="big-expr">${fracHtml(...a)} <span class="slot">?</span> ${fracHtml(...b)}</div><div class="frac-pair">${V.fraction(a[1], 'rect', a[0])}${V.fraction(b[1], 'rect', b[0])}</div>`,
        type: 'choice', choices: ['<', '=', '>'], answer: ans, hint: why,
        explain: `${fracHtml(...a)} <b>${ans}</b> ${fracHtml(...b)} : ${why.toLowerCase()}`,
      };
    },
  },
  {
    id: 'n_frac_add', label: 'Fractions : additionner, soustraire (même partage)', minLevel: 4,
    gen() {
      const d = pick([3, 4, 5, 6, 8, 10]), plus = chance(0.6);
      let n1 = rand(1, d - 1), n2 = rand(1, d - n1);
      if (!plus) { const t = n1 + n2; n1 = t; }
      const r = plus ? n1 + n2 : n1 - n2;
      const good = `${r}/${d}`, opts = new Set([good, `${r}/${plus ? 2 * d : d}`, `${plus ? r : n1 + n2}/${d}`]);
      if (r > 0) opts.add(`${r - 1}/${d}`);
      while (opts.size < 4) opts.add(`${rand(1, d)}/${d}`);
      return {
        prompt: `Calcule :`, say: `Combien font ${fractionWords(n1, d)} ${plus ? 'plus' : 'moins'} ${fractionWords(n2, d)} ?`,
        visual: `<div class="big-expr">${fracHtml(n1, d)} ${plus ? '+' : '−'} ${fracHtml(n2, d)} = <span class="slot">?</span></div>`,
        type: 'choice', choices: shuffle([...opts]), answer: good,
        hint: `Ce sont des ${fractionWords(2, d).split(' ')[1]} : on ${plus ? 'ajoute' : 'enlève'} des parts de même taille, le partage ne change pas.`,
        explain: `${fractionWords(n1, d)} ${plus ? '+' : '−'} ${fractionWords(n2, d)} = <b>${fractionWords(r, d)}</b> ${fracHtml(r, d)}`,
      };
    },
  },
  {
    id: 'n_frac_problem', label: 'Fractions : problèmes', minLevel: 3,
    gen(L) {
      if (L >= 4 && chance(0.5)) {
        const d = pick([2, 3, 4, 5, 10]), each = rand(2, 10), tot = d * each, [thing, em] = pick(ITEMS);
        return {
          prompt: `Combien font <b>${fractionWords(1, d)}</b> de ${tot} ${thing} ?`, visual: `<div class="emoji-big">${em}</div>`,
          type: 'numpad', answer: each,
          hint: `${fractionWords(1, d)} : on partage les ${tot} ${thing} en ${d} parts égales et on en prend une.`,
          explain: `${tot} partagé en ${d} parts égales : ${d} × ${each} = ${tot}, donc <b>${each}</b>`,
        };
      }
      const [p1, p2] = sample(NAMES, 2);
      const k = pick(['pizza', 'gourde', 'cake']);
      if (k === 'pizza') return {
        prompt: `${p1} mange la moitié d'une pizza. ${p2} mange un quart de la même pizza. Quelle fraction de la pizza reste-t-il ?`,
        visual: V.fraction(4, 'disc', 3), type: 'choice', choices: shuffle(['un quart', 'la moitié', 'trois quarts', 'rien']), answer: 'un quart',
        hint: 'Partage la pizza en 4 parts égales : la moitié, c\'est 2 quarts.',
        explain: 'La moitié (2 quarts) + un quart = trois quarts mangés. Il reste <b>un quart</b> de la pizza.',
      };
      if (k === 'cake') return {
        prompt: `${p1} partage un cake en 5 parts égales. ${p2} recoupe chaque part en 2 parts égales et en mange une. Quelle fraction du cake a été mangée ?`,
        visual: V.fraction(10, 'rect', 1), type: 'choice', choices: shuffle(['1/10', '1/5', '1/2', '2/5']), answer: '1/10',
        hint: '5 parts recoupées chacune en 2 : combien de parts égales en tout ?',
        explain: `5 × 2 = 10 parts égales : une part, c'est ${fracHtml(1, 10)} (<b>un dixième</b>).`,
      };
      return {
        prompt: `${p1} et ${p2} ont bu chacun la moitié de leur gourde. Pourtant, il reste plus d'eau à ${p2}. Est-ce possible ?`,
        type: 'choice', choices: ['Oui, si sa gourde est plus grande', 'Non, c\'est impossible'], answer: 'Oui, si sa gourde est plus grande',
        hint: 'La moitié de quoi ? Une fraction dépend du tout.',
        explain: '<b>Oui</b> : la moitié d\'une grande gourde, c\'est plus que la moitié d\'une petite. Une fraction dépend du tout.',
      };
    },
  },
];

// ---------------------------------------------------------------- Calcul
function addPair(L) {
  if (L === 1) { const a = rand(10, 89), b = rand(1, 9); return a + b < 100 ? [a, b] : [a - 10, b]; }
  if (L === 2) { const a = rand(10, 70), b = rand(10, 99 - a); return [a, b]; }
  const m = calcN(L), a = rand(100, m - 100), b = chance(0.5) ? rand(1, 9) * 10 : rand(11, Math.min(99, m - a - 1));
  return [a, b];
}

const calcul = [
  {
    id: 'c_add', label: 'Additions en calcul mental', minLevel: 1,
    gen(L) {
      const [a, b] = addPair(L), s = a + b;
      const d = Math.floor(b / 10) * 10, u = b % 10;
      return {
        prompt: `${fmt(a)} + ${b} = ?`, type: 'numpad', answer: s,
        hint: d && u ? `Ajoute d'abord ${d}, puis ${u}.` : 'Ajoute les unités aux unités et les dizaines aux dizaines.',
        explain: d && u ? `${fmt(a)} + ${d} = ${fmt(a + d)}, puis + ${u} = <b>${fmt(s)}</b>` : `${fmt(a)} + ${b} = <b>${fmt(s)}</b>`,
      };
    },
  },
  {
    id: 'c_sub', label: 'Soustractions en calcul mental', minLevel: 1,
    gen(L) {
      const [x, b] = addPair(L), a = x + b, r = x;
      const d = Math.floor(b / 10) * 10, u = b % 10;
      return {
        prompt: `${fmt(a)} − ${b} = ?`, type: 'numpad', answer: r,
        hint: d && u ? `Enlève d'abord ${d}, puis ${u}.` : `Tu peux compter à rebours, ou chercher ${b} + ? = ${a}.`,
        explain: d && u ? `${fmt(a)} − ${d} = ${fmt(a - d)}, puis − ${u} = <b>${fmt(r)}</b>` : `${fmt(a)} − ${b} = <b>${fmt(r)}</b>`,
      };
    },
  },
  {
    id: 'c_complement', label: 'Compléments à 10 et à 100', minLevel: 1,
    gen(L) {
      const to = L === 1 ? pick([10, 10, 100]) : L === 2 ? pick([10, 100]) : 100;
      const a = to === 10 ? rand(1, 9) : L <= 3 ? rand(1, 19) * 5 : rand(1, 99);
      return {
        prompt: `${a} + ? = ${to}`, say: `${a} plus combien égale ${to} ?`,
        type: 'numpad', answer: to - a,
        hint: to === 10 ? 'Compte sur tes doigts à partir du premier nombre.' : `Va d'abord jusqu'à la dizaine suivante, puis jusqu'à 100.`,
        explain: `${a} + <b>${to - a}</b> = ${to}`,
      };
    },
  },
  {
    id: 'c_tens', label: 'Ajouter ou enlever 10, 100', minLevel: 1,
    gen(L) {
      const step = L === 1 ? 10 : pick([10, 100, 20, 50].filter((s) => s * 2 < calcN(L)));
      const plus = chance(0.5), m = calcN(L);
      const a = plus ? rand(1, m - step - 1) : rand(step, m - 1);
      const r = plus ? a + step : a - step;
      return {
        prompt: `${fmt(a)} ${plus ? '+' : '−'} ${step} = ?`, type: 'numpad', answer: r,
        hint: step % 100 === 0 ? 'Seul le chiffre des centaines change.' : step === 10 ? 'Seul le chiffre des dizaines change (sauf si on passe une centaine).' : `Ajoute ou enlève ${step / 10} dizaines.`,
        explain: `${fmt(a)} ${plus ? '+' : '−'} ${step} = <b>${fmt(r)}</b>`,
      };
    },
  },
  {
    id: 'c_missing', label: 'Additions à trou', minLevel: 2,
    gen(L) {
      const [a, b] = addPair(L), s = a + b;
      return {
        prompt: `${fmt(a)} + ? = ${fmt(s)}`, say: `${a} plus combien égale ${s} ?`, type: 'numpad', answer: b,
        hint: `Calcule l'écart entre ${fmt(a)} et ${fmt(s)}, ou fais ${fmt(s)} − ${fmt(a)}.`,
        explain: `${fmt(s)} − ${fmt(a)} = <b>${b}</b>`,
      };
    },
  },
  {
    id: 'c_add9', label: 'Ajouter 9, 19, 29 ; soustraire 9', minLevel: 1,
    gen(L) {
      const opts = L === 1 ? [9] : L === 2 ? [9, 19, -9] : [9, 19, 29, -9];
      const k = pick(opts), m = calcN(L);
      // Parfois un nombre qui finit par 0 ou 1 : la procédure n'est alors pas utile.
      const easy = chance(0.2);
      let a = rand(k < 0 ? 10 : 1, m - Math.abs(k) - 1);
      if (easy) a = a - (a % 10) + pick([0, 1]);
      if (k < 0 && a < 10) a += 10;
      const r = a + k, abs = Math.abs(k), round = abs + 1;
      if (k < 0) return {
        prompt: `${fmt(a)} − 9 = ?`, type: 'numpad', answer: r,
        hint: 'Pour enlever 9, enlève 10 puis ajoute 1.',
        explain: `${fmt(a)} − 10 + 1 = ${fmt(a - 10)} + 1 = <b>${fmt(r)}</b>`,
      };
      const direct = a % 10 <= 1;
      return {
        prompt: `${fmt(a)} + ${abs} = ?`, type: 'numpad', answer: r,
        hint: direct ? `${fmt(a)} finit par ${a % 10} : tu peux ajouter ${abs} directement.`
          : `Pour ajouter ${abs}, ajoute ${round} puis enlève 1.`,
        explain: direct ? `${fmt(a)} + ${abs} = <b>${fmt(r)}</b>`
          : `${fmt(a)} + ${abs} = ${fmt(a)} + ${round} − 1 = ${fmt(a + round)} − 1 = <b>${fmt(r)}</b>`,
      };
    },
  },
  {
    id: 'c_mult', label: 'Tables de multiplication', minLevel: 1,
    gen(L, opts) {
      const t = pick(tablesFor(L, opts)), k = rand(0, 10) || rand(1, 10);
      const [a, b] = chance(0.5) ? [t, k] : [k, t];
      return {
        prompt: `${a} × ${b} = ?`, type: 'numpad', answer: a * b, fact: [a, b],
        visual: a * b && a * b <= 30 ? V.groups(Math.min(a, b), Math.max(a, b), '⭐') : undefined,
        hint: multHint(a, b), explain: `${a} fois ${b}, <b>${a * b}</b>`,
      };
    },
  },
  {
    id: 'c_mult_inv', label: 'Tables dans les deux sens (? × 7 = 42)', minLevel: 2,
    gen(L, opts) {
      const t = pick(tablesFor(L, opts).filter((x) => x > 1).concat([2])), k = rand(2, 10), c = t * k;
      const q = pick([
        [`? × ${t} = ${c}`, `Combien de fois ${t} égale ${c} ?`, `<b>${k}</b> × ${t} = ${c}`],
        [`${t} × ? = ${c}`, `${t} fois combien égale ${c} ?`, `${t} × <b>${k}</b> = ${c}`],
        [`${c} = ${t} × ?`, `${c} égale ${t} fois combien ?`, `${c} = ${t} × <b>${k}</b>`],
      ]);
      return {
        prompt: q[0], say: q[1], type: 'numpad', answer: k, fact: [k, t],
        hint: `Récite la table de ${t} : ${t}, ${2 * t}, ${3 * t}… jusqu'à ${c}.`, explain: `${q[2]} (${k} fois ${t}, ${c})`,
      };
    },
  },
  {
    id: 'c_mult10', label: 'Multiplier par 10', minLevel: 1,
    gen(L) {
      const n = rand(2, L === 1 ? 19 : 99);
      const [a, b] = chance(0.5) ? [n, 10] : [10, n];
      return {
        prompt: `${a} × ${b} = ?`, type: 'numpad', answer: n * 10,
        hint: `${n} × 10, c'est ${n} dizaines.`, explain: `${n} dizaines = <b>${fmt(n * 10)}</b>`,
      };
    },
  },
  {
    id: 'c_mult_big', label: 'Multiplier 11 à 19 par un petit nombre', minLevel: 3,
    gen(L) {
      const big = rand(11, 19), small = rand(2, L >= 4 ? 9 : 5), u = big - 10;
      return {
        prompt: `${big} × ${small} = ?`, type: 'numpad', answer: big * small,
        hint: `Décompose ${big} en 10 + ${u} : calcule 10 × ${small}, puis ${u} × ${small}, et ajoute.`,
        explain: `${big} × ${small} = 10 × ${small} + ${u} × ${small} = ${10 * small} + ${u * small} = <b>${big * small}</b>`,
      };
    },
  },
  {
    id: 'c_posed', label: 'Opérations posées', minLevel: 2,
    gen(L) {
      const m = calcN(L);
      if (L >= 3 && chance(0.4)) {
        const a = rand(200, m - 1), b = rand(20, a - 50);
        return {
          prompt: 'Calcule cette soustraction posée :', say: `Calcule ${a} moins ${b}`, visual: V.column([a, b], '−'), type: 'numpad', answer: a - b,
          hint: 'Commence par les unités, à droite. Si tu ne peux pas enlever, échange une dizaine contre 10 unités.',
          explain: `${fmt(a)} − ${fmt(b)} = <b>${fmt(a - b)}</b>`,
        };
      }
      const three = L >= 3 && chance(0.4);
      const nums = three ? [rand(20, m / 4), rand(10, m / 4), rand(10, m / 4)].map(Math.floor) : [rand(15, m / 2), rand(15, m / 2 - 1)].map(Math.floor);
      const s = nums.reduce((x, y) => x + y, 0);
      return {
        prompt: 'Calcule cette addition posée :', say: `Calcule ${nums.join(' plus ')}`, visual: V.column(nums, '+'), type: 'numpad', answer: s,
        hint: 'Commence par les unités, à droite. Si tu dépasses 9, pose la retenue au-dessus des dizaines.',
        explain: `${nums.map(fmt).join(' + ')} = <b>${fmt(s)}</b>`,
      };
    },
  },
];

// ---------------------------------------------------------------- Problèmes
const ITEMS = [
  ['billes', '🔵'], ['cartes', '🃏'], ['bonbons', '🍬'], ['autocollants', '⭐'], ['pommes', '🍎'], ['coquillages', '🐚'], ['fleurs', '🌼'],
];
const probRange = (L) => [0, 50, 100, 300, 600, 900][L];

const problemes = [
  {
    id: 'p_change', label: 'Problèmes : ajout ou retrait (état final)', minLevel: 1,
    gen(L) {
      const who = pick(NAMES), [thing, em] = pick(ITEMS), R = probRange(L);
      const a = rand(5, Math.floor(R * 0.7)), b = rand(2, Math.max(3, Math.floor(R * 0.3)));
      if (chance(0.5)) {
        return {
          prompt: `${who} a ${a} ${thing}. Pendant la récréation, ${who} en gagne ${b}. Combien ${de(thing)} a ${who} maintenant ?`,
          visual: `<div class="emoji-big">${em}</div>`, type: 'numpad', answer: a + b,
          hint: `${who} gagne des ${thing} : il y en a plus qu'avant. Il faut ajouter.`,
          explain: `${a} + ${b} = <b>${a + b}</b> ${thing}${V.barParts(a, b, 'total')}`,
        };
      }
      const big = a + b;
      return {
        prompt: `${who} a ${big} ${thing}. ${who} en donne ${b} à un ami. Combien ${de(thing)} reste-t-il ?`,
        visual: `<div class="emoji-big">${em}</div>`, type: 'numpad', answer: a,
        hint: `Le tout, c'est les ${big} ${thing} du début. Une partie est donnée, on cherche l'autre partie : il faut enlever.`,
        explain: `${big} − ${b} = <b>${a}</b> ${thing}${V.barParts(b, a, 'b')}`,
      };
    },
  },
  {
    id: 'p_change_unknown', label: 'Problèmes : retrouver l\'ajout ou l\'état de départ', minLevel: 2,
    gen(L) {
      const [p1, p2] = sample(NAMES, 2), [thing] = pick(ITEMS), R = probRange(L);
      const start = rand(10, Math.floor(R * 0.6)), add = rand(5, Math.max(6, Math.floor(R * 0.35))), end = start + add;
      const kind = L >= 3 ? pick(['added', 'initial', 'removed']) : pick(['added', 'removed']);
      if (kind === 'added') return {
        prompt: `Ce matin, ${p1} avait ${start} ${thing}. ${p2} lui en a donné. Maintenant, ${p1} a ${end} ${thing}. Combien ${de(thing)} ont été donnés ?`,
        type: 'numpad', answer: add,
        hint: `Le tout, c'est ce que ${p1} a maintenant (${end}). Une partie, c'est ce qu'il y avait ce matin. On cherche l'autre partie.`,
        explain: `${end} − ${start} = <b>${add}</b>${V.barParts(start, add, 'b')}`,
      };
      if (kind === 'initial') return {
        prompt: `${p1} avait des ${thing}. ${p2} lui en a donné ${add}. Maintenant, ${p1} a ${end} ${thing}. Combien ${de(thing)} y avait-il au début ?`,
        type: 'numpad', answer: start,
        hint: `Le tout, c'est les ${end} ${thing} de maintenant. Il est fait de ce qu'il y avait au début et des ${add} reçus.`,
        explain: `${end} − ${add} = <b>${start}</b>${V.barParts(start, add, 'a')}`,
      };
      return {
        prompt: `${p1} avait ${end} ${thing}. Une partie a été perdue. Il en reste ${start}. Combien ${de(thing)} ont été perdus ?`,
        type: 'numpad', answer: add,
        hint: `Le tout, c'est les ${end} ${thing} du début. Une partie est restée (${start}), l'autre a été perdue.`,
        explain: `${end} − ${start} = <b>${add}</b>${V.barParts(start, add, 'b')}`,
      };
    },
  },
  {
    id: 'p_parts', label: 'Problèmes : le tout et les parties', minLevel: 1,
    gen(L) {
      const R = probRange(L), a = rand(3, Math.floor(R / 2)), b = rand(3, Math.floor(R / 2));
      // [partie 1, partie 2, question du tout, question de la 2e partie, phrase du tout]
      const [p1, p2, askAll, askPart, total] = pick([
        [`${a} pièces dans le coffre rouge`, `${b} pièces dans le coffre bleu`, 'Combien y a-t-il de pièces dans les deux coffres ?', 'Combien y a-t-il de pièces dans le coffre bleu ?', 'pièces rangées dans les deux coffres'],
        [`${a} pommes`, `${b} poires`, 'Combien y a-t-il de fruits dans la corbeille ?', 'Combien y a-t-il de poires ?', 'fruits dans la corbeille : des pommes et des poires'],
        [`${a} filles`, `${b} garçons`, 'Combien y a-t-il d\'enfants dans la cour ?', 'Combien y a-t-il de garçons ?', 'enfants dans la cour : des filles et des garçons'],
        [`${a} perles jaunes`, `${b} perles vertes`, 'Combien y a-t-il de perles en tout ?', 'Combien y a-t-il de perles vertes ?', 'perles dans la boîte : des jaunes et des vertes'],
      ]);
      if (L >= 4 && chance(0.25)) {
        const [x, y, z] = [rand(20, R / 3), rand(20, R / 3), rand(20, R / 3)].map(Math.floor);
        return {
          prompt: `Au zoo, il y a ${x} oiseaux, ${y} singes et ${z} lions. Combien d'animaux y a-t-il au zoo ?`, type: 'numpad', answer: x + y + z,
          hint: 'Il y a trois parties et on cherche le tout : on additionne les trois parties.',
          explain: `${x} + ${y} + ${z} = <b>${x + y + z}</b>`,
        };
      }
      if (L === 1 || chance(0.4)) return {
        prompt: `Il y a ${p1} et ${p2}. ${askAll}`, type: 'numpad', answer: a + b,
        hint: 'On connaît les deux parties, on cherche le tout : il faut ajouter.', explain: `${a} + ${b} = <b>${a + b}</b>${V.barParts(a, b, 'total')}`,
      };
      return {
        prompt: `Il y a ${a + b} ${total}. Il y a ${p1}. ${askPart}`, type: 'numpad', answer: b,
        hint: `Tu connais le tout (${a + b}) et une partie (${a}). On cherche l'autre partie : on enlève.`,
        explain: `${a + b} − ${a} = <b>${b}</b>${V.barParts(a, b, 'b')}`,
      };
    },
  },
  {
    id: 'p_model', label: 'Problèmes : choisir le bon calcul', minLevel: 2,
    gen(L) {
      const [p1, p2] = sample(NAMES, 2), [thing] = pick(ITEMS), R = probRange(L);
      const a = rand(10, Math.floor(R * 0.6)), b = rand(5, Math.max(6, Math.floor(R * 0.35))), t = a + b;
      const add = `${a} + ${b}`, sub = (x) => `${t} − ${x}`;
      // [énoncé, bon calcul, mauvais calculs, explication, schéma]
      const stories = [
        [`${p1} avait ${t} ${thing}. ${p1} en donne ${b}. Combien en reste-t-il ?`, sub(b), [`${t} + ${b}`, `${b} − ${t}`],
          'Le tout est connu (ce qu\'il y avait au début), on cherche une partie.', V.barParts(b, a, 'b')],
        [`${p1} a ${a} ${thing} et ${p2} en a ${b}. Combien en ont-ils à eux deux ?`, add, [`${Math.max(a, b)} − ${Math.min(a, b)}`, `${a} + ${a}`],
          'On connaît les deux parties, on cherche le tout.', V.barParts(a, b, 'total')],
        [`${p1} avait des ${thing}. ${p2} lui en donne ${b}. Maintenant, ${p1} en a ${t}. Combien y en avait-il au début ?`, sub(b), [`${t} + ${b}`, `${b} − ${t}`],
          'Le tout, c\'est ce qu\'il y a maintenant. On cherche une partie : ce qu\'il y avait au début.', V.barParts(a, b, 'a')],
        [`Il y a ${t} ${thing} dans un sac : ${a} sont à ${p1}, les autres sont à ${p2}. Combien sont à ${p2} ?`, sub(a), [`${t} + ${a}`, `${a} − ${t}`],
          'Le tout est connu, une partie aussi : on cherche l\'autre partie.', V.barParts(a, b, 'b')],
        [`${p1} a ${a} ${thing}. ${p1} en gagne ${b}. Combien y en a-t-il maintenant ?`, add, [`${Math.max(a, b)} − ${Math.min(a, b)}`, `${b} + ${b}`],
          'Ce qu\'il y avait et ce qui est gagné sont les deux parties ; on cherche le tout.', V.barParts(a, b, 'total')],
      ];
      const [text, ans, wrong, why, bar] = pick(stories);
      return {
        prompt: `${text}<br><b>Quel calcul permet de répondre ?</b>`, say: `${text} Quel calcul permet de répondre ?`,
        type: 'choice', choices: shuffle([ans, ...[...new Set(wrong)].filter((w) => w !== ans)]), answer: ans,
        hint: 'Cherche-t-on le tout ou une partie ? Pour trouver le tout, on additionne les parties. Pour trouver une partie, on enlève l\'autre partie du tout.',
        explain: `${why} Le bon calcul est <b>${ans}</b>.${bar}`,
      };
    },
  },
  {
    id: 'p_compare', label: 'Problèmes de comparaison', minLevel: 2,
    gen(L) {
      const [p1, p2] = sample(NAMES, 2), [thing] = pick(ITEMS), R = probRange(L);
      const a = rand(5, Math.floor(R * 0.6)), d = rand(2, Math.max(3, Math.floor(R * 0.3)));
      const k = L >= 4 ? pick(['more', 'less', 'diff']) : pick(['more', 'diff']);
      if (k === 'more') return {
        prompt: `${p1} a ${a} ${thing}. ${p2} en a ${d} de plus que ${p1}. Combien ${de(thing)} a ${p2} ?`, type: 'numpad', answer: a + d,
        hint: `${p2} en a plus que ${p1} : autant que ${p1}, et encore ${d}.`, explain: `${a} + ${d} = <b>${a + d}</b>${V.barCompare(a + d, a, [p2, p1], 'big')}`,
      };
      if (k === 'less') return {
        prompt: `${p1} a ${a + d} ${thing}. ${p2} en a ${d} de moins que ${p1}. Combien ${de(thing)} a ${p2} ?`, type: 'numpad', answer: a,
        hint: `${p2} en a moins : il faut enlever ${d}.`, explain: `${a + d} − ${d} = <b>${a}</b>${V.barCompare(a + d, a, [p1, p2], 'small')}`,
      };
      return {
        prompt: `${p1} a ${a + d} ${thing} et ${p2} en a ${a}. ${p1} en a combien de plus que ${p2} ?`, type: 'numpad', answer: d,
        hint: `Cherche l'écart : ${a} + ? = ${a + d}.`, explain: `${a + d} − ${a} = <b>${d}</b>${V.barCompare(a + d, a, [p1, p2], 'diff')}`,
      };
    },
  },
  {
    id: 'p_mult', label: 'Problèmes de groupements (multiplication)', minLevel: 2,
    gen(L) {
      const per = pick(L === 2 ? [2, 5, 10] : [2, 3, 4, 5, 10]), n = rand(2, L === 2 ? 5 : 9);
      const [box, thing, em] = pick([['boîtes', 'œufs', '🥚'], ['sachets', 'bonbons', '🍬'], ['paquets', 'cartes', '🃏'], ['vases', 'fleurs', '🌼']]);
      return {
        prompt: `Il y a ${n} ${box}. Dans chaque ${box.slice(0, -1)}, il y a ${per} ${thing}. Combien y a-t-il ${de(thing)} en tout ?`,
        visual: n * per <= 40 ? V.groups(n, per, em) : undefined, type: 'numpad', answer: n * per,
        hint: `${n} fois ${per} ${thing}. Tu peux compter de ${per} en ${per}.`,
        explain: `${n} × ${per} = <b>${n * per}</b> ${thing}`,
      };
    },
  },
  {
    id: 'p_share', label: 'Problèmes de partage', minLevel: 3,
    gen(L) {
      const k = rand(2, 5), each = rand(2, L >= 4 ? 10 : 6), tot = k * each;
      const [thing, em] = pick(ITEMS);
      return {
        prompt: `On partage équitablement ${tot} ${thing} entre ${k} enfants. Combien ${de(thing)} aura chaque enfant ?`,
        visual: `<div class="emoji-big">${em.repeat(Math.min(tot, 12))}${tot > 12 ? '…' : ''}</div>`, type: 'numpad', answer: each,
        hint: `Distribue un par un à chaque enfant, ou cherche : ${k} × ? = ${tot}.`,
        explain: `${k} × ${each} = ${tot}, donc chacun en a <b>${each}</b>`,
      };
    },
  },
  {
    id: 'p_two_steps', label: 'Problèmes en deux étapes', minLevel: 4,
    gen(L) {
      const R = probRange(L);
      const a = rand(50, Math.floor(R / 2)), b = rand(10, 90), c = rand(5, a);
      return {
        prompt: `Dans le bus, il y a ${a} passagers. Au premier arrêt, ${b} personnes montent. Au deuxième arrêt, ${c} personnes descendent. Combien de passagers y a-t-il maintenant ?`,
        visual: '<div class="emoji-big">🚌</div>', type: 'numpad', answer: a + b - c,
        hint: `Fais une étape à la fois : d'abord ${a} + ${b}, puis enlève ${c}.`,
        explain: `${a} + ${b} = ${a + b}, puis ${a + b} − ${c} = <b>${a + b - c}</b>`,
      };
    },
  },
];

// ---------------------------------------------------------------- Grandeurs & géométrie
const FRAC_DENS = [2, 3, 4, 5, 6, 8, 10];
const fracKind = (d) => (d === 6 || d === 3 ? pick(['hex', 'disc', 'rect']) : [2, 4, 8].includes(d) ? pick(['square', 'disc', 'rect', 'fan']) : pick(['disc', 'rect']));
const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const fmtTime = (h, m) => `${h} h${m ? ' ' + String(m).padStart(2, '0') : ''}`;

const grandeurs = [
  {
    id: 'g_money', label: 'Monnaie : compter les euros', minLevel: 1,
    gen(L) {
      const pool = L === 1 ? [1, 2, 2, 5] : L === 2 ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50];
      const n = L === 1 ? rand(2, 4) : rand(3, 6);
      const vals = Array.from({ length: n }, () => pick(pool)).sort((x, y) => y - x);
      const tot = vals.reduce((x, y) => x + y, 0);
      return {
        prompt: 'Combien d\'euros y a-t-il en tout ?', visual: V.money(vals), type: 'numpad', answer: tot, suffix: '€',
        hint: 'Commence par les billets les plus gros, puis ajoute les pièces.',
        explain: `${vals.join(' + ')} = <b>${tot} €</b>`,
      };
    },
  },
  {
    id: 'g_units', label: 'Choisir la bonne unité', minLevel: 1,
    gen(L) {
      const list = [
        ['Un crayon mesure environ…', '15 cm', ['15 m', '15 km']],
        ['La porte de la classe est haute d\'environ…', '2 m', ['2 cm', '2 km']],
        ['Un trajet en voiture entre deux villes :', '30 km', ['30 cm', '30 m']],
        ['La longueur d\'une gomme :', '4 cm', ['4 m', '4 km']],
        ['La longueur d\'une piscine :', '25 m', ['25 cm', '25 km']],
        ['La taille d\'un enfant de 7 ans :', '1 m 20 cm', ['12 m', '120 km']],
      ];
      if (L >= 3) list.push(
        ['Un sac de farine pèse…', '1 kg', ['1 g', '100 kg']],
        ['Une fraise pèse environ…', '20 g', ['20 kg', '2 kg']],
        ['Un chat pèse environ…', '4 kg', ['4 g', '400 kg']],
      );
      const [q, good, bad] = pick(list);
      return {
        prompt: q, type: 'choice', choices: shuffle([good, ...bad]), answer: good,
        hint: 'Imagine l\'objet : 1 cm, c\'est la largeur d\'un doigt ; 1 m, un grand pas ; 1 km, une longue marche.',
        explain: `La bonne réponse est <b>${good}</b>.`,
      };
    },
  },
  {
    id: 'g_ruler', label: 'Mesurer avec une règle', minLevel: 2,
    gen(L) {
      const len = rand(2, 9), start = L >= 3 && chance(0.5) ? rand(1, 12 - len) : 0;
      return {
        prompt: 'Combien mesure le trait bleu ?', visual: V.ruler(start, len), type: 'numpad', answer: len, suffix: 'cm',
        hint: start ? `Le trait ne commence pas à 0 ! Compte les centimètres de ${start} à ${start + len}.` : 'Le trait commence au 0 : lis le nombre au bout du trait.',
        explain: start ? `${start + len} − ${start} = <b>${len} cm</b>` : `<b>${len} cm</b>`,
      };
    },
  },
  {
    id: 'g_conv', label: 'Unités : 1 m = 100 cm, 1 kg = 1 000 g…', minLevel: 3,
    gen(L) {
      const list = [['1 m', 'cm', 100], ['1 €', 'centimes', 100], ['2 m', 'cm', 200]];
      if (L >= 4) list.push(['1 kg', 'g', 1000], ['3 m', 'cm', 300], ['1 km', 'm', 1000]);
      const [a, unit, ans] = pick(list);
      return {
        prompt: `${a} = ? ${unit}`, say: `${a.replace('€', 'euro')}, c'est combien de ${unit} ?`, type: 'numpad', answer: ans, suffix: unit,
        hint: 'C\'est une égalité à connaître par cœur : 1 m = 100 cm, 1 € = 100 centimes, 1 kg = 1 000 g, 1 km = 1 000 m.',
        explain: `${a} = <b>${fmt(ans)} ${unit}</b>`,
      };
    },
  },
  {
    id: 'g_shapes', label: 'Reconnaître les figures', minLevel: 1,
    gen(L) {
      const shapes = L >= 3 ? ['carré', 'rectangle', 'triangle', 'triangle rectangle', 'cercle'] : ['carré', 'rectangle', 'triangle', 'cercle'];
      const s = pick(shapes), color = pick(['#ff8a3d', '#3dc1ff', '#ffd23f', '#5bd67c', '#c77dff']);
      const sides = { 'carré': 4, rectangle: 4, triangle: 3, 'triangle rectangle': 3, cercle: 0 }[s];
      if (L >= 2 && s !== 'cercle' && chance(0.4)) {
        return {
          prompt: `Combien de côtés a cette figure ?`, visual: V.shape(s, color), type: 'numpad', answer: sides,
          hint: 'Un côté est un trait droit. Compte-les en faisant le tour de la figure.',
          explain: `Un ${s} a <b>${sides} côtés</b>.`,
        };
      }
      const choices = shuffle([s, ...sample(shapes.filter((x) => x !== s), 2)]);
      return {
        prompt: 'Comment s\'appelle cette figure ?', visual: V.shape(s, color), type: 'choice', choices, answer: s,
        hint: {
          'carré': '4 côtés tous de la même longueur et 4 angles droits.',
          rectangle: '4 angles droits, mais les côtés n\'ont pas tous la même longueur.',
          triangle: 'Compte ses côtés : 3 côtés.',
          'triangle rectangle': '3 côtés et un angle droit (marqué par le petit carré).',
          cercle: 'Il est tout rond, sans côté.',
        }[s],
        explain: `C'est un <b>${s}</b>.`,
      };
    },
  },
  {
    id: 'g_solids', label: 'Reconnaître les solides', minLevel: 2,
    gen() {
      const names = ['cube', 'pavé', 'boule', 'cylindre', 'cône', 'pyramide'];
      const n = pick(names);
      const hints = {
        cube: '6 faces carrées, toutes pareilles, comme un dé.', 'pavé': '6 faces rectangulaires, comme une boîte à chaussures.',
        boule: 'Elle est toute ronde et roule dans tous les sens.', cylindre: 'Deux disques reliés par une surface qui roule, comme une boîte de conserve.',
        'cône': 'Un disque et une pointe, comme un cornet de glace.', pyramide: 'Des faces triangulaires qui se rejoignent en pointe.',
      };
      return {
        prompt: 'Comment s\'appelle ce solide ?', visual: V.solid(n), type: 'choice',
        choices: shuffle([n, ...sample(names.filter((x) => x !== n), 3)]), answer: n,
        hint: hints[n], explain: `C'est un${['boule'].includes(n) ? 'e' : ''} <b>${n}</b> : ${hints[n].toLowerCase()}`,
      };
    },
  },
  {
    id: 'g_grid', label: 'Se déplacer sur un quadrillage', minLevel: 2,
    gen(L) {
      const size = 5, DIRS = { '→': [1, 0], '←': [-1, 0], '↑': [0, -1], '↓': [0, 1] };
      const nMoves = L >= 4 ? rand(4, 5) : rand(2, 3);
      let pos, moves, guard = 0;
      do {
        pos = [rand(0, size - 1), rand(0, size - 1)]; moves = [];
        let p = pos.slice(), ok = true;
        for (let i = 0; i < nMoves; i++) {
          const d = pick(Object.keys(DIRS)); p = [p[0] + DIRS[d][0], p[1] + DIRS[d][1]]; moves.push(d);
          if (p[0] < 0 || p[1] < 0 || p[0] >= size || p[1] >= size) { ok = false; break; }
        }
        if (ok && (p[0] !== pos[0] || p[1] !== pos[1])) { moves.end = p; break; }
      } while (guard++ < 200);
      const end = moves.end, key = (c) => c.join(',');
      // Distracteurs : erreurs fréquentes (gauche/droite inversées, un pas de trop), puis cases au hasard.
      const mirror = [pos[0] - (end[0] - pos[0]), end[1]], cells = [end];
      for (const c of [mirror, [end[0] + 1, end[1]], [end[0], end[1] - 1]]) {
        if (cells.length < 4 && c[0] >= 0 && c[1] >= 0 && c[0] < size && c[1] < size && !cells.some((x) => key(x) === key(c)) && key(c) !== key(pos)) cells.push(c);
      }
      while (cells.length < 4) {
        const c = [rand(0, size - 1), rand(0, size - 1)];
        if (!cells.some((x) => key(x) === key(c)) && key(c) !== key(pos)) cells.push(c);
      }
      const letters = ['A', 'B', 'C', 'D'], order = shuffle(cells), marks = {};
      order.forEach((c, i) => { marks[letters[i]] = c; });
      const ans = letters[order.findIndex((c) => key(c) === key(end))];
      return {
        prompt: `La fusée suit ce chemin : <span class="arrows">${moves.join(' ')}</span><br>Sur quelle case arrive-t-elle ?`,
        say: 'La fusée suit le chemin des flèches. Sur quelle case arrive-t-elle ?',
        visual: V.grid(size, pos, marks), type: 'choice', choices: letters, answer: ans,
        hint: 'Mets ton doigt sur la fusée et avance d\'une case pour chaque flèche.',
        explain: `En suivant ${moves.join(' ')}, la fusée arrive sur la case <b>${ans}</b>.`,
      };
    },
  },
  {
    id: 'g_angle', label: 'Reconnaître un angle droit', minLevel: 3,
    gen() {
      const letters = ['A', 'B', 'C'], right = rand(0, 2);
      const others = shuffle([pick([45, 60, 70]), pick([110, 120, 135])]);
      const list = letters.map((l, i) => [l, i === right ? 90 : others.pop(), rand(-20, 40)]);
      return {
        prompt: 'Quel angle est un <b>angle droit</b> ?', visual: V.angles(list), type: 'choice', choices: letters, answer: letters[right],
        hint: 'Un angle droit, c\'est comme le coin d\'une feuille ou de l\'équerre. Les autres sont plus ouverts ou plus fermés.',
        explain: `L'angle <b>${letters[right]}</b> est droit : il a la forme exacte du coin de l'équerre.`,
      };
    },
  },
];

// ---------------------------------------------------------------- Temps (Chronos)
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const temps = [
  {
    id: 't_clock', label: 'Lire l\'heure', minLevel: 1,
    gen(L) {
      const mins = L === 1 ? [0] : L === 2 ? [0, 30] : L <= 4 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const h = rand(1, 12), m = pick(mins);
      const opts = new Set([fmtTime(h, m)]);
      // Pièges classiques : aiguilles inversées, heure voisine.
      const swapH = m === 0 ? (h % 12) + 1 : Math.round(m / 5) || 12;
      opts.add(fmtTime(h % 12 + 1, m));
      if (m === 0) opts.add(fmtTime(h, 30)); else opts.add(fmtTime(swapH, (h * 5) % 60));
      while (opts.size < 4) opts.add(fmtTime(rand(1, 12), pick(mins)));
      return {
        prompt: 'Quelle heure indique l\'horloge ?', visual: V.clock(h, m), type: 'choice', choices: shuffle([...opts]), answer: fmtTime(h, m),
        hint: 'La petite aiguille indique les heures. La grande aiguille indique les minutes (sur le 6 : 30 minutes).',
        explain: `Petite aiguille ${m ? 'après le ' : 'sur le '}${h}, grande aiguille ${m ? 'sur le ' + m / 5 : 'sur le 12'} : <b>${fmtTime(h, m)}</b>`,
      };
    },
  },
  {
    id: 't_clock_pick', label: 'Trouver l\'horloge qui indique une heure', minLevel: 1,
    gen(L) {
      const mins = L === 1 ? [0] : L === 2 ? [0, 30] : [0, 15, 30, 45];
      const h = rand(1, 12), m = pick(mins);
      // Pièges : aiguilles inversées, heure voisine.
      const swapped = m === 0 ? [h % 12 + 1, 0] : [Math.round(m / 5) || 12, (h * 5) % 60];
      const cands = [[h, m], [h % 12 + 1, m], swapped, [h, m === 0 ? 30 : 0]];
      const uniq = [...new Map(cands.map((c) => [c.join(':'), c])).values()].slice(0, 3);
      while (uniq.length < 3) { const c = [rand(1, 12), pick(mins)]; if (!uniq.some((u) => u.join(':') === c.join(':'))) uniq.push(c); }
      const order = shuffle(uniq), letters = ['A', 'B', 'C'];
      const ans = letters[order.findIndex((c) => c[0] === h && c[1] === m)];
      return {
        prompt: `Quelle horloge indique <b>${fmtTime(h, m)}</b> ?`, visual: `<div class="clocks">${order.map((c, i) => `<div><span>${letters[i]}</span>${V.clock(...c)}</div>`).join('')}</div>`,
        type: 'choice', choices: letters, answer: ans,
        hint: 'La petite aiguille montre l\'heure, la grande aiguille montre les minutes.',
        explain: `L'horloge <b>${ans}</b> : petite aiguille ${m ? 'après le' : 'sur le'} ${h}, grande aiguille sur le ${m ? m / 5 : 12}.`,
      };
    },
  },
  {
    id: 't_compare', label: 'Estimer des durées', minLevel: 1,
    gen() {
      // [activité, durée en minutes, durée lisible]
      const acts = [['se brosser les dents', 2, '2 minutes'], ['une récréation', 15, '15 minutes'], ['un repas', 40, '40 minutes'],
        ['un film au cinéma', 120, '2 heures'], ['une nuit de sommeil', 600, '10 heures'], ['les grandes vacances', 86400, '2 mois'],
        ['une année scolaire', 432000, '10 mois'], ['enfiler ses chaussures', 1, '1 minute'], ['une journée d\'école', 360, '6 heures']];
      const chosen = sample(acts, 3), longest = chance(0.5);
      const best = chosen.reduce((x, y) => ((longest ? y[1] > x[1] : y[1] < x[1]) ? y : x));
      return {
        prompt: `Qu'est-ce qui dure <b>le ${longest ? 'plus' : 'moins'} longtemps</b> ?`, type: 'choice', choices: chosen.map((x) => x[0]), answer: best[0],
        hint: 'Imagine chaque activité : dure-t-elle quelques minutes, quelques heures, des jours, des mois ?',
        explain: `${chosen.map((x) => `${x[0]} : ${x[2]}`).join(' · ')}<br>Réponse : <b>${best[0]}</b>`,
      };
    },
  },
  {
    id: 't_calendar', label: 'Jours et mois', minLevel: 1,
    gen(L) {
      const kind = pick(L >= 3 ? ['dayAfter', 'dayBefore', 'month', 'inDays'] : ['dayAfter', 'dayBefore', 'month']);
      const list = kind === 'month' ? MONTHS : DAYS;
      const i = rand(0, list.length - 1);
      let q, ans, hint;
      if (kind === 'dayAfter') { q = `Quel jour vient juste <b>après</b> ${list[i]} ?`; ans = list[(i + 1) % 7]; hint = 'Récite les jours : lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.'; }
      else if (kind === 'dayBefore') { q = `Quel jour vient juste <b>avant</b> ${list[i]} ?`; ans = list[(i + 6) % 7]; hint = 'Récite les jours dans l\'ordre et regarde celui qui est juste avant.'; }
      else if (kind === 'month') { q = `Quel mois vient juste <b>après</b> ${list[i]} ?`; ans = list[(i + 1) % 12]; hint = 'Janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre.'; }
      else { const k = rand(2, 5); q = `Aujourd'hui, c'est ${list[i]}. Quel jour serons-nous dans <b>${k} jours</b> ?`; ans = list[(i + k) % 7]; hint = `Avance de ${k} jours dans la semaine, un jour à la fois.`; }
      const opts = new Set([ans]);
      while (opts.size < 4) opts.add(pick(list));
      return { prompt: q, type: 'choice', choices: shuffle([...opts]), answer: ans, hint, explain: `C'est <b>${ans}</b>.` };
    },
  },
  {
    id: 't_units', label: 'Heures, minutes, jours, mois…', minLevel: 2,
    gen(L) {
      const list = [['1 heure', 'minutes', 60], ['1 jour', 'heures', 24], ['1 semaine', 'jours', 7], ['une demi-heure', 'minutes', 30], ['1 an', 'mois', 12]];
      if (L >= 3) list.push(['un quart d\'heure', 'minutes', 15], ['1 minute', 'secondes', 60]);
      if (L >= 4) list.push(['2 heures', 'minutes', 120], ['2 semaines', 'jours', 14], ['2 jours', 'heures', 48]);
      const [a, unit, ans] = pick(list);
      return {
        prompt: `${a}, c'est combien de ${unit} ?`, type: 'numpad', answer: ans, suffix: unit === 'minutes' ? 'min' : unit === 'heures' ? 'h' : unit,
        hint: 'À connaître par cœur : 1 h = 60 min, 1 jour = 24 h, 1 semaine = 7 jours, 1 an = 12 mois. Une demi-heure, c\'est la moitié d\'une heure.',
        explain: `${a} = <b>${ans} ${unit}</b>`,
      };
    },
  },
  {
    id: 't_duration', label: 'Calculer une durée', minLevel: 2,
    gen(L) {
      if (L >= 4 && chance(0.5)) {
        const h = rand(8, 17), m1 = pick([0, 15]), d = pick([15, 30, 45].filter((x) => m1 + x < 60));
        return {
          prompt: `La séance de sport commence à ${fmtTime(h, m1)} et finit à ${fmtTime(h, m1 + d)}. Combien de minutes dure-t-elle ?`,
          type: 'numpad', answer: d, suffix: 'min',
          hint: 'Compte de 15 minutes en 15 minutes depuis le début.', explain: `De ${fmtTime(h, m1)} à ${fmtTime(h, m1 + d)} : <b>${d} minutes</b>`,
        };
      }
      const h1 = rand(8, 18), d = rand(1, 4);
      return {
        prompt: `Le film commence à ${h1} h et finit à ${h1 + d} h. Combien d'heures dure-t-il ?`, type: 'numpad', answer: d, suffix: 'h',
        hint: `Compte les heures : ${h1} h, ${h1 + 1} h…`, explain: `${h1 + d} − ${h1} = <b>${d} h</b>`,
      };
    },
  },
  {
    id: 't_month', label: 'Lire un calendrier', minLevel: 3,
    gen(L) {
      const mi = rand(0, 11), nDays = MONTH_DAYS[mi], start = rand(0, 6);
      const weekday = (day) => DAYS[(start + day - 1) % 7];
      if (L >= 4 && chance(0.4)) {
        const wd = rand(0, 6), count = Array.from({ length: nDays }, (_, i) => i + 1).filter((d) => (start + d - 1) % 7 === wd).length;
        return {
          prompt: `Combien y a-t-il de <b>${DAYS[wd]}s</b> en ${MONTHS[mi]} ?`, visual: V.month(MONTHS[mi], start, nDays), type: 'numpad', answer: count,
          hint: `Regarde la colonne des ${DAYS[wd]}s et compte les dates.`, explain: `Il y a <b>${count} ${DAYS[wd]}s</b> en ${MONTHS[mi]}.`,
        };
      }
      const d = rand(1, nDays);
      return {
        prompt: `Quel jour de la semaine est le <b>${d} ${MONTHS[mi]}</b> ?`, visual: V.month(MONTHS[mi], start, nDays, d), type: 'choice',
        choices: shuffle([weekday(d), ...sample(DAYS.filter((x) => x !== weekday(d)), 3)]), answer: weekday(d),
        hint: `Trouve la case du ${d}, puis remonte en haut de sa colonne.`,
        explain: `Le ${d} ${MONTHS[mi]} est un <b>${weekday(d)}</b>.`,
      };
    },
  },
];

const byPlanet = { nombres, calcul, problemes, grandeurs, temps };
for (const [planet, list] of Object.entries(byPlanet)) for (const s of list) s.planet = planet;

export const SKILLS = [...nombres, ...calcul, ...problemes, ...grandeurs, ...temps];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const skillsFor = (planetId, level) => byPlanet[planetId].filter((s) => s.minLevel <= level);

// Compose une mission de `count` questions.
// Priorité aux notions à revoir, puis aux notions récentes du niveau.
export function buildMission(planetLevels, count, review = [], planetId = null, opts = {}) {
  const pool = [];
  for (const p of PLANETS) {
    if (planetId && p.id !== planetId) continue;
    const L = planetLevels[p.id];
    for (const s of skillsFor(p.id, L)) {
      const weight = s.minLevel === L ? 3 : 2;
      for (let i = 0; i < weight; i++) pool.push([s, L]);
    }
  }
  const chosen = [];
  const reviewable = pool.filter(([s]) => review.includes(s.id));
  const uniqReview = [...new Map(reviewable.map((x) => [x[0].id, x])).values()];
  chosen.push(...shuffle(uniqReview).slice(0, Math.min(2, count)));
  // Évite trop de répétitions d'une même notion dans une mission.
  const maxRepeat = Math.max(2, Math.ceil(count / new Set(pool.map(([s]) => s.id)).size));
  let guard = 0;
  while (chosen.length < count && guard++ < 200) {
    const cand = pick(pool);
    if (chosen.filter(([s]) => s.id === cand[0].id).length >= maxRepeat) continue;
    chosen.push(cand);
  }
  return shuffle(chosen).map(([s, L]) => ({ skill: s.id, level: L, ...s.gen(L, opts) }));
}

// Défi éclair (boss de Calculo) : calculs rapides, comme la fluence attendue
// en fin de CE1 (12 résultats en 3 minutes).
const FLASH_SKILLS = ['c_add', 'c_sub', 'c_complement', 'c_tens', 'c_add9', 'c_mult', 'c_mult10'];
export function buildFlash(level, count, opts = {}) {
  const ids = FLASH_SKILLS.filter((id) => SKILL_BY_ID[id].minLevel <= level);
  return Array.from({ length: count }, () => { const s = SKILL_BY_ID[pick(ids)]; return { skill: s.id, level, ...s.gen(level, opts) }; });
}

export { toWords };

// Défi tables (8 résultats en 1 minute en fin de CE1), avec récupération espacée :
// chaque fait a une « boîte » de 0 à 4 ; les faits des petites boîtes reviennent plus souvent.
export const factKey = (a, b) => `${Math.min(a, b)}x${Math.max(a, b)}`;

export function tablesQuestion(level, opts = {}, facts = {}, avoid = null) {
  const tables = tablesFor(level, opts).filter((t) => t > 0);
  const pool = [];
  for (const t of tables) {
    for (let k = 1; k <= 10; k++) {
      const key = factKey(t, k);
      if (key === avoid) continue;
      const box = facts[key] ? facts[key].box : 0;
      for (let w = 0; w < 5 - box; w++) pool.push([t, k]);
    }
  }
  const [t, k] = pick(pool), c = t * k;
  const form = pick(['ab', 'ab', 'ba', 'missing']);
  if (form === 'missing') return {
    skill: 'c_mult_inv', level, prompt: `? × ${t} = ${c}`, say: `Combien de fois ${t} égale ${c} ?`, type: 'numpad', answer: k, fact: [k, t],
    hint: multHint(k, t), explain: `${k} fois ${t}, <b>${c}</b>`,
  };
  const [a, b] = form === 'ab' ? [t, k] : [k, t];
  return {
    skill: 'c_mult', level, prompt: `${a} × ${b} = ?`, type: 'numpad', answer: c, fact: [a, b],
    hint: multHint(a, b), explain: `${a} fois ${b}, <b>${c}</b>`,
  };
}
