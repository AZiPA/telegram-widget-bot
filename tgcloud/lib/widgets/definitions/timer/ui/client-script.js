/**
 * Client-side state machine (100 laps), rAF loop, swipe & pagination script.
 */
export const TIMER_CLIENT_JS = `var TW=window.TelegramWidget||null,K='tw_sw_v1',$=i=>document.getElementById(i);
try{TW?.setResizeAnchor?.('bottom');}catch(e){}
function parseState(v){try{const p=typeof v==='string'?JSON.parse(v):v;if(p&&typeof p==='object')return{s:+p.s||0,t0:+p.t0||0,acc:+p.acc||0,lc:+p.lc||0,laps:Array.isArray(p.laps)?p.laps.slice(0,100):[],r:+p.r||1};}catch(e){}return null;}
function loadInitialState(){return parseState(localStorage.getItem(K))||{s:0,t0:0,acc:0,lc:0,laps:[],r:1};}
let st=loadInitialState(),raf=0,visTmr=0,lapPg=0,pg=0,sx=0,sy=0,drag=0,lastTxt='',lastDeg='',lastWdeg='init';
const vp=$('vp'),trk=$('trk'),d0=$('d0'),d1=$('d1'),clk=$('clk'),aclk=$('aclk'),hb=$('hb'),hw=$('hw'),l1=$('l1'),l2=$('l2'),lpP=$('lpPrev'),lpN=$('lpNext'),lpI=$('lpInfo'),b1=$('b1'),b2=$('b2'),p0=$('p0'),p1=$('p1'),atbl=$('atbl'),dtbl=$('dtbl'),emptyDig=$('emptyDig'),pgr=$('pager');
function setPage(p){pg=p?1:0;if(visTmr){clearTimeout(visTmr);visTmr=0;}if(p0)p0.style.visibility='visible';if(p1)p1.style.visibility='visible';if(trk)trk.style.transform=pg?'translateX(-50%)':'translateX(0)';if(d0)d0.className=pg?'tab':'tab on';if(d1)d1.className=pg?'tab on':'tab';visTmr=setTimeout(()=>{if(p0)p0.style.visibility=pg?'hidden':'visible';if(p1)p1.style.visibility=pg?'visible':'hidden';visTmr=0;},260);try{sessionStorage.setItem('tw_sw_pg',pg);}catch(e){}}
if(d0)d0.onclick=function(){setPage(0);};
if(d1)d1.onclick=function(){setPage(1);};
if(vp){
vp.onpointerdown=e=>{if(!e.isPrimary||e.target.closest?.('button'))return;sx=e.clientX;sy=e.clientY;drag=1;try{vp.setPointerCapture(e.pointerId);}catch(err){}};
vp.onpointerup=e=>{if(drag){drag=0;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy))setPage(dx<0?1:0);}};
vp.onpointercancel=()=>{drag=0;};
}
function fmt(ms){const t=Math.max(0,Math.floor(ms||0)),p=n=>String(Math.floor(n)).padStart(2,'0');return p(t/3600000)+':'+p((t%3600000)/60000)+':'+p((t%60000)/1000)+'.'+Math.floor((t%1000)/100);}
function getElapsed(n=Date.now()){return st.s===1?st.acc+Math.max(0,n-st.t0):st.acc;}
function deg(ms){return'rotate('+(((ms%60000)/60000)*360).toFixed(1)+' 80 80)';}
function paintClock(m){
const s=fmt(m);
if(s!==lastTxt){lastTxt=s;if(clk)clk.textContent=s;if(aclk)aclk.textContent=s;}
const d=deg(m);
if(d!==lastDeg){lastDeg=d;if(hb)hb.setAttribute('transform',d);}
const w=(!st.s||!st.laps?.length)?'':deg(Math.max(0,m-st.laps[0][2]));
if(w!==lastWdeg){
lastWdeg=w;
if(hw){
if(!w){hw.style.display='none';hw.setAttribute('transform','rotate(0 80 80)');}
else{hw.style.display='';hw.setAttribute('transform',w);}
}
}
}
function tick(){if(st.s===1&&!document.hidden){paintClock(getElapsed());raf=requestAnimationFrame(tick);}else raf=0;}
function startTick(){if(!raf&&st.s===1&&!document.hidden)raf=requestAnimationFrame(tick);}
function stopTick(){if(raf){cancelAnimationFrame(raf);raf=0;}}
function drawRows(el,list){
if(!el)return;
el.innerHTML=(list||[]).map(l=>'<div class="tr"><span>Lap '+l[0]+'</span><span>+'+fmt(l[1])+'</span><span>'+fmt(l[2])+'</span></div>').join('');
}
function renderLaps(){
const laps=st.laps||[],tot=laps.length;
if(tot===0){
if(atbl)atbl.style.display='none';
if(dtbl)dtbl.style.display='none';
if(pgr)pgr.style.display='none';
if(emptyDig)emptyDig.style.display='';
if(p0)p0.className='pg no-laps';
if(p1)p1.className='pg no-laps';
drawRows(l1,[]);
drawRows(l2,[]);
}else{
if(atbl)atbl.style.display='block';
if(dtbl)dtbl.style.display='block';
if(pgr)pgr.style.display='flex';
if(emptyDig)emptyDig.style.display='none';
if(p0)p0.className='pg';
if(p1)p1.className='pg';
drawRows(l1,laps.slice(0,4));
const pages=Math.max(1,Math.ceil(tot/8));
if(lapPg>=pages)lapPg=Math.max(0,pages-1);
drawRows(l2,laps.slice(lapPg*8,lapPg*8+8));
if(lpP)lpP.disabled=lapPg<=0;
if(lpN)lpN.disabled=(lapPg+1)*8>=tot;
if(lpI)lpI.textContent='Page '+(lapPg+1)+' / '+pages;
}
}
if(lpP)lpP.onclick=()=>{if(lapPg>0){lapPg--;renderLaps();}};
if(lpN)lpN.onclick=()=>{if(lapPg<Math.max(0,Math.ceil((st.laps?.length||0)/8)-1)){lapPg++;renderLaps();}};
function persist(){try{localStorage.setItem(K,JSON.stringify(st));}catch(e){}}
function setBtn(b,t,c,d){if(!b)return;b.textContent=t;b.className=c;b.disabled=d;}
function renderUI(){
if(st.s===1){paintClock(getElapsed());startTick();}
else{stopTick();paintClock(st.s===2?st.acc:0);}
setBtn(b1,st.s===1?'Stop':st.s===2?'Resume':'Start',st.s===1?'b-red':'b-pri',false);
setBtn(b2,st.s===2?'Reset':'Lap','b-sec',!st.s);
renderLaps();
}
function act(type){
try{TW?.HapticFeedback?.impactOccurred?.('light');}catch(e){}
const now=Date.now(),r=(st.r||1)+1;
if(type==='start'&&!st.s){st={s:1,t0:now,acc:0,lc:0,laps:[],r};lapPg=0;}
else if(type==='stop'&&st.s===1){st={...st,s:2,t0:0,acc:getElapsed(now),r};}
else if(type==='resume'&&st.s===2){st={...st,s:1,t0:now,r};}
else if(type==='lap'&&st.s===1){const tot=getElapsed(now),split=Math.max(0,tot-(st.laps[0]?.[2]||0)),num=(st.lc||0)+1;st={...st,lc:num,laps:[[num,split,tot],...st.laps].slice(0,100),r};lapPg=0;}
else if(type==='reset'&&st.s!==1){st={s:0,t0:0,acc:0,lc:0,laps:[],r};lapPg=0;}
else return;
persist();renderUI();
}
if(b1)b1.onclick=function(){if(!b1.disabled)act(!st.s?'start':st.s===1?'stop':'resume');};
if(b2)b2.onclick=function(){if(!b2.disabled)act(st.s===1?'lap':'reset');};
const onVis=()=>{if(!document.hidden&&st.s===1){paintClock(getElapsed());startTick();}else stopTick();};
document.addEventListener('visibilitychange',onVis);
try{TW?.onEvent?.('activated',onVis);TW?.onEvent?.('deactivated',stopTick);}catch(e){}
try{if(sessionStorage.getItem('tw_sw_pg')==='1')setPage(1);}catch(e){}
renderUI();
try{TW?.ready?.();}catch(e){}`;
