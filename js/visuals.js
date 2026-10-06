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

// Figure partagée en `parts` parts égales, une seule coloriée.
export function fraction(parts, kind = 'rect') {
  if (kind === 'disc') {
    let s = '';
    for (let i = 0; i < parts; i++) {
      const a1 = (i * 2 * Math.PI) / parts - Math.PI / 2, a2 = ((i + 1) * 2 * Math.PI) / parts - Math.PI / 2;
      const p1 = [80 + 70 * Math.cos(a1), 80 + 70 * Math.sin(a1)], p2 = [80 + 70 * Math.cos(a2), 80 + 70 * Math.sin(a2)];
      const large = parts === 1 ? 1 : 0;
      s += `<path d="M80,80 L${p1[0]},${p1[1]} A70,70 0 ${large} 1 ${p2[0]},${p2[1]} Z" class="${i === 0 ? 'frac-on' : 'frac-off'}"/>`;
    }
    return `<svg class="vis frac" viewBox="0 0 160 160" role="img" aria-label="disque partagé">${s}</svg>`;
  }
  const w = 240 / parts;
  let s = '';
  for (let i = 0; i < parts; i++) s += `<rect x="${i * w}" y="0" width="${w}" height="90" class="${i === 0 ? 'frac-on' : 'frac-off'}"/>`;
  return `<svg class="vis frac" viewBox="-3 -3 246 96" role="img" aria-label="rectangle partagé">${s}</svg>`;
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
