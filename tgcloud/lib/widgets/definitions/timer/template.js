import { minifyWidgetHtml } from '../../template-utils.js';

/**
 * Generates the minified Profile 1 HTML for the Two-Page Swipeable Hybrid Chronograph widget.
 *
 * @returns {string}
 */
export function renderHtml() {
  const rawHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{margin:0;padding:10px 14px max(12px,env(safe-area-inset-bottom)) 14px;font-family:system-ui,-apple-system,sans-serif;color:var(--tg-theme-text-color,#000);background:var(--tg-theme-bg-color,transparent);box-sizing:border-box;user-select:none;-webkit-user-select:none}
.pills{display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:8px}
.pill{padding:4px 14px;border-radius:14px;font-size:12px;font-weight:600;background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15));color:var(--tg-theme-hint-color,#888);cursor:pointer;border:none;outline:none;transition:all .2s ease;font-family:inherit}
.pill.active{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff)}
#vp{overflow:hidden;touch-action:pan-y;user-select:none;-webkit-user-select:none;width:100%}
#trk{display:flex;width:200%;transition:transform .24s cubic-bezier(.22,1,.36,1)}
.pg{width:50%;box-sizing:border-box;flex-shrink:0;padding:0 2px}
#clk{font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:30px;font-weight:700;text-align:center;margin:8px 0 10px;letter-spacing:0.5px}
.l-hdr{display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:var(--tg-theme-hint-color,#888);padding:4px 0 2px;border-bottom:1px solid var(--tg-theme-section-separator-color,rgba(128,128,128,.2));text-transform:uppercase;letter-spacing:0.3px}
.l-row{display:flex;justify-content:space-between;font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:13px;padding:3px 0;border-bottom:1px solid var(--tg-theme-section-separator-color,rgba(128,128,128,.15))}
.l-col-lap{width:25%;text-align:left}
.l-col-split{width:38%;text-align:center;color:var(--tg-theme-hint-color,#888)}
.l-col-tot{width:37%;text-align:right;font-weight:500}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
button.b-pri,button.b-red,button.b-sec{border:none;border-radius:8px;padding:10px 0;font-size:15px;cursor:pointer;text-align:center;font-family:inherit;box-sizing:border-box}
button[disabled]{opacity:.4;cursor:not-allowed}
.b-pri{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff);font-weight:600}
.b-red{background:var(--tg-theme-destructive-text-color,#e53935);color:#fff;font-weight:600}
.b-sec{background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15));color:var(--tg-theme-text-color,inherit);font-weight:600}
</style>
</head>
<body>
<div class="pills">
  <button type="button" class="pill active" id="pAn">Analog</button>
  <button type="button" class="pill" id="pDg">Digital</button>
</div>
<div id="vp">
  <div id="trk">
    <div class="pg" id="p0">
      <svg viewBox="0 0 140 140" width="132" height="132" style="display:block;margin:0 auto">
        <circle cx="70" cy="70" r="64" fill="none" stroke="var(--tg-theme-section-separator-color,rgba(128,128,128,.3))" stroke-width="2"/>
        <line x1="70" y1="8" x2="70" y2="16" stroke="var(--tg-theme-hint-color,#888)" stroke-width="2"/>
        <line x1="132" y1="70" x2="124" y2="70" stroke="var(--tg-theme-hint-color,#888)" stroke-width="2"/>
        <line x1="70" y1="132" x2="70" y2="124" stroke="var(--tg-theme-hint-color,#888)" stroke-width="2"/>
        <line x1="8" y1="70" x2="16" y2="70" stroke="var(--tg-theme-hint-color,#888)" stroke-width="2"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(30 70 70)"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(60 70 70)"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(120 70 70)"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(150 70 70)"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(210 70 70)"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(240 70 70)"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(300 70 70)"/>
        <line x1="70" y1="8" x2="70" y2="13" stroke="var(--tg-theme-hint-color,#888)" stroke-width="1.2" transform="rotate(330 70 70)"/>
        <line id="hw" x1="70" y1="70" x2="70" y2="16" stroke="var(--tg-theme-text-color,#fff)" stroke-width="2" stroke-linecap="round" style="display:none" transform="rotate(0 70 70)"/>
        <line id="hb" x1="70" y1="80" x2="70" y2="12" stroke="var(--tg-theme-button-color,#3390ec)" stroke-width="2.6" stroke-linecap="round" transform="rotate(0 70 70)"/>
        <circle cx="70" cy="70" r="3.5" fill="var(--tg-theme-button-color,#3390ec)"/>
      </svg>
      <div id="l1"></div>
    </div>
    <div class="pg" id="p1">
      <div id="clk">00:00:00.0</div>
      <div id="l2"></div>
    </div>
  </div>
</div>
<div class="btns">
  <button type="button" id="b1" class="b-pri">Start</button>
  <button type="button" id="b2" class="b-sec" disabled>Lap</button>
</div>
<script>
const TW = window.TelegramWidget;
const STORAGE_KEY = 'tw_sw_v1';

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          s: Number(parsed.s) || 0,
          t0: Number(parsed.t0) || 0,
          acc: Number(parsed.acc) || 0,
          lc: Number(parsed.lc) || 0,
          laps: Array.isArray(parsed.laps) ? parsed.laps.slice(0, 10) : [],
          r: Number(parsed.r) || 1,
        };
      }
    }
  } catch (e) {}

  try {
    const fallback = TW?.chatData || TW?.publicData;
    if (fallback) {
      const parsed = typeof fallback === 'string' ? JSON.parse(fallback) : fallback;
      if (parsed && typeof parsed === 'object') {
        return {
          s: Number(parsed.s) || 0,
          t0: Number(parsed.t0) || 0,
          acc: Number(parsed.acc) || 0,
          lc: Number(parsed.lc) || 0,
          laps: Array.isArray(parsed.laps) ? parsed.laps.slice(0, 10) : [],
          r: Number(parsed.r) || 1,
        };
      }
    }
  } catch (e) {}

  return { s: 0, t0: 0, acc: 0, lc: 0, laps: [], r: 1 };
}

