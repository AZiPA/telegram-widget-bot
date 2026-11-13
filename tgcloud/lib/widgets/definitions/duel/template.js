import { minifyWidgetHtml } from '../../template-utils.js';

/**
 * Generates the minified Profile 1 HTML for the per-chat Duel widget.
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
  padding: 12px 20px max(12px, env(safe-area-inset-bottom)) 20px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--tg-theme-text-color, #000000);
  background: var(--tg-theme-bg-color, transparent);
  box-sizing: border-box;
  user-select: none;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.title {
  font-size: 15px;
  font-weight: 600;
}
.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.08));
  color: var(--tg-theme-hint-color, #707579);
}
.board {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--tg-theme-section-separator-color, rgba(0, 0, 0, 0.1));
}
.player {
  flex: 1;
  text-align: center;
}
.p-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.p-score {
  font-size: 20px;
  font-weight: 700;
  margin-top: 2px;
  color: var(--tg-theme-button-color, #2481cc);
}
.vs {
  font-size: 12px;
  font-weight: 600;
  color: var(--tg-theme-hint-color, #707579);
}
.act-btn {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 11px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  background: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #ffffff);
}
.act-btn:disabled {
  opacity: 0.6;
  cursor: default;
  background: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.12));
  color: var(--tg-theme-hint-color, #707579);
}
.act-btn.strike {
  background: var(--tg-theme-destructive-text-color, #e53935);
  color: #ffffff;
}
.snapshot-card {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--tg-theme-section-separator-color, rgba(0, 0, 0, 0.1));
  font-size: 14px;
  line-height: 1.4;
}
.status {
  text-align: center;
  font-size: 12px;
  color: var(--tg-theme-hint-color, #707579);
  margin-top: 6px;
  min-height: 16px;
}
</style>
</head>
<body>
<div class="header">
  <span class="title">⚔️ Tap Duel</span>
  <span class="badge" id="hdr-badge">Target 5</span>
</div>
<div id="content"></div>
<div class="status" id="st"></div>

<script>
const TW = window.TelegramWidget;
function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
let lastRev = 0;
let cachedChatData = null;
let currentAct = null;
let statusMsg = '';

function renderStatus() {
  const stEl = document.getElementById('st');
  if (stEl) {
    stEl.textContent = statusMsg;
  }
}

function draw() {
  const contentEl = document.getElementById('content');
  const badgeEl = document.getElementById('hdr-badge');

  let publicData = null;
  if (TW && TW.publicData) {
    try {
      publicData = typeof TW.publicData === 'string' ? JSON.parse(TW.publicData) : TW.publicData;
    } catch (e) {}
  }

  if (TW?.isForward || (!TW?.chatData && !cachedChatData)) {
    if (badgeEl) badgeEl.textContent = 'Snapshot';
    if (contentEl) {
      contentEl.innerHTML = '<div class="snapshot-card">' +
        ((publicData && publicData.summary) ? esc(publicData.summary) : 'Duel snapshot') +
        '</div>';
    }
    renderStatus();
    return;
  }

  let chatData = cachedChatData;
  if (TW && TW.chatData) {
    try {
      const parsed = typeof TW.chatData === 'string' ? JSON.parse(TW.chatData) : TW.chatData;
      if (parsed && (parsed.r === undefined || parsed.r >= lastRev)) {
        lastRev = parsed.r || lastRev;
        cachedChatData = parsed;
        chatData = parsed;
      }
    } catch (e) {}
  }

  if (!chatData) {
    renderStatus();
    return;
  }

  const target = chatData.target || 5;
  if (badgeEl) badgeEl.textContent = 'First to ' + target;

  const viewer = TW?.viewer;
  const viewerId = viewer?.id;
  const p1 = chatData.p1;
  const p2 = chatData.p2;
  const turn = chatData.turn;
  const winner = chatData.winner;

  let btnHtml = '';
  currentAct = null;

  if (winner) {
    btnHtml = '<button class="act-btn" disabled>🏆 ' + esc(winner) + ' won!</button>';
  } else if (!p1) {
    btnHtml = '<button class="act-btn" id="btn">Join Duel</button>';
    currentAct = 'join';
  } else if (!p2) {
    if (viewerId && p1.id === viewerId) {
      btnHtml = '<button class="act-btn" disabled>Waiting for opponent...</button>';
    } else {
      btnHtml = '<button class="act-btn" id="btn">Join Duel</button>';
      currentAct = 'join';
    }
  } else {
    if (viewerId !== p1.id && viewerId !== p2.id) {
      btnHtml = '<button class="act-btn" disabled>Spectating Duel</button>';
    } else if (turn === viewerId) {
      btnHtml = '<button class="act-btn strike" id="btn">Strike!</button>';
      currentAct = 'hit';
    } else {
      btnHtml = '<button class="act-btn" disabled>Opponent\\'s Turn</button>';
    }
  }

  if (contentEl) {
    contentEl.innerHTML =
      '<div class="board">' +
        '<div class="player">' +
          '<div class="p-name">' + (p1 ? esc(p1.name) : 'Open') + '</div>' +
          '<div class="p-score">' + (p1 ? p1.s : '-') + '</div>' +
        '</div>' +
        '<div class="vs">VS</div>' +
        '<div class="player">' +
          '<div class="p-name">' + (p2 ? esc(p2.name) : 'Open') + '</div>' +
          '<div class="p-score">' + (p2 ? p2.s : '-') + '</div>' +
        '</div>' +
      '</div>' +
      btnHtml;

    const btn = document.getElementById('btn');
    if (btn && currentAct) {
      const act = currentAct;
      btn.addEventListener('click', () => {
        if (!TW || TW.isPreview) return;
        statusMsg = 'Sending...';
        renderStatus();
        TW.request('duel:' + act + ':1').then((res) => {
          try {
            const data = typeof res?.result === 'string' ? JSON.parse(res.result) : res?.result;
            if (data && (data.r === undefined || data.r >= lastRev)) {
              lastRev = data.r || lastRev;
              cachedChatData = data;
              statusMsg = '';
              draw();
            }
          } catch (e) {}
        }, (err) => {
          statusMsg = err?.code === 'NOT_ALLOWED' ? 'Open the bot to play' : ('Error: ' + (err?.code || 'ERR'));
          renderStatus();
        });
      });
    }
  }

  renderStatus();
}

try {
  TW?.onEvent?.('chatDataChanged', draw);
  TW?.onEvent?.('publicDataChanged', draw);
} catch (e) {}
draw();
try { TW?.ready?.(); } catch (e) {}
</script>
</body>
</html>`;

  return minifyWidgetHtml(rawHtml);
}
