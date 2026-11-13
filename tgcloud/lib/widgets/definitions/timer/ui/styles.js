/**
 * Profile 1 CSS rules for the 550px Two-Page Hybrid Chronograph widget.
 */
export const TIMER_CSS = `body{margin:0;height:550px;box-sizing:border-box;padding:10px 20px max(12px,env(safe-area-inset-bottom)) 20px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;font-family:system-ui,sans-serif;color:var(--tg-theme-text-color);user-select:none}
.tabs,#pager{display:flex;align-items:center}
.tabs{height:32px;justify-content:center;gap:8px;flex-shrink:0}
#pager{width:100%;max-width:360px;margin:4px auto 0;height:34px;justify-content:space-between;flex-shrink:0}
button{border:none;cursor:pointer;font-family:inherit;font-weight:600;text-align:center}
button[disabled]{color:var(--tg-theme-hint-color);cursor:not-allowed}
.tab,.pg-btn{font-size:12px;background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15))}
.tab{padding:4px 14px;border-radius:14px;color:var(--tg-theme-hint-color)}
.tab.on{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff)}
.pg-btn{padding:6px 12px;border-radius:6px;color:var(--tg-theme-button-color,#3390ec)}
#vp{display:block;width:100%;flex:1;min-height:0;overflow:hidden;touch-action:pan-y;margin:6px 0}
#trk{display:flex;width:200%;height:100%;flex-shrink:0;transition:transform .24s cubic-bezier(.22,1,.36,1)}
.pg{width:50%;min-width:50%;max-width:50%;height:100%;overflow:hidden;box-sizing:border-box;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.clk-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;flex-shrink:0}
#aclk,#clk,.tbl{font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums}
#aclk{font-size:18px;font-weight:600;margin-top:4px;text-align:center;white-space:nowrap}
#clk{font-size:clamp(26px,8.5vw,34px);font-weight:700;text-align:center;width:100%;margin:2px 0;white-space:nowrap;flex-shrink:0}
#lpInfo{font-size:12px;color:var(--tg-theme-hint-color);font-variant-numeric:tabular-nums;white-space:nowrap}
.empty-msg{font-size:13px;color:var(--tg-theme-hint-color);text-align:center;margin-top:4px}
.tbl{width:100%;max-width:360px;margin:0 auto}
.th,.tr{display:grid;grid-template-columns:54px 1fr 1fr;column-gap:4px;align-items:center;border-bottom:1px solid var(--tg-theme-section-separator-color,rgba(128,128,128,.25))}
.th{font-size:10.5px;font-weight:600;color:var(--tg-theme-hint-color);padding:4px 0 3px;text-transform:uppercase;letter-spacing:.3px}
.tr{height:25px;box-sizing:border-box;font-size:12px}
.th span,.tr span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tbl span:first-child{text-align:left}
.tbl span:nth-child(2){text-align:center;color:var(--tg-theme-hint-color)}
.tbl span:last-child{text-align:right;font-weight:500}
.btns{height:44px;display:grid;grid-template-columns:1fr 1fr;gap:10px;flex-shrink:0}
.b-pri,.b-red,.b-sec{border-radius:8px;font-size:15px}
.b-pri{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff)}
.b-red{background:var(--tg-theme-destructive-text-color,#e53935);color:#fff}
.b-sec{background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15));color:var(--tg-theme-text-color,inherit)}`;
