// Illustrations SVG des exercices (blocs de base dix, horloge, monnaie, formes…).
import { fmt } from './util.js';

// Matériel de numération : plaques de 100, barres de 10, cubes unités.
export function blocks(n) {
  const c = Math.floor(n / 100), d = Math.floor((n % 100) / 10), u = n % 10;
  const s = 7, gap = 6, parts = [];
  let x = 0;
  for (let i = 0; i < c; i++) {
    let grid = '';
    for (let k = 1; k < 10; k++) {
      grid += `<line x1="${x + k * s}" y1="0" x2="${x + k * s}" y2="${10 * s}"/><line x1="${x}" y1="${k * s}" x2="${x + 10 * s}" y2="${k * s}"/>`;
    }
    parts.push(`<rect class="b-plate" x="${x}" y="0" width="${10 * s}" height="${10 * s}" rx="2"/><g class="b-grid">${grid}</g>`);
    x += 10 * s + gap;
  }
  if (c) x += gap;
  for (let i = 0; i < d; i++) {
    let grid = '';
    for (let k = 1; k < 10; k++) grid += `<line x1="${x}" y1="${k * s}" x2="${x + s}" y2="${k * s}"/>`;
    parts.push(`<rect class="b-bar" x="${x}" y="0" width="${s}" height="${10 * s}" rx="1"/><g class="b-grid">${grid}</g>`);
    x += s + 4;
  }
  if (d) x += gap;
  for (let i = 0; i < u; i++) {
    const col = Math.floor(i / 5), row = i % 5;
    parts.push(`<rect class="b-unit" x="${x + col * (s + 4)}" y="${10 * s - (row + 1) * (s + 3) + 3}" width="${s}" height="${s}" rx="1"/>`);
  }
  if (u) x += Math.ceil(u / 5) * (s + 4);
  const w = Math.max(x, 10);
  return `<svg class="vis blocks" viewBox="-2 -2 ${w + 4} ${10 * s + 4}" style="max-width:${Math.min(w * 2.4, 560)}px" role="img" aria-label="matériel de numération">${parts.join('')}</svg>`;
}

export function clock(h, m) {
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180, big = i % 5 === 0;
    const r1 = big ? 78 : 84, r2 = 90;
    ticks.push(`<line class="${big ? 'tick-big' : 'tick'}" x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}"/>`);
  }
  const nums = [];
  for (let i = 1; i <= 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    nums.push(`<text x="${100 + 64 * Math.sin(a)}" y="${100 - 64 * Math.cos(a) + 6}">${i}</text>`);
  }
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  return `<svg class="vis clock" viewBox="0 0 200 200" role="img" aria-label="horloge">
    <circle class="clock-face" cx="100" cy="100" r="94"/>${ticks.join('')}<g class="clock-num">${nums.join('')}</g>
    <line class="hand-h" x1="100" y1="100" x2="100" y2="52" transform="rotate(${ha} 100 100)"/>
    <line class="hand-m" x1="100" y1="100" x2="100" y2="24" transform="rotate(${ma} 100 100)"/>
    <circle cx="100" cy="100" r="6" class="clock-pin"/></svg>`;
}

const BILL_COLORS = { 5: '#9aa9b8', 10: '#e08a7a', 20: '#7aa3e0', 50: '#e8b25c' };
export function money(values) {
  const items = values.map((v) => {
    if (v <= 2) {
      return `<svg class="coin" viewBox="0 0 60 60" role="img" aria-label="pièce de ${v} euros">
        <circle cx="30" cy="30" r="27" class="${v === 2 ? 'coin2-out' : 'coin1-out'}"/>
        <circle cx="30" cy="30" r="17" class="${v === 2 ? 'coin2-in' : 'coin1-in'}"/>
        <text x="30" y="37">${v}€</text></svg>`;
    }
    return `<svg class="bill" viewBox="0 0 110 60" role="img" aria-label="billet de ${v} euros">
      <rect x="2" y="2" width="106" height="56" rx="6" fill="${BILL_COLORS[v]}" stroke="#0003" stroke-width="2"/>
      <circle cx="80" cy="30" r="16" fill="#fff5"/>
      <text x="32" y="40">${v}€</text></svg>`;
  });
  return `<div class="vis money">${items.join('')}</div>`;
}

