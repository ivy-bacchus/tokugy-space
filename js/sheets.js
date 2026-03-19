/* ===========================
   tokugy space — sheets.js
   Google Sheets 連携モジュール
   =========================== */

const SPREADSHEET_ID = '14E6pCpk2jO4INeRxx3tm7ZLrNCu3EgGeuUXe7tX8_oo';
const SHEET_NAME     = 'シート1';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS_JP = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

// ─── Fetch & Parse ───────────────────────────────────────────────

export async function fetchEvents() {
  const url =
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq` +
    `?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const res  = await fetch(url);
  const text = await res.text();

  // gviz response: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const json = JSON.parse(text.replace(/^.*?setResponse\(/, '').replace(/\);?\s*$/, ''));

  if (json.status !== 'ok') throw new Error('Sheets API error: ' + json.errors?.[0]?.message);

  const cols = json.table.cols.map(c => c.label);
  const rows = json.table.rows || [];

  return rows
    .map(row => {
      const cells = row.c || [];
      const get = i => cells[i]?.v ?? cells[i]?.f ?? '';
      return {
        title:           get(0),
        date:            get(1),   // "2026/04/05"
        time:            get(2),
        category:        get(3),
        description:     get(4),
        capacity:        get(5),
        registrationUrl: get(6),
        published:       String(get(7)).toUpperCase() === 'TRUE',
      };
    })
    .filter(e => e.published && e.title);
}

// ─── Date helpers ─────────────────────────────────────────────────

export function parseDate(dateStr) {
  if (!dateStr) return null;
  // handle "2026/04/05" or "2026-04-05"
  const [y, m, d] = String(dateStr).split(/[\/\-]/).map(Number);
  return new Date(y, m - 1, d);
}

export function isUpcoming(event) {
  const d = parseDate(event.date);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

export function formatDateDisplay(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  return {
    month:   MONTHS_JP[d.getMonth()],
    day:     d.getDate(),
    weekday: WEEKDAYS[d.getDay()],
    full:    `${d.getFullYear()}年${MONTHS_JP[d.getMonth()]}${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`,
  };
}

// ─── Category helpers ─────────────────────────────────────────────

export function getBadgeClass(category) {
  const map = {
    'ワークショップ': 'badge-workshop',
    'イベント':       'badge-event',
    'マルシェ':       'badge-marche',
  };
  return map[category] ?? 'badge-other';
}

// ─── Render helpers ───────────────────────────────────────────────

export function renderEventCard(event, isPast = false) {
  const d     = formatDateDisplay(event.date);
  const badge = getBadgeClass(event.category);

  return `
    <article class="event-card${isPast ? ' past' : ''}">
      <div class="event-card__header">
        <div class="event-card__date-block">
          <span class="month">${d.month ?? ''}</span>
          <span class="day">${d.day ?? '–'}</span>
          <span class="weekday">${d.weekday ? '（' + d.weekday + '）' : ''}</span>
        </div>
        <span class="event-card__badge ${badge}">${event.category || 'お知らせ'}</span>
      </div>
      <div class="event-card__body">
        <h3 class="event-card__title">${escHtml(event.title)}</h3>
        <p class="event-card__desc">${escHtml(event.description)}</p>
        <div class="event-card__footer">
          <div style="display:flex;flex-direction:column;gap:.3rem">
            ${event.time ? `
            <span class="event-card__meta">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${escHtml(event.time)}
            </span>` : ''}
            ${event.capacity ? `
            <span class="event-card__meta">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              定員 ${escHtml(String(event.capacity))}
            </span>` : ''}
          </div>
          ${event.registrationUrl ? `
          <a href="${escHtml(event.registrationUrl)}" target="_blank" rel="noopener" class="event-card__link">
            申し込む
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>` : ''}
        </div>
      </div>
    </article>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── IntersectionObserver fade-in ────────────────────────────────

export function initFadeIn() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ─── Mobile nav ───────────────────────────────────────────────────

export function initMobileNav() {
  const btn    = document.getElementById('navHamburger');
  const drawer = document.getElementById('navDrawer');
  if (!btn || !drawer) return;
  btn.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
}