let st = loadInitialState();
let rafId = null;

const vp = document.getElementById('vp');
const trk = document.getElementById('trk');
const pAn = document.getElementById('pAn');
const pDg = document.getElementById('pDg');

const clkEl = document.getElementById('clk');
const hbEl = document.getElementById('hb');
const hwEl = document.getElementById('hw');
const l1El = document.getElementById('l1');
const l2El = document.getElementById('l2');

const b1 = document.getElementById('b1');
const b2 = document.getElementById('b2');

let pg = 0;
let sx = 0;
let sy = 0;
let drag = false;

function setPage(p) {
  pg = p;
  trk.style.transform = p ? 'translateX(-50%)' : 'translateX(0)';
  pAn.className = 'pill' + (p === 0 ? ' active' : '');
  pDg.className = 'pill' + (p === 1 ? ' active' : '');
}

pAn.onclick = function() { setPage(0); };
pDg.onclick = function() { setPage(1); };

vp.onpointerdown = function(e) {
  if (e.isPrimary === false || (e.button !== undefined && e.button !== 0)) return;
  sx = e.clientX;
  sy = e.clientY;
  drag = true;
};

vp.onpointerup = function(e) {
  if (!drag) return;
  drag = false;
  const dx = e.clientX - sx;
  const dy = e.clientY - sy;
  if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0 && pg === 0) setPage(1);
    else if (dx > 0 && pg === 1) setPage(0);
  }
};

vp.onpointercancel = function() {
  drag = false;
};