export function shape(name, color = '#ff8a3d') {
  const st = `fill="${color}" stroke="#0005" stroke-width="3"`;
  const svg = {
    'carré': `<rect x="40" y="20" width="120" height="120" ${st}/>`,
    'rectangle': `<rect x="15" y="40" width="170" height="85" ${st}/>`,
    'triangle': `<polygon points="100,15 180,140 25,140" ${st}/>`,
    'triangle rectangle': `<polygon points="35,15 35,140 175,140" ${st}/><polyline points="35,120 55,120 55,140" fill="none" stroke="#0008" stroke-width="3"/>`,
    'cercle': `<circle cx="100" cy="80" r="65" ${st}/>`,
    'losange': `<polygon points="100,10 165,80 100,150 35,80" ${st}/>`,
  }[name];
  return `<svg class="vis shape" viewBox="0 0 200 160" role="img" aria-label="figure">${svg}</svg>`;
}

// Figure partagée en `parts` parts (égales sauf si `unequal`), dont `colored` sont coloriées.
// kind : 'rect' (bande), 'disc', 'square' (carré quadrillé), 'hex' (hexagone), 'fan' (éventail).
export function fraction(parts, kind = 'rect', colored = 1, unequal = false) {
  const cls = (i) => (i < colored ? 'frac-on' : 'frac-off');
  let s = '', vb = '-3 -3 246 96';
  if (kind === 'disc' || kind === 'fan') {
    const fan = kind === 'fan', cx = 80, cy = fan ? 90 : 80, r = 70;
    const span = fan ? Math.PI : 2 * Math.PI, start = fan ? Math.PI : -Math.PI / 2;
    const cuts = unequalCuts(parts, unequal);
    for (let i = 0; i < parts; i++) {
      const a1 = start + cuts[i] * span, a2 = start + cuts[i + 1] * span;
      const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
      const large = a2 - a1 > Math.PI ? 1 : 0;
      s += parts === 1 && !fan ? `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls(i)}"/>`
        : `<path d="M${cx},${cy} L${p1} A${r},${r} 0 ${large} 1 ${p2} Z" class="${cls(i)}"/>`;
    }
    vb = fan ? '0 10 160 90' : '0 0 160 160';
    return `<svg class="vis frac" viewBox="${vb}" role="img" aria-label="figure partagée">${s}</svg>`;
  }
  if (kind === 'hex' && (parts === 6 || parts === 3)) {
    const pt = (k) => [80 + 70 * Math.cos((Math.PI / 3) * k), 75 + 70 * Math.sin((Math.PI / 3) * k)];
    const step = 6 / parts;
    for (let i = 0; i < parts; i++) {
      const pts = [[80, 75]];
      for (let k = i * step; k <= (i + 1) * step; k++) pts.push(pt(k));
      s += `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" class="${cls(i)}"/>`;
    }
    return `<svg class="vis frac" viewBox="5 0 150 150" role="img" aria-label="hexagone partagé">${s}</svg>`;
  }
  if (kind === 'square' && [2, 4, 8].includes(parts) && !unequal) {
    const cols = parts === 8 ? 4 : 2, rows = parts === 2 ? 1 : 2, w = 140 / cols, h = 140 / rows;
    for (let i = 0; i < parts; i++) s += `<rect x="${(i % cols) * w}" y="${Math.floor(i / cols) * h}" width="${w}" height="${h}" class="${cls(i)}"/>`;
    return `<svg class="vis frac" viewBox="-3 -3 146 146" role="img" aria-label="carré partagé">${s}</svg>`;
  }
  const cuts = unequalCuts(parts, unequal);
  for (let i = 0; i < parts; i++) s += `<rect x="${cuts[i] * 240}" y="0" width="${(cuts[i + 1] - cuts[i]) * 240}" height="90" class="${cls(i)}"/>`;
  return `<svg class="vis frac" viewBox="${vb}" role="img" aria-label="bande partagée">${s}</svg>`;
}

