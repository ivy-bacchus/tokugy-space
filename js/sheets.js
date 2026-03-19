/* ===========================
   tokugy space — sheets.js
   =========================== */

const SPREADSHEET_ID = '14E6pCpk2jO4INeRxx3tm7ZLrNCu3EgGeuUXe7tX8_oo';
const SHEET_EVENTS  = 'イベント';
const SHEET_REPORTS = 'レポート';

const WEEKDAYS  = ['日','月','火','水','木','金','土'];
const MONTHS_JP = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

// ─── Fetch ────────────────────────────────────────────────────────

async function fetchSheet(sheetName) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq` +
    `?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res  = await fetch(url);
  const text = await res.text();
  const start = text.indexOf('setResponse(') + 'setResponse('.length;
  const end   = text.lastIndexOf(')');
  const json  = JSON.parse(text.slice(start, end));
  if (json.status !== 'ok') throw new Error('Sheets error: ' + (json.errors?.[0]?.message ?? ''));
  return json.table.rows || [];
}

// ─── イベント（予定） ──────────────────────────────────────────────
// 列: ID(0) タイトル(1) 日付(2) 時間(3) カテゴリ(4) 説明(5) 詳細説明(6) 画像URL(7) 定員(8) 申込URL(9) 公開(10)

export async function fetchEvents() {
  const rows = await fetchSheet(SHEET_EVENTS);
  return rows.map((row, i) => {
    const c = row.c || [];
    const v = i => c[i]?.v ?? null;
    const f = i => c[i]?.f ?? null;
    const s = i => f(i) ?? (v(i) != null ? String(v(i)) : '');
    return {
      id:          s(0),
      title:       s(1),
      date:        f(2) ?? s(2),
      time:        s(3),
      category:    s(4),
      description: s(5),
      detail:      s(6),
      imageUrl:    s(7),
      capacity:    s(8),
      regUrl:      s(9),
      published:   v(10) === true || String(v(10)).toUpperCase() === 'TRUE',
    };
  }).filter(e => e.published && e.title);
}

// ─── レポート（過去） ──────────────────────────────────────────────
// 列: ID(0) タイトル(1) 開催日(2) カテゴリ(3) 概要(4) レポート本文(5) 画像1(6) 画像2(7) 画像3(8) 公開(9)

export async function fetchReports() {
  const rows = await fetchSheet(SHEET_REPORTS);
  return rows.map((row, i) => {
    const c = row.c || [];
    const v = i => c[i]?.v ?? null;
    const f = i => c[i]?.f ?? null;
    const s = i => f(i) ?? (v(i) != null ? String(v(i)) : '');
    return {
      id:       s(0),
      title:    s(1),
      date:     f(2) ?? s(2),
      category: s(3),
      summary:  s(4),
      body:     s(5),
      images:   [s(6), s(7), s(8)].filter(Boolean),
      published: v(9) === true || String(v(9)).toUpperCase() === 'TRUE',
    };
  }).filter(r => r.published && r.title);
}

// ─── Date utils ───────────────────────────────────────────────────

export function parseDate(str) {
  if (!str) return null;
  const s = String(str);
  const g = s.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (g) return new Date(+g[1], +g[2], +g[3]);
  const p = s.split(/[\/\-]/).map(Number);
  if (p.length === 3 && !isNaN(p[0])) return new Date(p[0], p[1]-1, p[2]);
  return null;
}

export function isUpcoming(event) {
  const d = parseDate(event.date);
  if (!d) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return d >= today;
}

export function formatDate(str) {
  const d = parseDate(str);
  if (!d) return { month:'', day:'', weekday:'', full: str };
  return {
    month:   MONTHS_JP[d.getMonth()],
    day:     d.getDate(),
    weekday: WEEKDAYS[d.getDay()],
    full:    `${d.getFullYear()}年${MONTHS_JP[d.getMonth()]}${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`,
  };
}

