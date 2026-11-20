import { minifyWidgetHtml } from '../../template-utils.js';
import { TIMER_CSS } from './ui/styles.js';
import { renderTimerMarkup } from './ui/markup.js';
import { TIMER_CLIENT_JS } from './ui/client-script.js';

/**
 * Generates the minified Profile 1 HTML for the Two-Page Swipeable Hybrid Chronograph widget.
 *
 * @param {object} [params]
 * @returns {string}
 */
export function renderHtml(params) {
  return minifyWidgetHtml(
    `<style>${TIMER_CSS}</style>${renderTimerMarkup()}<script>${TIMER_CLIENT_JS}</script>`
  );
}