// Positions des coupes (de 0 à 1) : régulières, ou volontairement inégales pour les pièges.
function unequalCuts(parts, unequal) {
  const cuts = Array.from({ length: parts + 1 }, (_, i) => i / parts);
  if (unequal && parts >= 2) {
    // Une part nettement plus grande que les autres.
    const big = 0.5 + 0.1 * (parts === 2 ? 1 : 0);
    for (let i = 1; i < parts; i++) cuts[i] = big + ((1 - big) * (i - 1)) / (parts - 1);
  }
  return cuts;
}

// Collections d'objets regroupés (pour les multiplications / partages).
export function groups(nGroups, perGroup, emoji) {
  const g = [];
  for (let i = 0; i < nGroups; i++) g.push(`<div class="grp">${emoji.repeat(perGroup)}</div>`);
  return `<div class="vis groups">${g.join('')}</div>`;
}

export function ruler(start, length) {
  const cm = 34, max = 12;
  let t = '';
  for (let i = 0; i <= max * 2; i++) {
    const x = 10 + (i * cm) / 2, big = i % 2 === 0;
    t += `<line x1="${x}" y1="50" x2="${x}" y2="${big ? 70 : 62}" class="tick"/>`;
    if (big) t += `<text x="${x}" y="88">${i / 2}</text>`;
  }
  const x1 = 10 + start * cm, x2 = 10 + (start + length) * cm;
  return `<svg class="vis ruler" viewBox="0 0 ${20 + max * cm} 96" role="img" aria-label="règle graduée">
    <rect x="0" y="48" width="${20 + max * cm}" height="46" rx="4" class="ruler-body"/>${t}
    <line x1="${x1}" y1="30" x2="${x2}" y2="30" class="seg"/>
    <line x1="${x1}" y1="20" x2="${x1}" y2="40" class="seg-end"/><line x1="${x2}" y1="20" x2="${x2}" y2="40" class="seg-end"/>
    <line x1="${x1}" y1="40" x2="${x1}" y2="50" class="seg-guide"/><line x1="${x2}" y1="40" x2="${x2}" y2="50" class="seg-guide"/></svg>`;
}

// Droite graduée interactive : chaque graduation est une zone cliquable.
export function numberLine(start, step, count, labels) {
  const gapX = 30, w = count * gapX + 40;
  let s = `<line x1="10" y1="40" x2="${w - 10}" y2="40" class="nl-axis"/>`;
  for (let i = 0; i <= count; i++) {
    const x = 20 + i * gapX, big = labels.includes(i);
    s += `<line x1="${x}" y1="${big ? 26 : 30}" x2="${x}" y2="${big ? 54 : 50}" class="nl-tick"/>`;
    if (big) s += `<text x="${x}" y="78">${fmt(start + i * step)}</text>`;
    s += `<g class="nl-hit" data-idx="${i}"><rect x="${x - gapX / 2}" y="0" width="${gapX}" height="90" fill="transparent"/><circle cx="${x}" cy="40" r="11" class="nl-dot"/></g>`;
  }
  return `<svg class="vis nl" viewBox="0 0 ${w} 90" role="img" aria-label="droite graduée">${s}</svg>`;
}

// Opération posée en colonnes.
export function column(nums, op) {
  const width = Math.max(...nums.map((n) => String(n).length)) + 1;
  const rows = nums.map((n, i) => {
    const digits = String(n).padStart(width, ' ').split('');
    if (i > 0) digits[0] = op;
    return `<tr>${digits.map((d) => `<td>${d === ' ' ? '' : d}</td>`).join('')}</tr>`;
  });
  rows.push(`<tr class="col-res"><td></td>${'<td>?</td>'.repeat(width - 1)}</tr>`);
  return `<table class="vis column">${rows.join('')}</table>`;
}

