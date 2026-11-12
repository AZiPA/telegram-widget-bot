import { renderAnalogClockSvg } from './analog-svg.js';

/**
 * Generates the HTML skeleton for header tabs, 2-page track, and bottom button bar.
 *
 * @returns {string}
 */
export function renderTimerMarkup() {
  return (
    '<div class="tabs">' +
    '<button class="tab on" id="d0">Analog</button>' +
    '<button class="tab" id="d1">Digital</button>' +
    '</div>' +
    '<div id="vp">' +
    '<div id="trk">' +
    '<div class="pg" id="p0">' +
    '<div style="display:flex;flex-direction:column;align-items:center">' +
    renderAnalogClockSvg() +
    '<div id="aclk">00:00:00.0</div>' +
    '</div>' +
    '<div class="tbl">' +
    '<div class="th"><span>Lap</span><span>Lap times</span><span>Overall time</span></div>' +
    '<div id="l1"></div>' +
    '</div>' +
    '</div>' +
    '<div class="pg" id="p1">' +
    '<div id="clk">00:00:00.0</div>' +
    '<div class="tbl">' +
    '<div class="th"><span>Lap</span><span>Lap times</span><span>Overall time</span></div>' +
    '<div id="l2"></div>' +
    '</div>' +
    '<div id="pager">' +
    '<button id="lpPrev" class="pg-btn" disabled>‹ Newer</button>' +
    '<span id="lpInfo">Page 1 / 1</span>' +
    '<button id="lpNext" class="pg-btn" disabled>Older ›</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="btns">' +
    '<button id="b1" class="b-pri">Start</button>' +
    '<button id="b2" class="b-sec" disabled>Lap</button>' +
    '</div>'
  );
}
