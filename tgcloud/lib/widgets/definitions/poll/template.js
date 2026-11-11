import { minifyWidgetHtml } from '../../template-utils.js';

/**
 * Generates the minified Profile 1 HTML for the shared Poll widget.
 *
 * @returns {string}
 */
export function renderHtml() {
  const rawHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {
  margin: 0;
  padding: 12px 14px max(12px, env(safe-area-inset-bottom)) 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--tg-theme-text-color, #000000);
  background: var(--tg-theme-bg-color, transparent);
  box-sizing: border-box;
  user-select: none;
}
.title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 12px;
  word-break: break-word;
}
.opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.opt {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--tg-theme-section-separator-color, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
  background: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.04));
  color: var(--tg-theme-text-color, inherit);
  font-size: 14px;
  cursor: pointer;
  overflow: hidden;
  text-align: left;
}
.opt.selected {
  border-color: var(--tg-theme-button-color, #2481cc);
}
.bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--tg-theme-button-color, #2481cc);
  opacity: 0.18;
  pointer-events: none;
}
.txt {
  position: relative;
  z-index: 1;
  font-weight: 500;
}
.pct {
  position: relative;
  z-index: 1;
  font-size: 13px;
  color: var(--tg-theme-hint-color, #707579);
  margin-left: 8px;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--tg-theme-hint-color, #707579);
  margin-top: 6px;
  min-height: 16px;
}
.status {
  font-style: italic;
}
</style>
</head>
<body>
<div class="title" id="q"></div>
<div class="opts" id="opts"></div>
<div class="meta">
  <span id="tot"></span>
  <span class="status" id="st"></span>
</div>
<script>
const TW = window.TelegramWidget;
let lastRev = 0;
let myVote = null;
try {
  const stored = localStorage.getItem(' vote') ?? localStorage.getItem('vote');
  if (stored !== null && stored !== undefined) {
    myVote = parseInt(stored, 10);
  }
} catch (e) {}

let cachedData = null;
let statusText = '';

function renderStatus() {
  const stEl = document.getElementById('st');
  if (stEl) {
    stEl.textContent = statusText;
  }
}

function draw() {
  let data = cachedData;
  if (TW && TW.publicData) {
    try {
      const parsed = typeof TW.publicData === 'string' ? JSON.parse(TW.publicData) : TW.publicData;
      if (parsed && (parsed.r === undefined || parsed.r >= lastRev)) {
        lastRev = parsed.r || lastRev;
        cachedData = parsed;
        data = parsed;
      }
    } catch (e) {}
  }

  if (!data) return;

  const qEl = document.getElementById('q');
  if (qEl) {
    qEl.textContent = data.q || '';
  }

  const optsEl = document.getElementById('opts');
  if (optsEl) {
    optsEl.innerHTML = '';
    const votes = Array.isArray(data.v) ? data.v : [];
    const total = votes.reduce((a, b) => a + (Number(b) || 0), 0);
    const options = Array.isArray(data.o) ? data.o : [];

    options.forEach((optText, idx) => {
      const vCount = Number(votes[idx]) || 0;
      const pct = total > 0 ? Math.round((vCount / total) * 100) : 0;
      const btn = document.createElement('button');
      btn.className = 'opt' + (myVote === idx ? ' selected' : '');

      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.width = pct + '%';
      btn.appendChild(bar);

      const txt = document.createElement('span');
      txt.className = 'txt';
      txt.textContent = (myVote === idx ? '✓ ' : '') + optText;
      btn.appendChild(txt);

      const pSpan = document.createElement('span');
      pSpan.className = 'pct';
      pSpan.textContent = pct + '%';
      btn.appendChild(pSpan);

      btn.addEventListener('click', () => {
        if (!TW || TW.isPreview) return;
        statusText = 'Sending...';
        renderStatus();
        TW.request('poll:vote:' + idx).then((res) => {
          try {
            const resData = typeof res?.result === 'string' ? JSON.parse(res.result) : res?.result;
            if (resData && (resData.r === undefined || resData.r >= lastRev)) {
              lastRev = resData.r || lastRev;
              cachedData = resData;
              myVote = idx;
              try {
                localStorage.setItem(' vote', String(idx));
                localStorage.setItem('vote', String(idx));
              } catch (e) {}
              statusText = '';
              draw();
            }
          } catch (e) {}
        }, (err) => {
          statusText = err?.code === 'NOT_ALLOWED' ? 'Open the bot to vote' : ('Error: ' + (err?.code || 'UNKNOWN'));
          renderStatus();
        });
      });

      optsEl.appendChild(btn);
    });

    const totEl = document.getElementById('tot');
    if (totEl) {
      totEl.textContent = total + (total === 1 ? ' vote' : ' votes');
    }
  }

  renderStatus();
}

try {
  TW?.watchPublicData?.();
  TW?.onEvent?.('publicDataChanged', draw);
} catch (e) {}
draw();
try { TW?.ready?.(); } catch (e) {}
</script>
</body>
</html>`;

  return minifyWidgetHtml(rawHtml);
}