export function rocket(color = '#ff4d4d', size = 64) {
  const fill = color === 'arc' ? 'url(#rainbow)' : color;
  return `<svg class="rocket" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="rainbow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4d4d"/><stop offset=".33" stop-color="#ffd23f"/><stop offset=".66" stop-color="#3ddc84"/><stop offset="1" stop-color="#4d8dff"/></linearGradient></defs>
    <path d="M32 4c10 8 14 20 12 34H20C18 24 22 12 32 4z" fill="${fill}" stroke="#0004" stroke-width="2"/>
    <circle cx="32" cy="24" r="6" fill="#bfe8ff" stroke="#fff" stroke-width="2"/>
    <path d="M20 30l-8 12 9-2zM44 30l8 12-9-2z" fill="${fill}" stroke="#0004" stroke-width="2"/>
    <path class="flame" d="M24 40h16l-4 10-4 8-4-8z" fill="#ffb627"/></svg>`;
}

export function planet(color1, color2, ring = false) {
  const id = 'g' + color1.slice(1) + color2.slice(1);
  return `<svg class="planet" viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id="${id}" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="${color1}"/><stop offset="1" stop-color="${color2}"/></radialGradient></defs>
    <circle cx="50" cy="50" r="34" fill="url(#${id})"/>
    <circle cx="38" cy="40" r="5" fill="#fff2"/><circle cx="60" cy="62" r="7" fill="#0001"/>
    ${ring ? '<ellipse cx="50" cy="52" rx="48" ry="11" fill="none" stroke="#fff8" stroke-width="4"/>' : ''}</svg>`;
}

// Schéma en barres « parties / tout » (modélisation des problèmes).
export function barParts(a, b, unknown) {
  const W = 300, wa = Math.max(70, Math.min(230, (a / (a + b)) * W));
  const lab = (v, key) => (unknown === key ? '?' : fmt(v));
  return `<svg class="vis bars" viewBox="-2 -2 ${W + 4} 92" role="img" aria-label="schéma en barres">
    <path d="M0 22 V12 H${W} V22" class="bar-brace"/><text x="${W / 2}" y="9" class="${unknown === 'total' ? 'bar-q' : ''}">${lab(a + b, 'total')}</text>
    <rect x="0" y="30" width="${wa}" height="40" class="bar-a"/><rect x="${wa}" y="30" width="${W - wa}" height="40" class="bar-b"/>
    <text x="${wa / 2}" y="57" class="${unknown === 'a' ? 'bar-q' : ''}">${lab(a, 'a')}</text><text x="${wa + (W - wa) / 2}" y="57" class="${unknown === 'b' ? 'bar-q' : ''}">${lab(b, 'b')}</text></svg>`;
}

// Schéma de comparaison : deux barres et leur écart.
export function barCompare(big, small, names, unknown) {
  const W = 300, ws = Math.max(80, Math.min(220, (small / big) * W));
  const lab = (v, key) => (unknown === key ? '?' : fmt(v));
  return `<svg class="vis bars" viewBox="-2 -2 ${W + 4} 110" role="img" aria-label="schéma de comparaison">
    <text x="0" y="12" class="bar-name">${names[0]}</text>
    <rect x="0" y="18" width="${W}" height="30" class="bar-a"/><text x="${W / 2}" y="39" class="${unknown === 'big' ? 'bar-q' : ''}">${lab(big, 'big')}</text>
    <text x="0" y="66" class="bar-name">${names[1]}</text>
    <rect x="0" y="72" width="${ws}" height="30" class="bar-b"/><text x="${ws / 2}" y="93" class="${unknown === 'small' ? 'bar-q' : ''}">${lab(small, 'small')}</text>
    <rect x="${ws}" y="72" width="${W - ws}" height="30" class="bar-diff"/><text x="${ws + (W - ws) / 2}" y="93" class="${unknown === 'diff' ? 'bar-q' : ''}">${lab(big - small, 'diff')}</text></svg>`;
}