// ─── Badge ────────────────────────────────────────────────────────

export function badgeClass(cat) {
  const color = { 'ワークショップ': 'teal', 'イベント': 'coral', 'マルシェ': 'yellow' }[cat] ?? 'orange';
  return `badge badge-${color}`;
}

// ─── Card HTML ────────────────────────────────────────────────────

export function renderEventCard(ev, isPast = false) {
  const d    = formatDate(ev.date);
  const href = `event.html?id=${encodeURIComponent(ev.id)}`;
  const bc   = badgeClass(ev.category);
  return `
  <a href="${href}" class="event-card${isPast ? ' event-card--past' : ''}" aria-label="${esc(ev.title)}の詳細を見る">
    <div class="event-card__image">
      ${ev.imageUrl ? `<img src="${esc(ev.imageUrl)}" alt="${esc(ev.title)}" loading="lazy">` : ''}
      <div class="event-card__date-block">
        <span class="month">${d.month}</span>
        <span class="day">${d.day}</span>
      </div>
      <div class="event-card__badges">
        <span class="${bc}">${esc(ev.category || 'お知らせ')}</span>
        ${isPast ? '<span class="badge badge-orange">終了</span>' : ''}
      </div>
    </div>
    <div class="event-card__body">
      <h3 class="event-card__title">${esc(ev.title)}</h3>
      ${ev.time ? `<span class="event-card__meta">${svgClock}<span>${esc(ev.time)}</span></span>` : ''}
      ${ev.capacity ? `<span class="event-card__meta">${svgUsers}<span>定員 ${esc(ev.capacity)}</span></span>` : ''}
      <p class="event-card__desc">${esc(ev.description)}</p>
    </div>
    <div class="event-card__footer">
      <span class="event-card__price">参加費無料</span>
      <span class="event-card__link">詳しく見る ${svgArrow}</span>
    </div>
  </a>`;
}

export function renderReportCard(rep) {
  const d    = formatDate(rep.date);
  const href = `report.html?id=${encodeURIComponent(rep.id)}`;
  const img  = rep.images[0];
  const bc   = badgeClass(rep.category);
  return `
  <a href="${href}" class="report-card" aria-label="${esc(rep.title)}を読む">
    <div class="report-card__image">
      ${img ? `<img src="${esc(img)}" alt="${esc(rep.title)}" loading="lazy">` : ''}
    </div>
    <div class="report-card__body">
      <div class="report-card__meta">
        <span class="${bc}">${esc(rep.category || 'レポート')}</span>
        <span class="report-card__date">${d.full}</span>
      </div>
      <h3 class="report-card__title">${esc(rep.title)}</h3>
      <p class="report-card__desc">${esc(rep.summary)}</p>
      <span class="event-card__link" style="margin-top:.5rem">レポートを読む ${svgArrow}</span>
    </div>
  </a>`;
}

// ─── Inline SVG ───────────────────────────────────────────────────

const svgClock = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const svgUsers = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const svgArrow = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
export const svgPin   = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
export const svgCalendar = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

// ─── Escape ────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Shared UI ────────────────────────────────────────────────────

export function initFadeIn() {
  const ob = new IntersectionObserver(
    es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); ob.unobserve(e.target); } }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.fade-in').forEach(el => ob.observe(el));
}

export function initMobileNav() {
  const btn    = document.getElementById('navHamburger');
  const drawer = document.getElementById('navDrawer');
  if (!btn || !drawer) return;
  btn.addEventListener('click', () => {
    const open = drawer.classList.toggle('is-open');
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    drawer.classList.remove('is-open');
    btn.classList.remove('is-open');
  }));
}

export function loadingHTML() {
  return `<div class="events-loading" style="grid-column:1/-1">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
    <p>読み込み中...</p></div>`;
}

export function errorHTML(msg) {
  return `<div class="events-error" style="grid-column:1/-1"><p>${msg}</p></div>`;
}
