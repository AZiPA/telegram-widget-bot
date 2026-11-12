/**
 * Deflate-friendly inline SVG dial and dual hands (#hb, #hw).
 *
 * @returns {string}
 */
export function renderAnalogClockSvg() {
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const major = i % 3 === 0;
    ticks += `<line x1="80" y1="10" x2="80" y2="${major ? 18 : 14}" stroke="var(--tg-theme-hint-color)" stroke-width="${major ? 2 : 1.2}" transform="rotate(${i * 30} 80 80)"/>`;
  }
  return (
    '<svg viewBox="0 0 160 160" width="212" height="212">' +
    '<circle cx="80" cy="80" r="72" fill="var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15))" stroke="var(--tg-theme-section-separator-color,rgba(128,128,128,.25))" stroke-width="2"/>' +
    ticks +
    '<text x="80" y="28" fill="var(--tg-theme-hint-color)" font-size="9" font-weight="600" text-anchor="middle">60</text>' +
    '<text x="134" y="83" fill="var(--tg-theme-hint-color)" font-size="9" font-weight="600" text-anchor="middle">15</text>' +
    '<text x="80" y="140" fill="var(--tg-theme-hint-color)" font-size="9" font-weight="600" text-anchor="middle">30</text>' +
    '<text x="26" y="83" fill="var(--tg-theme-hint-color)" font-size="9" font-weight="600" text-anchor="middle">45</text>' +
    '<line id="hw" x1="80" y1="80" x2="80" y2="18" stroke="var(--tg-theme-text-color,#fff)" stroke-width="2.2" stroke-linecap="round" style="display:none" transform="rotate(0 80 80)"/>' +
    '<line id="hb" x1="80" y1="92" x2="80" y2="14" stroke="var(--tg-theme-button-color,#3390ec)" stroke-width="2.8" stroke-linecap="round" transform="rotate(0 80 80)"/>' +
    '<circle cx="80" cy="80" r="4" fill="var(--tg-theme-button-color,#3390ec)"/>' +
    '</svg>'
  );
}