export function solid(name) {
  const st = 'class="sol"', st2 = 'class="sol2"', st3 = 'class="sol3"', hid = 'class="sol-hidden"';
  const svg = {
    cube: `<polygon points="40,60 120,60 120,140 40,140" ${st}/><polygon points="40,60 80,30 160,30 120,60" ${st2}/><polygon points="120,60 160,30 160,110 120,140" ${st3}/>`,
    'pavé': `<polygon points="20,80 140,80 140,140 20,140" ${st}/><polygon points="20,80 60,50 180,50 140,80" ${st2}/><polygon points="140,80 180,50 180,110 140,140" ${st3}/>`,
    boule: `<circle cx="100" cy="85" r="60" ${st}/><ellipse cx="100" cy="85" rx="60" ry="16" ${hid}/><circle cx="78" cy="62" r="12" fill="#fff6"/>`,
    cylindre: `<path d="M50 40 V130 A50 14 0 0 0 150 130 V40" ${st}/><ellipse cx="100" cy="40" rx="50" ry="14" ${st2}/><path d="M50 130 A50 14 0 0 1 150 130" ${hid}/>`,
    'cône': `<path d="M100 20 L45 130 A55 15 0 0 0 155 130 Z" ${st}/><path d="M45 130 A55 15 0 0 1 155 130" ${hid}/>`,
    pyramide: `<polygon points="100,20 40,130 120,145" ${st}/><polygon points="100,20 120,145 165,115" ${st3}/><polyline points="40,130 85,105 165,115" ${hid}/><line x1="100" y1="20" x2="85" y2="105" ${hid}/>`,
  }[name];
  return `<svg class="vis shape" viewBox="0 0 200 160" role="img" aria-label="solide">${svg}</svg>`;
}

// Quadrillage avec un point de départ et des cases repérées par des lettres.
export function grid(size, start, marks) {
  const c = 44;
  let s = '';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) s += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}" class="grid-cell"/>`;
  s += `<text x="${start[0] * c + c / 2}" y="${start[1] * c + c / 2 + 10}" class="grid-start">🚀</text>`;
  for (const [letter, [x, y]] of Object.entries(marks)) s += `<text x="${x * c + c / 2}" y="${y * c + c / 2 + 9}" class="grid-mark">${letter}</text>`;
  return `<svg class="vis grid" viewBox="-2 -2 ${size * c + 4} ${size * c + 4}" role="img" aria-label="quadrillage">${s}</svg>`;
}

// Trois angles A, B, C à comparer avec l'équerre.
export function angles(list) {
  return `<div class="vis angles">${list.map(([letter, deg, rot]) => {
    const r = (Math.PI / 180), L = 70;
    const p1 = [60 + L * Math.cos(rot * r), 80 - L * Math.sin(rot * r)];
    const p2 = [60 + L * Math.cos((rot + deg) * r), 80 - L * Math.sin((rot + deg) * r)];
    return `<svg viewBox="-20 -10 160 120" role="img" aria-label="angle ${letter}"><polyline points="${p1} 60,80 ${p2}" class="ang"/>
      <circle cx="60" cy="80" r="4" class="ang-pt"/><text x="60" y="108" class="ang-l">${letter}</text></svg>`;
  }).join('')}</div>`;
}

