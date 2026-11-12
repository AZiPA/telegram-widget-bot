/**
 * Profile 1 CSS rules for the 600px Two-Page Hybrid Chronograph widget.
 */
export const TIMER_CSS = `body{margin:0;height:600px;box-sizing:border-box;padding:10px 14px max(12px,env(safe-area-inset-bottom)) 20px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;font-family:system-ui,sans-serif;color:var(--tg-theme-text-color);user-select:none;-webkit-user-select:none}
.tabs,#pager{display:flex;align-items:center}
.tabs{height:32px;justify-content:center;gap:8px}
#pager{height:34px;justify-content:space-between}
.tab,.pg-btn,button.b-pri,button.b-red,button.b-sec{border:none;cursor:pointer;font-family:inherit;font-weight:600}
.tab,.pg-btn{font-size:12px;background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15))}
.tab{padding:4px 14px;border-radius:14px;color:var(--tg-theme-hint-color)}
.tab.on{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff)}
.pg-btn{padding:6px 12px;border-radius:6px;color:var(--tg-theme-button-color,#3390ec)}
.pg-btn[disabled],button[disabled]{color:var(--tg-theme-hint-color);cursor:not-allowed}
#vp{flex:1;overflow:hidden;touch-action:pan-y;display:flex;margin:6px 0}
#trk{display:flex;width:200%;height:100%;transition:transform .24s cubic-bezier(.22,1,.36,1)}
.pg{width:50%;height:100%;box-sizing:border-box;flex-shrink:0;display:flex;flex-direction:column;justify-content:space-between}
#p0{align-items:center}
#aclk,#clk,.tbl,#lpInfo{font-variant-numeric:tabular-nums}
#aclk,#clk,.tbl{font-family:ui-monospace,monospace}
#aclk{font-size:18px;font-weight:600;margin-top:4px}
#clk{font-size:32px;font-weight:700;text-align:center;margin:4px 0}
#lpInfo{font-size:12px;color:var(--tg-theme-hint-color)}
.tbl{width:100%}
.th,.tr{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--tg-theme-section-separator-color,rgba(128,128,128,.25))}
.th{font-size:11px;font-weight:600;color:var(--tg-theme-hint-color);padding:4px 0 2px;text-transform:uppercase;letter-spacing:.3px}
.tr{height:26px;box-sizing:border-box;font-size:13px}
.th span:first-child,.tr span:first-child{width:25%;text-align:left}
.th span:nth-child(2),.tr span:nth-child(2){width:38%;text-align:center;color:var(--tg-theme-hint-color)}
.th span:last-child,.tr span:last-child{width:37%;text-align:right;font-weight:500}
.btns{height:44px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
button.b-pri,button.b-red,button.b-sec{border-radius:8px;font-size:15px;text-align:center}
.b-pri{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff)}
.b-red{background:var(--tg-theme-destructive-text-color,#e53935);color:#fff}
.b-sec{background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15));color:var(--tg-theme-text-color,inherit)}`;