function fmt(ms) {
  const t = Math.max(0, Math.floor(ms || 0));
  const h = String(Math.floor(t / 3600000)).padStart(2, '0');
  const m = String(Math.floor((t % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((t % 60000) / 1000)).padStart(2, '0');
  const d = Math.floor((t % 1000) / 100);
  return h + ':' + m + ':' + s + '.' + d;
}

function getElapsed(now = Date.now()) {
  if (st.s === 1) {
    return st.acc + Math.max(0, now - st.t0);
  }
  return st.acc;
}

function paintClock(totalMs) {
  clkEl.textContent = fmt(totalMs);

  const blueDeg = ((totalMs % 60000) / 60000) * 360;
  hbEl.setAttribute('transform', 'rotate(' + blueDeg.toFixed(1) + ' 70 70)');

  if (st.s === 0 || !st.laps || st.laps.length === 0) {
    hwEl.style.display = 'none';
    hwEl.setAttribute('transform', 'rotate(0 70 70)');
  } else {
    hwEl.style.display = '';
    const lapMs = Math.max(0, totalMs - st.laps[0][2]);
    const whiteDeg = ((lapMs % 60000) / 60000) * 360;
    hwEl.setAttribute('transform', 'rotate(' + whiteDeg.toFixed(1) + ' 70 70)');
  }
}

function tick() {
  if (st.s === 1 && !document.hidden) {
    paintClock(getElapsed());
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = null;
  }
}

function startTick() {
  if (!rafId && st.s === 1 && !document.hidden) {
    rafId = requestAnimationFrame(tick);
  }
}

function stopTick() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function renderLapTable(container, laps) {
  container.innerHTML = '';
  if (!Array.isArray(laps) || laps.length === 0) {
    return;
  }

  const hdr = document.createElement('div');
  hdr.className = 'l-hdr';
  hdr.innerHTML = '<span class="l-col-lap">Lap</span><span class="l-col-split">Lap times</span><span class="l-col-tot">Overall time</span>';
  container.appendChild(hdr);

  for (let i = 0; i < laps.length; i++) {
    const lap = laps[i];
    const row = document.createElement('div');
    row.className = 'l-row';

    const nSpan = document.createElement('span');
    nSpan.className = 'l-col-lap';
    nSpan.textContent = 'Lap ' + lap[0];

    const sSpan = document.createElement('span');
    sSpan.className = 'l-col-split';
    sSpan.textContent = '+' + fmt(lap[1]);

    const tSpan = document.createElement('span');
    tSpan.className = 'l-col-tot';
    tSpan.textContent = fmt(lap[2]);

    row.appendChild(nSpan);
    row.appendChild(sSpan);
    row.appendChild(tSpan);
    container.appendChild(row);
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  } catch (e) {}
}

function renderUI() {
  if (st.s === 0) {
    stopTick();
    paintClock(0);

    b1.textContent = 'Start';
    b1.className = 'b-pri';
    b1.disabled = false;
    b1.dataset.act = 'start';

    b2.textContent = 'Lap';
    b2.className = 'b-sec';
    b2.disabled = true;
    b2.dataset.act = '';
  } else if (st.s === 1) {
    b1.textContent = 'Stop';
    b1.className = 'b-red';
    b1.disabled = false;
    b1.dataset.act = 'stop';

    b2.textContent = 'Lap';
    b2.className = 'b-sec';
    b2.disabled = false;
    b2.dataset.act = 'lap';

    paintClock(getElapsed());
    startTick();
  } else if (st.s === 2) {
    stopTick();
    paintClock(st.acc);

    b1.textContent = 'Resume';
    b1.className = 'b-pri';
    b1.disabled = false;
    b1.dataset.act = 'resume';

    b2.textContent = 'Reset';
    b2.className = 'b-sec';
    b2.disabled = false;
    b2.dataset.act = 'reset';
  }

  renderLapTable(l1El, st.laps ? st.laps.slice(0, 4) : []);
  renderLapTable(l2El, st.laps || []);
}

function act(type) {
  try {
    TW?.HapticFeedback?.impactOccurred?.('light');
  } catch (e) {}

  const now = Date.now();
  if (type === 'start' && st.s === 0) {
    st = { s: 1, t0: now, acc: 0, lc: 0, laps: [], r: (st.r || 1) + 1 };
  } else if (type === 'stop' && st.s === 1) {
    const el = st.acc + Math.max(0, now - st.t0);
    st = { ...st, s: 2, t0: 0, acc: el, r: (st.r || 1) + 1 };
  } else if (type === 'resume' && st.s === 2) {
    st = { ...st, s: 1, t0: now, r: (st.r || 1) + 1 };
  } else if (type === 'lap' && st.s === 1) {
    const total = st.acc + Math.max(0, now - st.t0);
    const prevTotal = st.laps.length > 0 ? st.laps[0][2] : 0;
    const split = Math.max(0, total - prevTotal);
    const num = (st.lc || 0) + 1;
    st = { ...st, lc: num, laps: [[num, split, total], ...st.laps].slice(0, 10), r: (st.r || 1) + 1 };
  } else if (type === 'reset' && (st.s === 2 || st.s === 0)) {
    st = { s: 0, t0: 0, acc: 0, lc: 0, laps: [], r: (st.r || 1) + 1 };
  } else {
    return;
  }

  persist();
  renderUI();
}

b1.onclick = function() {
  if (b1.disabled) return;
  act(b1.dataset.act);
};

b2.onclick = function() {
  if (b2.disabled) return;
  act(b2.dataset.act);
};

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && st.s === 1) {
    paintClock(getElapsed());
    startTick();
  } else {
    stopTick();
  }
});

try {
  TW?.onEvent?.('activated', () => {
    if (!document.hidden && st.s === 1) {
      paintClock(getElapsed());
      startTick();
    }
  });
  TW?.onEvent?.('deactivated', () => {
    stopTick();
  });
} catch (e) {}

renderUI();

try {
  TW?.ready?.();
} catch (e) {}
</script>
</body>
</html>`;

  return minifyWidgetHtml(rawHtml);
}