// Petit alien adversaire (dessiné en SVG, varie selon la planète et le niveau).
export function alien(color, level = 1, boss = false, size = 90) {
  const eyes = level % 3 === 0 ? [[50, 48]] : level % 3 === 1 ? [[40, 48], [60, 48]] : [[34, 50], [50, 44], [66, 50]];
  const ant = level >= 2 ? `<line x1="38" y1="22" x2="30" y2="6" class="al-line"/><circle cx="30" cy="6" r="5" fill="${color}"/>
    <line x1="62" y1="22" x2="70" y2="6" class="al-line"/><circle cx="70" cy="6" r="5" fill="${color}"/>` : '';
  const horns = level >= 4 ? `<path d="M22 40 L10 22 L30 32Z M78 40 L90 22 L70 32Z" fill="#fff8"/>` : '';
  const crown = boss ? `<path d="M30 20 L36 2 L45 14 L50 0 L55 14 L64 2 L70 20 Z" fill="#ffd23f" stroke="#b88a00" stroke-width="2"/>` : '';
  return `<svg class="alien${boss ? ' boss' : ''}" width="${size}" height="${size}" viewBox="0 -4 100 104" aria-hidden="true">
    ${ant}${horns}
    <path d="M14 88 C4 60 16 22 50 20 C84 22 96 60 86 88 C78 96 70 86 64 94 C58 100 42 100 36 94 C30 86 22 96 14 88Z" fill="${color}" stroke="#0004" stroke-width="3"/>
    <ellipse cx="34" cy="34" rx="8" ry="5" fill="#fff5"/>
    ${eyes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff"/><circle class="al-pupil" cx="${x + 2}" cy="${y + 2}" r="4.5" fill="#23204a"/>`).join('')}
    <path d="M38 70 Q50 80 62 70" fill="none" stroke="#23204a" stroke-width="4" stroke-linecap="round"/>${crown}</svg>`;
}

// Calendrier d'un mois (semaine commençant le lundi). `start` : 0 = lundi.
export function month(name, start, nDays, highlight = null) {
  const head = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<th>${d}</th>`).join('');
  const cells = Array(start).fill('<td></td>');
  for (let d = 1; d <= nDays; d++) cells.push(`<td class="${d === highlight ? 'hl' : ''}">${d}</td>`);
  while (cells.length % 7) cells.push('<td></td>');
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
  return `<table class="vis month"><caption>${name}</caption><thead><tr>${head}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

// Héros astronaute avec son blaster (la couleur de la combinaison suit la fusée choisie).
export function hero(color = '#ff4d4d', size = 120) {
  const suit = color === 'arc' ? '#ff8a3d' : color;
  return `<svg class="hero-svg" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="55" cy="114" rx="30" ry="5" fill="#0002"/>
    <rect x="18" y="52" width="16" height="34" rx="6" fill="#d9dde8" stroke="#23204a" stroke-width="3"/>
    <rect x="34" y="88" width="13" height="22" rx="5" fill="${suit}" stroke="#23204a" stroke-width="3"/>
    <rect x="55" y="88" width="13" height="22" rx="5" fill="${suit}" stroke="#23204a" stroke-width="3"/>
    <rect x="31" y="105" width="19" height="9" rx="4" fill="#5b5f73" stroke="#23204a" stroke-width="3"/>
    <rect x="52" y="105" width="19" height="9" rx="4" fill="#5b5f73" stroke="#23204a" stroke-width="3"/>
    <rect x="28" y="56" width="46" height="40" rx="14" fill="${suit}" stroke="#23204a" stroke-width="3"/>
    <rect x="42" y="66" width="18" height="12" rx="3" fill="#fff8" stroke="#23204a" stroke-width="2"/>
    <circle cx="47" cy="72" r="2.5" fill="#3ddc84"/><circle cx="55" cy="72" r="2.5" fill="#ffd23f"/>
    <circle cx="51" cy="36" r="27" fill="#f1f3fa" stroke="#23204a" stroke-width="3"/>
    <rect x="31" y="22" width="40" height="30" rx="14" fill="#2b3a67" stroke="#23204a" stroke-width="3"/>
    <circle cx="44" cy="37" r="6.5" fill="#fff"/><circle cx="60" cy="37" r="6.5" fill="#fff"/>
    <circle class="eye" cx="45.5" cy="38" r="3.4" fill="#23204a"/><circle class="eye" cx="61.5" cy="38" r="3.4" fill="#23204a"/>
    <path d="M47 45 Q52 49 57 45" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 27 Q42 23 48 25" fill="none" stroke="#fff8" stroke-width="3" stroke-linecap="round"/>
    <line x1="51" y1="9" x2="51" y2="2" stroke="#23204a" stroke-width="3"/><circle cx="51" cy="2" r="3.5" fill="#ff4d4d"/>
    <g class="blaster">
      <rect x="60" y="66" width="44" height="14" rx="6" fill="#4fd1ff" stroke="#23204a" stroke-width="3"/>
      <rect x="100" y="68" width="10" height="10" rx="3" fill="#ff7ad9" stroke="#23204a" stroke-width="3"/>
      <rect x="66" y="78" width="10" height="13" rx="3" fill="#2b3a67" stroke="#23204a" stroke-width="3"/>
      <circle cx="80" cy="73" r="3" fill="#fff"/>
      <circle cx="68" cy="80" r="7" fill="${suit}" stroke="#23204a" stroke-width="3"/>
    </g>
  </svg>`;
}

// Tête du héros pour la barre de progression.
export function heroHead(color = '#ff4d4d', size = 30) {
  return `<svg width="${size}" height="${size}" viewBox="20 6 62 62" aria-hidden="true">
    <circle cx="51" cy="36" r="27" fill="#f1f3fa" stroke="#23204a" stroke-width="4"/>
    <rect x="31" y="22" width="40" height="30" rx="14" fill="#2b3a67"/>
    <circle cx="44" cy="37" r="6" fill="#fff"/><circle cx="60" cy="37" r="6" fill="#fff"/>
    <circle cx="45" cy="38" r="3" fill="#23204a"/><circle cx="61" cy="38" r="3" fill="#23204a"/>
    <rect x="44" y="58" width="14" height="8" fill="${color === 'arc' ? '#ff8a3d' : color}"/></svg>`;
}

// Monstre de combat : corps gélatineux, bras, pieds, et accessoires selon le niveau.
export function monster(color, level = 1, boss = false, size = 130) {
  const eyes = level % 3 === 0 ? [[60, 52, 13]] : level % 3 === 1 ? [[48, 50, 10], [70, 46, 12]] : [[42, 52, 8], [58, 44, 9], [74, 52, 8]];
  const hat = boss ? `<path d="M36 22 L42 2 L52 15 L60 -2 L68 15 L78 2 L84 22 Z" fill="#ffd23f" stroke="#23204a" stroke-width="3"/>
      <circle cx="60" cy="6" r="3" fill="#ff4d4d"/>`
    : level >= 4 ? `<path d="M30 30 L18 10 L40 24 Z M90 30 L102 10 L80 24 Z" fill="#fff" stroke="#23204a" stroke-width="3"/>`
    : level >= 2 ? `<line x1="48" y1="22" x2="40" y2="4" stroke="#23204a" stroke-width="3"/><circle cx="40" cy="4" r="5" fill="${color}" stroke="#23204a" stroke-width="2"/>
      <line x1="72" y1="22" x2="80" y2="4" stroke="#23204a" stroke-width="3"/><circle cx="80" cy="4" r="5" fill="${color}" stroke="#23204a" stroke-width="2"/>` : '';
  return `<svg class="monster-svg${boss ? ' boss' : ''}" width="${size}" height="${size}" viewBox="0 -6 120 132" aria-hidden="true">
    <ellipse cx="60" cy="122" rx="38" ry="6" fill="#0002"/>
    <path class="m-arm-l" d="M22 70 Q4 64 8 50" fill="none" stroke="#23204a" stroke-width="9" stroke-linecap="round"/>
    <path class="m-arm-l" d="M22 70 Q4 64 8 50" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <path class="m-arm-r" d="M98 70 Q116 64 112 50" fill="none" stroke="#23204a" stroke-width="9" stroke-linecap="round"/>
    <path class="m-arm-r" d="M98 70 Q116 64 112 50" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <path d="M18 104 C6 70 18 22 60 20 C102 22 114 70 102 104 C96 118 82 110 74 118 C66 124 54 124 46 118 C38 110 24 118 18 104Z" fill="${color}" stroke="#23204a" stroke-width="3.5"/>
    <path d="M30 40 Q38 30 50 30" fill="none" stroke="#fff7" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="44" cy="98" rx="8" ry="4" fill="#fff3"/>
    ${eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#23204a" stroke-width="2.5"/><circle class="m-pupil" cx="${x - r / 3}" cy="${y + 1}" r="${r / 2.2}" fill="#23204a"/>`).join('')}
    <path class="m-mouth" d="M46 80 Q60 90 74 80" fill="none" stroke="#23204a" stroke-width="4" stroke-linecap="round"/>
    <path d="M55 83 L57 89 L60 84 Z" fill="#fff" stroke="#23204a" stroke-width="1.5"/>
    ${hat}</svg>`;
}

// Décor de combat (ciel, astres, collines, sol) aux couleurs de la planète.
const SCENES = {
  nombres: { sky: ['#ffe7c2', '#ffc58a'], hill: '#f4a259', hill2: '#e98a3c', ground: '#e8b07a', ground2: '#c98a54', deco: '🪨🌵' },
  calcul: { sky: ['#cfeaff', '#9fc8ff'], hill: '#7aa7e8', hill2: '#5a86cf', ground: '#a8c4ee', ground2: '#7f9fd6', deco: '💎🧊' },
  problemes: { sky: ['#e2ffd6', '#b6f0a2'], hill: '#69c46b', hill2: '#4aa253', ground: '#9fd27c', ground2: '#76b357', deco: '🍄🌿' },
  grandeurs: { sky: ['#f6e0ff', '#e2b6ff'], hill: '#b77be6', hill2: '#9459c9', ground: '#d4a9ef', ground2: '#ac7fd0', deco: '🔷🔶' },
  temps: { sky: ['#d9fff8', '#a6efe4'], hill: '#4cc3b2', hill2: '#2f9e8f', ground: '#93dccf', ground2: '#5fb8aa', deco: '⏳🕰️' },
  arcade: { sky: ['#ffe0ec', '#ffc0d6'], hill: '#ff8fb3', hill2: '#e86b94', ground: '#ffb3c9', ground2: '#e38aa6', deco: '⭐🎈' },
};
export const sceneColors = (id) => SCENES[id] || SCENES.arcade;

export function sceneBg(id) {
  const c = sceneColors(id);
  return `<svg class="scene-bg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky[0]}"/><stop offset="1" stop-color="${c.sky[1]}"/></linearGradient></defs>
    <rect width="400" height="200" fill="url(#sky-${id})"/>
    <circle cx="318" cy="38" r="26" fill="#fff6"/><circle cx="318" cy="38" r="26" fill="none" stroke="#fff9" stroke-width="2"/>
    <ellipse cx="318" cy="40" rx="44" ry="8" fill="none" stroke="#fff8" stroke-width="3"/>
    <circle cx="360" cy="70" r="12" fill="#fff5"/><circle cx="70" cy="30" r="4" fill="#fff"/><circle cx="200" cy="18" r="3" fill="#fff"/>
    <path d="M0 140 Q40 92 90 120 T190 112 T300 118 T400 104 V200 H0Z" fill="${c.hill}" opacity=".55"/>
    <path d="M0 150 Q60 118 120 140 T260 136 T400 130 V200 H0Z" fill="${c.hill2}" opacity=".6"/>
    <rect y="156" width="400" height="44" fill="${c.ground}"/>
    <path d="M0 156 Q20 150 40 156 T80 156 T120 156 T160 156 T200 156 T240 156 T280 156 T320 156 T360 156 T400 156" fill="none" stroke="${c.ground2}" stroke-width="4"/>
    <ellipse cx="60" cy="176" rx="14" ry="4" fill="${c.ground2}" opacity=".6"/><ellipse cx="230" cy="186" rx="20" ry="5" fill="${c.ground2}" opacity=".5"/>
    <ellipse cx="340" cy="174" rx="10" ry="3" fill="${c.ground2}" opacity=".6"/>
  </svg>`;
}
