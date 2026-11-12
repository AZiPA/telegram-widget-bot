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
body{margin:0;height:600px;box-sizing:border-box;padding:10px 14px max(12px,env(safe-area-inset-bottom)) 20px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;font-family:system-ui,sans-serif;color:var(--tg-theme-text-color);user-select:none;-webkit-user-select:none}
.hdr{height:32px;display:flex;justify-content:center;align-items:center;gap:8px}
.dot,.pg-btn{border:none;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15))}
.dot{padding:4px 14px;border-radius:14px;color:var(--tg-theme-hint-color,#888)}
.dot.on{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff)}
.pg-btn{padding:6px 12px;border-radius:6px;color:var(--tg-theme-button-color,#3390ec)}
.pg-btn[disabled]{color:var(--tg-theme-hint-color,#888);cursor:not-allowed}
#vp{flex:1;overflow:hidden;touch-action:pan-y;display:flex;margin:6px 0}
#trk{display:flex;width:200%;height:100%;transition:transform .24s cubic-bezier(.22,1,.36,1)}
.pg{width:50%;height:100%;box-sizing:border-box;flex-shrink:0;display:flex;flex-direction:column;justify-content:space-between}
#p0{align-items:center}
#aclk,#clk{font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums}
#aclk{font-size:18px;font-weight:600;margin-top:4px}
#clk{font-size:32px;font-weight:700;text-align:center;margin:4px 0}
#l1{width:100%}
#l2{flex:1;overflow:hidden}
#pager{height:34px;display:flex;justify-content:space-between;align-items:center}
#lpInfo{font-size:12px;color:var(--tg-theme-hint-color,#888);font-variant-numeric:tabular-nums}
.l-hdr,.l-row{display:flex;justify-content:space-between;border-bottom:1px solid var(--tg-theme-section-separator-color,rgba(128,128,128,.2))}
.l-hdr{font-size:11px;font-weight:600;color:var(--tg-theme-hint-color,#888);padding:4px 0 2px;text-transform:uppercase;letter-spacing:.3px}
.l-row{align-items:center;height:26px;box-sizing:border-box;font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:13px}
.l-col-lap{width:25%;text-align:left}
.l-col-split{width:38%;text-align:center;color:var(--tg-theme-hint-color,#888)}
.l-col-tot{width:37%;text-align:right;font-weight:500}
.l-empty span{color:var(--tg-theme-section-separator-color,rgba(128,128,128,.2))}
.btns{height:44px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
button.b-pri,button.b-red,button.b-sec{border:none;border-radius:8px;font-size:15px;cursor:pointer;text-align:center;font-family:inherit;font-weight:600}
button[disabled]{color:var(--tg-theme-hint-color,#888);cursor:not-allowed}
.b-pri{background:var(--tg-theme-button-color,#3390ec);color:var(--tg-theme-button-text-color,#fff)}
.b-red{background:var(--tg-theme-destructive-text-color,#e53935);color:#fff}
.b-sec{background:var(--tg-theme-secondary-bg-color,rgba(128,128,128,.15));color:var(--tg-theme-text-color,inherit)}
</style>
</head>
<body>
<div class="hdr">
<button class="dot on" id="d0">Analog</button>
<button class="dot" id="d1">Digital</button>
</div>
<div id="vp">
<div id="trk">
<div class="pg" id="p0">
<div style="display:flex;flex-direction:column;align-items:center">
<svg viewBox="0 0 160 160" width="216" height="216" style="display:block">
<circle cx="80" cy="80" r="72" fill="none" stroke="var(--tg-theme-section-separator-color,rgba(128,128,128,.2))" stroke-width="2"/>
<circle cx="80" cy="80" r="66" fill="none" stroke="var(--tg-theme-section-separator-color,rgba(128,128,128,.2))" stroke-width="1"/>
<g stroke="var(--tg-theme-hint-color)">
<g stroke-width="2">
<line x1="80" y1="8" x2="80" y2="17"/>
<line x1="80" y1="8" x2="80" y2="17" transform="rotate(90 80 80)"/>
<line x1="80" y1="8" x2="80" y2="17" transform="rotate(180 80 80)"/>
<line x1="80" y1="8" x2="80" y2="17" transform="rotate(270 80 80)"/>
</g>
<g stroke-width="1.2">
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(30 80 80)"/>
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(60 80 80)"/>
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(120 80 80)"/>
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(150 80 80)"/>
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(210 80 80)"/>
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(240 80 80)"/>
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(300 80 80)"/>
<line x1="80" y1="8" x2="80" y2="14" transform="rotate(330 80 80)"/>
</g>
</g>
<g fill="var(--tg-theme-hint-color)" font-size="9" text-anchor="middle">
<text x="80" y="30">60</text>
<text x="132" y="83">15</text>
<text x="80" y="136">30</text>
<text x="28" y="83">45</text>
</g>
<line id="hw" x1="80" y1="80" x2="80" y2="18" stroke="var(--tg-theme-text-color,#fff)" stroke-width="2.2" stroke-linecap="round" style="display:none" transform="rotate(0 80 80)"/>
<line id="hb" x1="80" y1="92" x2="80" y2="14" stroke="var(--tg-theme-button-color,#3390ec)" stroke-width="2.8" stroke-linecap="round" transform="rotate(0 80 80)"/>
<circle cx="80" cy="80" r="4" fill="var(--tg-theme-button-color,#3390ec)"/>
</svg>
<div id="aclk">00:00:00.0</div>
</div>
<div id="l1"></div>
</div>
<div class="pg" id="p1">
<div id="clk">00:00:00.0</div>
<div id="l2"></div>
<div id="pager">
<button id="lpPrev" class="pg-btn" disabled>‹ Newer</button>
<span id="lpInfo">Page 1 / 1 (0)</span>
<button id="lpNext" class="pg-btn" disabled>Older ›</button>
</div>
</div>
</div>
</div>
<div class="btns">
<button id="b1" class="b-pri">Start</button>
<button id="b2" class="b-sec" disabled>Lap</button>
</div>
<script>
const TW=window.TelegramWidget,STORAGE_KEY='tw_sw_v1',$=(id)=>document.getElementById(id);

function pinBottom(){
if(TW&&typeof TW.setResizeAnchor==='function'){
try{TW.setResizeAnchor('bottom');}catch(e){}
}
}
pinBottom();

function parseState(val){
try{
const p=typeof val==='string'?JSON.parse(val):val;
if(p&&typeof p==='object'){
return{
s:Number(p.s)||0,
t0:Number(p.t0)||0,
acc:Number(p.acc)||0,
lc:Number(p.lc)||0,
laps:Array.isArray(p.laps)?p.laps.slice(0,150):[],
r:Number(p.r)||1
};
}
}catch(e){}
return null;
}

function loadInitialState(){
return parseState(localStorage.getItem(STORAGE_KEY))||
parseState(TW?.chatData||TW?.publicData)||
{s:0,t0:0,acc:0,lc:0,laps:[],r:1};
}

let st=loadInitialState(),rafId=null,lapPg=0;

const vp=$('vp'),trk=$('trk'),d0=$('d0'),d1=$('d1'),clkEl=$('clk'),aclkEl=$('aclk'),hbEl=$('hb'),hwEl=$('hw'),l1El=$('l1'),l2El=$('l2'),lpPrev=$('lpPrev'),lpNext=$('lpNext'),lpInfo=$('lpInfo'),b1=$('b1'),b2=$('b2');

let pg=0,sx=0,sy=0,drag=false;

function setPage(p){
pg=p?1:0;
trk.style.transform=pg?'translateX(-50%)':'translateX(0)';
d0.className=pg?'dot':'dot on';
d1.className=pg?'dot on':'dot';
try{sessionStorage.setItem('tw_sw_pg',String(pg));}catch(e){}
}

d0.onclick=()=>setPage(0);
d1.onclick=()=>setPage(1);

vp.onpointerdown=(e)=>{
if(!e.isPrimary)return;
sx=e.clientX;
sy=e.clientY;
drag=true;
};

vp.onpointerup=(e)=>{
if(!drag)return;
drag=false;
const dx=e.clientX-sx,dy=e.clientY-sy;
if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy))setPage(dx<0?1:0);
};

vp.onpointercancel=()=>{drag=false;};

function fmt(ms){
const t=Math.max(0,Math.floor(ms||0)),p=(n)=>String(Math.floor(n)).padStart(2,'0');
return p(t/3600000)+':'+p((t%3600000)/60000)+':'+p((t%60000)/1000)+'.'+Math.floor((t%1000)/100);
}

function getElapsed(now=Date.now()){
return st.s===1?st.acc+Math.max(0,now-st.t0):st.acc;
}

function paintClock(totalMs){
const text=fmt(totalMs);
clkEl.textContent=text;
aclkEl.textContent=text;

const blueDeg=((totalMs%60000)/60000)*360;
hbEl.setAttribute('transform','rotate('+blueDeg.toFixed(1)+' 80 80)');

if(!st.s||!st.laps?.length){
hwEl.style.display='none';
hwEl.setAttribute('transform','rotate(0 80 80)');
}else{
hwEl.style.display='';
const lapMs=Math.max(0,totalMs-st.laps[0][2]);
const whiteDeg=((lapMs%60000)/60000)*360;
hwEl.setAttribute('transform','rotate('+whiteDeg.toFixed(1)+' 80 80)');
}
}

function tick(){
if(st.s===1&&!document.hidden){
paintClock(getElapsed());
rafId=requestAnimationFrame(tick);
}else{
rafId=null;
}
}

function startTick(){
if(!rafId&&st.s===1&&!document.hidden)rafId=requestAnimationFrame(tick);
}

function stopTick(){
if(rafId){
cancelAnimationFrame(rafId);
rafId=null;
}
}

function row(c,l,s,t){
return '<div class="'+c+'"><span class="l-col-lap">'+l+'</span><span class="l-col-split">'+s+'</span><span class="l-col-tot">'+t+'</span></div>';
}

function renderLaps(){
const laps=st.laps||[];
let h1=row('l-hdr','Lap','Lap times','Overall time');
for(let i=0;i<4;i++){
const lap=laps[i];
h1+=lap?row('l-row','Lap '+lap[0],'+'+fmt(lap[1]),fmt(lap[2])):row('l-row l-empty','—','—','—');
}
l1El.innerHTML=h1;

const total=laps.length;
const pages=Math.max(1,Math.ceil(total/10));
if(lapPg>=pages)lapPg=Math.max(0,pages-1);

let h2=row('l-hdr','Lap','Lap times','Overall time');
if(total>0){
const slice=laps.slice(lapPg*10,(lapPg+1)*10);
for(let i=0;i<slice.length;i++){
const lap=slice[i];
h2+=row('l-row','Lap '+lap[0],'+'+fmt(lap[1]),fmt(lap[2]));
}
}
l2El.innerHTML=h2;

lpPrev.disabled=(lapPg<=0);
lpNext.disabled=((lapPg+1)*10>=total);
lpInfo.textContent='Page '+(lapPg+1)+' / '+pages+' ('+total+')';
}

lpPrev.onclick=()=>{
if(lapPg>0){
lapPg--;
renderLaps();
}
};

lpNext.onclick=()=>{
const maxPg=Math.max(0,Math.ceil((st.laps?.length||0)/10)-1);
if(lapPg<maxPg){
lapPg++;
renderLaps();
}
};

function persist(){
try{
localStorage.setItem(STORAGE_KEY,JSON.stringify(st));
}catch(e){}
}

function setBtn(b,txt,cls,dis,act){
b.textContent=txt;
b.className=cls;
b.disabled=dis;
b.dataset.act=act;
}

function renderUI(){
if(st.s===0){
stopTick();
paintClock(0);
setBtn(b1,'Start','b-pri',false,'start');
setBtn(b2,'Lap','b-sec',true,'');
}else if(st.s===1){
setBtn(b1,'Stop','b-red',false,'stop');
setBtn(b2,'Lap','b-sec',false,'lap');
paintClock(getElapsed());
startTick();
}else if(st.s===2){
stopTick();
paintClock(st.acc);
setBtn(b1,'Resume','b-pri',false,'resume');
setBtn(b2,'Reset','b-sec',false,'reset');
}
renderLaps();
}

function act(type){
try{
TW?.HapticFeedback?.impactOccurred?.('light');
}catch(e){}

const now=Date.now();
if(type==='start'&&!st.s){
st={s:1,t0:now,acc:0,lc:0,laps:[],r:(st.r||1)+1};
lapPg=0;
}else if(type==='stop'&&st.s===1){
st={...st,s:2,t0:0,acc:getElapsed(now),r:(st.r||1)+1};
}else if(type==='resume'&&st.s===2){
st={...st,s:1,t0:now,r:(st.r||1)+1};
}else if(type==='lap'&&st.s===1){
const total=getElapsed(now),split=Math.max(0,total-(st.laps[0]?.[2]||0)),num=(st.lc||0)+1;
st={...st,lc:num,laps:[[num,split,total],...st.laps].slice(0,150),r:(st.r||1)+1};
lapPg=0;
}else if(type==='reset'&&st.s!==1){
st={s:0,t0:0,acc:0,lc:0,laps:[],r:(st.r||1)+1};
lapPg=0;
}else{
return;
}

persist();
renderUI();
}

b1.onclick=()=>{if(!b1.disabled)act(b1.dataset.act);};
b2.onclick=()=>{if(!b2.disabled)act(b2.dataset.act);};

const onVis=()=>{
if(!document.hidden&&st.s===1){
paintClock(getElapsed());
startTick();
}else{
stopTick();
}
};

document.addEventListener('visibilitychange',onVis);

try{
TW?.onEvent?.('activated',onVis);
TW?.onEvent?.('deactivated',stopTick);
}catch(e){}

try{
const savedPg=sessionStorage.getItem('tw_sw_pg');
if(savedPg==='1')setPage(1);
}catch(e){}

renderUI();

try{
TW?.ready?.();
}catch(e){}
</script>
</body>
</html>`;

  return minifyWidgetHtml(rawHtml);
}
