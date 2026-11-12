/**
 * Client-side state machine (150 laps), rAF loop, swipe & pagination script.
 */
export const TIMER_CLIENT_JS = `const TW=window.TelegramWidget,K='tw_sw_v1',$=i=>document.getElementById(i);
try{TW?.setResizeAnchor?.('bottom')}catch(e){}
function parseState(v){try{const p=typeof v==='string'?JSON.parse(v):v;if(p&&typeof p==='object')return{s:+p.s||0,t0:+p.t0||0,acc:+p.acc||0,lc:+p.lc||0,laps:Array.isArray(p.laps)?p.laps.slice(0,150):[],r:+p.r||1}}catch(e){}return null}
function loadInitialState(){return parseState(localStorage.getItem(K))||parseState(TW?.chatData||TW?.publicData)||{s:0,t0:0,acc:0,lc:0,laps:[],r:1}}
let st=loadInitialState(),raf=0,lapPg=0,pg=0,sx=0,sy=0,drag=0;
const vp=$('vp'),trk=$('trk'),d0=$('d0'),d1=$('d1'),clk=$('clk'),aclk=$('aclk'),hb=$('hb'),hw=$('hw'),l1=$('l1'),l2=$('l2'),lpP=$('lpPrev'),lpN=$('lpNext'),lpI=$('lpInfo'),b1=$('b1'),b2=$('b2');
function setPage(p){pg=p?1:0;trk.style.transform=pg?'translateX(-50%)':'translateX(0)';d0.className=pg?'tab':'tab on';d1.className=pg?'tab on':'tab';try{sessionStorage.setItem('tw_sw_pg',pg)}catch(e){}}
d0.onclick=()=>setPage(0);d1.onclick=()=>setPage(1);
vp.onpointerdown=e=>{if(e.isPrimary){sx=e.clientX;sy=e.clientY;drag=1}};
vp.onpointerup=e=>{if(drag){drag=0;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy))setPage(dx<0?1:0)}};
vp.onpointercancel=()=>drag=0;
function fmt(ms){const t=Math.max(0,Math.floor(ms||0)),p=n=>String(Math.floor(n)).padStart(2,'0');return p(t/3600000)+':'+p((t%3600000)/60000)+':'+p((t%60000)/1000)+'.'+Math.floor((t%1000)/100)}
function getElapsed(n=Date.now()){return st.s===1?st.acc+Math.max(0,n-st.t0):st.acc}
function deg(ms){return'rotate('+(((ms%60000)/60000)*360).toFixed(1)+' 80 80)'}
function paintClock(m){
clk.textContent=aclk.textContent=fmt(m);
hb.setAttribute('transform',deg(m));
if(!st.s||!st.laps?.length){hw.style.display='none';hw.setAttribute('transform','rotate(0 80 80)')}
else{hw.style.display='';hw.setAttribute('transform',deg(Math.max(0,m-st.laps[0][2])))}
}
function tick(){if(st.s===1&&!document.hidden){paintClock(getElapsed());raf=requestAnimationFrame(tick)}else raf=0}
function startTick(){if(!raf&&st.s===1&&!document.hidden)raf=requestAnimationFrame(tick)}
function stopTick(){if(raf){cancelAnimationFrame(raf);raf=0}}
function drawRows(el,list,slots){
let h='';
for(let i=0;i<slots;i++){const l=list[i];h+=l?'<div class="tr"><span>Lap '+l[0]+'</span><span>+'+fmt(l[1])+'</span><span>'+fmt(l[2])+'</span></div>':'<div class="tr"><span>—</span><span>—</span><span>—</span></div>'}
el.innerHTML=h;
}
function renderLaps(){
const laps=st.laps||[];drawRows(l1,laps.slice(0,4),4);
const tot=laps.length,pages=Math.max(1,Math.ceil(tot/10));
if(lapPg>=pages)lapPg=Math.max(0,pages-1);
drawRows(l2,laps.slice(lapPg*10,lapPg*10+10),10);
lpP.disabled=lapPg<=0;lpN.disabled=(lapPg+1)*10>=tot;lpI.textContent='Page '+(lapPg+1)+' / '+pages;
}
lpP.onclick=()=>{if(lapPg>0){lapPg--;renderLaps()}};
lpN.onclick=()=>{if(lapPg<Math.max(0,Math.ceil((st.laps?.length||0)/10)-1)){lapPg++;renderLaps()}};
function persist(){try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}}
function setBtn(b,t,c,d,a){b.textContent=t;b.className=c;b.disabled=d;b.dataset.act=a}
function renderUI(){
if(st.s===0){stopTick();paintClock(0);setBtn(b1,'Start','b-pri',false,'start');setBtn(b2,'Lap','b-sec',true,'')}
else if(st.s===1){setBtn(b1,'Stop','b-red',false,'stop');setBtn(b2,'Lap','b-sec',false,'lap');paintClock(getElapsed());startTick()}
else if(st.s===2){stopTick();paintClock(st.acc);setBtn(b1,'Resume','b-pri',false,'resume');setBtn(b2,'Reset','b-sec',false,'reset')}
renderLaps();
}
function act(type){
try{TW?.HapticFeedback?.impactOccurred?.('light')}catch(e){}
const now=Date.now(),r=(st.r||1)+1;
if(type==='start'&&!st.s){st={s:1,t0:now,acc:0,lc:0,laps:[],r};lapPg=0}
else if(type==='stop'&&st.s===1){st={...st,s:2,t0:0,acc:getElapsed(now),r}}
else if(type==='resume'&&st.s===2){st={...st,s:1,t0:now,r}}
else if(type==='lap'&&st.s===1){const tot=getElapsed(now),split=Math.max(0,tot-(st.laps[0]?.[2]||0)),num=(st.lc||0)+1;st={...st,lc:num,laps:[[num,split,tot],...st.laps].slice(0,150),r};lapPg=0}
else if(type==='reset'&&st.s!==1){st={s:0,t0:0,acc:0,lc:0,laps:[],r};lapPg=0}
else return;
persist();renderUI();
}
b1.onclick=()=>{if(!b1.disabled)act(b1.dataset.act)};
b2.onclick=()=>{if(!b2.disabled)act(b2.dataset.act)};
const onVis=()=>{if(!document.hidden&&st.s===1){paintClock(getElapsed());startTick()}else stopTick()};
document.addEventListener('visibilitychange',onVis);
try{TW?.onEvent?.('activated',onVis);TW?.onEvent?.('deactivated',stopTick)}catch(e){}
try{if(sessionStorage.getItem('tw_sw_pg')==='1')setPage(1)}catch(e){}
renderUI();
try{TW?.ready?.()}`;
