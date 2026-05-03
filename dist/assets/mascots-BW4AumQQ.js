var v=Object.defineProperty;var m=(c,e,l)=>e in c?v(c,e,{enumerable:!0,configurable:!0,writable:!0,value:l}):c[e]=l;var r=(c,e,l)=>m(c,typeof e!="symbol"?e+"":e,l);class L{constructor(e,l,t={}){r(this,"state","idle");r(this,"rafId",null);r(this,"startTime",0);r(this,"lastPhaseIndex",-1);r(this,"sessionDurationMs");r(this,"cycleDurationMs");r(this,"callbacks");r(this,"pattern");this.pattern=e,this.sessionDurationMs=l*1e3,this.cycleDurationMs=e.phases.reduce((a,i)=>a+i.seconds*1e3,0),this.callbacks=t}get currentState(){return this.state}start(){this.state==="idle"&&(this.state="running",this.startTime=performance.now(),this.rafId=requestAnimationFrame(e=>this.tick(e)))}abort(){var e,l;this.state==="running"&&(this.state="aborted",this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null),(l=(e=this.callbacks).onAborted)==null||l.call(e))}tick(e){var s,o,y,h,p,d,k,u;if(this.state!=="running")return;const l=e-this.startTime;if(l>=this.sessionDurationMs){this.state="complete",(o=(s=this.callbacks).onTick)==null||o.call(s,1,1),(h=(y=this.callbacks).onComplete)==null||h.call(y);return}const{phaseIndex:t,phaseProgress:a}=this.resolvePhase(l),i=l/this.sessionDurationMs;t!==this.lastPhaseIndex&&(this.lastPhaseIndex=t,(d=(p=this.callbacks).onPhaseChange)==null||d.call(p,this.pattern.phases[t].label,t)),(u=(k=this.callbacks).onTick)==null||u.call(k,a,i),this.rafId=requestAnimationFrame(b=>this.tick(b))}resolvePhase(e){const l=e%this.cycleDurationMs;let t=0;for(let i=0;i<this.pattern.phases.length;i++){const s=this.pattern.phases[i].seconds*1e3;if(l<t+s){const o=(l-t)/s;return{phaseIndex:i,phaseProgress:o}}t+=s}return{phaseIndex:this.pattern.phases.length-1,phaseProgress:1}}}const n=1,f=1.15;function M(c,e){switch(c){case"inhale":return n+(f-n)*e;case"holdIn":return f;case"exhale":return f-(f-n)*e;case"holdOut":return n}}class N{constructor(e){r(this,"auraEl",null);r(this,"counterEl",null);r(this,"reducedMotion");r(this,"currentPhase","inhale");r(this,"phaseSecondsLeft",0);r(this,"phaseSeconds",0);this.reducedMotion=e}attach(e,l){this.auraEl=e,this.counterEl=l}onPhaseChange(e,l){this.currentPhase=e,this.phaseSeconds=l,this.phaseSecondsLeft=l,this.reducedMotion&&this.counterEl&&(this.counterEl.textContent=String(Math.ceil(l)))}onTick(e,l){if(this.phaseSecondsLeft=this.phaseSeconds*(1-e),this.reducedMotion){this.counterEl&&(this.counterEl.textContent=String(Math.ceil(this.phaseSecondsLeft)));return}if(this.auraEl){const t=M(this.currentPhase,e);this.auraEl.setAttribute("r",String(54*t))}}reset(){this.auraEl&&this.auraEl.setAttribute("r","54"),this.counterEl&&(this.counterEl.textContent="")}}const x={id:"box_4_4_4_4",label:"Box (4-4-4-4)",phases:[{label:"inhale",seconds:4},{label:"holdIn",seconds:4},{label:"exhale",seconds:4},{label:"holdOut",seconds:4}]},w={id:"coherent_5_5",label:"Coherent (5-5)",phases:[{label:"inhale",seconds:5},{label:"exhale",seconds:5}]},E={[x.id]:x,[w.id]:w};function O(c){return E[c]??x}const P=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="65" r="38" fill="#f5c2a0"/>
  <ellipse cx="60" cy="65" rx="24" ry="22" fill="#fff8f0"/>
  <polygon points="25,38 35,55 15,55" fill="#f5c2a0"/>
  <polygon points="95,38 105,55 85,55" fill="#f5c2a0"/>
  <circle cx="48" cy="62" r="6" fill="#333"/>
  <circle cx="72" cy="62" r="6" fill="#333"/>
  <circle cx="50" cy="60" r="2" fill="#fff"/>
  <circle cx="74" cy="60" r="2" fill="#fff"/>
  <ellipse cx="60" cy="72" rx="5" ry="3" fill="#e8a090"/>
  <path d="M52,78 Q60,84 68,78" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="38" y1="66" x2="20" y2="62" stroke="#888" stroke-width="1.2"/>
  <line x1="38" y1="70" x2="20" y2="70" stroke="#888" stroke-width="1.2"/>
  <line x1="38" y1="74" x2="20" y2="76" stroke="#888" stroke-width="1.2"/>
  <line x1="82" y1="66" x2="100" y2="62" stroke="#888" stroke-width="1.2"/>
  <line x1="82" y1="70" x2="100" y2="70" stroke="#888" stroke-width="1.2"/>
  <line x1="82" y1="74" x2="100" y2="76" stroke="#888" stroke-width="1.2"/>
</svg>`,A=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="62" r="40" fill="#e8c99a"/>
  <ellipse cx="60" cy="68" rx="22" ry="18" fill="#fff5e6"/>
  <ellipse cx="32" cy="50" rx="10" ry="20" fill="#d4a97a" transform="rotate(-15 32 50)"/>
  <ellipse cx="88" cy="50" rx="10" ry="20" fill="#d4a97a" transform="rotate(15 88 50)"/>
  <path d="M48,62 Q48,67 54,67" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M72,62 Q72,67 66,67" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="74" rx="9" ry="6" fill="#c8856a"/>
  <ellipse cx="60" cy="71" rx="5" ry="3" fill="#b07060"/>
  <path d="M52,82 Q60,88 68,82" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="42" y1="70" x2="24" y2="66" stroke="#aaa" stroke-width="1.2"/>
  <line x1="42" y1="74" x2="24" y2="74" stroke="#aaa" stroke-width="1.2"/>
  <line x1="78" y1="70" x2="96" y2="66" stroke="#aaa" stroke-width="1.2"/>
  <line x1="78" y1="74" x2="96" y2="74" stroke="#aaa" stroke-width="1.2"/>
</svg>`,I=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="70" rx="44" ry="32" fill="#b8956a"/>
  <ellipse cx="60" cy="68" rx="28" ry="20" fill="#d4b48a"/>
  <ellipse cx="38" cy="42" rx="8" ry="10" fill="#b8956a"/>
  <ellipse cx="82" cy="42" rx="8" ry="10" fill="#b8956a"/>
  <circle cx="50" cy="62" r="5" fill="#222"/>
  <circle cx="70" cy="62" r="5" fill="#222"/>
  <circle cx="51" cy="61" r="1.5" fill="#fff"/>
  <circle cx="71" cy="61" r="1.5" fill="#fff"/>
  <ellipse cx="60" cy="76" rx="12" ry="7" fill="#a07850"/>
  <ellipse cx="60" cy="73" rx="6" ry="3.5" fill="#8a6040"/>
  <path d="M53,82 Q60,87 67,82" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`,S=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="65" r="36" fill="#d2622a"/>
  <ellipse cx="60" cy="70" rx="20" ry="17" fill="#f5dcc8"/>
  <ellipse cx="30" cy="38" rx="9" ry="11" fill="#d2622a"/>
  <ellipse cx="30" cy="36" rx="5" ry="7" fill="#fff0e0"/>
  <ellipse cx="90" cy="38" rx="9" ry="11" fill="#d2622a"/>
  <ellipse cx="90" cy="36" rx="5" ry="7" fill="#fff0e0"/>
  <circle cx="50" cy="60" r="6" fill="#1a1a1a"/>
  <circle cx="70" cy="60" r="6" fill="#1a1a1a"/>
  <circle cx="52" cy="58" r="2" fill="#fff"/>
  <circle cx="72" cy="58" r="2" fill="#fff"/>
  <ellipse cx="60" cy="73" rx="5" ry="3.5" fill="#1a1a1a"/>
  <path d="M52,80 Q60,86 68,80" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="45" cy="63" rx="8" ry="4" fill="#b84010" opacity="0.5"/>
  <ellipse cx="75" cy="63" rx="8" ry="4" fill="#b84010" opacity="0.5"/>
  <line x1="40" y1="67" x2="22" y2="63" stroke="#884010" stroke-width="1.2"/>
  <line x1="40" y1="71" x2="22" y2="71" stroke="#884010" stroke-width="1.2"/>
  <line x1="80" y1="67" x2="98" y2="63" stroke="#884010" stroke-width="1.2"/>
  <line x1="80" y1="71" x2="98" y2="71" stroke="#884010" stroke-width="1.2"/>
</svg>`,_=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="42" cy="38" rx="10" ry="26" fill="#f0ece8"/>
  <ellipse cx="42" cy="38" rx="5" ry="20" fill="#f4b8c0"/>
  <ellipse cx="78" cy="38" rx="10" ry="26" fill="#f0ece8"/>
  <ellipse cx="78" cy="38" rx="5" ry="20" fill="#f4b8c0"/>
  <circle cx="60" cy="70" r="34" fill="#f5f0ec"/>
  <ellipse cx="60" cy="72" rx="20" ry="17" fill="#fff"/>
  <circle cx="50" cy="64" r="6" fill="#3a2a8a"/>
  <circle cx="70" cy="64" r="6" fill="#3a2a8a"/>
  <circle cx="52" cy="62" r="2" fill="#fff"/>
  <circle cx="72" cy="62" r="2" fill="#fff"/>
  <ellipse cx="60" cy="74" rx="5" ry="3" fill="#f4a0b0"/>
  <path d="M53,80 Q60,86 67,80" stroke="#888" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="40" y1="70" x2="22" y2="66" stroke="#ccc" stroke-width="1.2"/>
  <line x1="40" y1="74" x2="22" y2="74" stroke="#ccc" stroke-width="1.2"/>
  <line x1="80" y1="70" x2="98" y2="66" stroke="#ccc" stroke-width="1.2"/>
  <line x1="80" y1="74" x2="98" y2="74" stroke="#ccc" stroke-width="1.2"/>
</svg>`,B=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="68" rx="32" ry="38" fill="#1a1a2e"/>
  <ellipse cx="60" cy="76" rx="18" ry="24" fill="#f5f0e8"/>
  <ellipse cx="38" cy="58" rx="6" ry="12" fill="#1a1a2e" transform="rotate(-20 38 58)"/>
  <ellipse cx="82" cy="58" rx="6" ry="12" fill="#1a1a2e" transform="rotate(20 82 58)"/>
  <circle cx="52" cy="56" r="7" fill="#f5f0e8"/>
  <circle cx="68" cy="56" r="7" fill="#f5f0e8"/>
  <circle cx="52" cy="56" r="4.5" fill="#1a1a2e"/>
  <circle cx="68" cy="56" r="4.5" fill="#1a1a2e"/>
  <circle cx="53" cy="55" r="1.5" fill="#fff"/>
  <circle cx="69" cy="55" r="1.5" fill="#fff"/>
  <ellipse cx="60" cy="66" rx="7" ry="4" fill="#e8a020"/>
  <ellipse cx="44" cy="98" rx="9" ry="4" fill="#e8a020"/>
  <ellipse cx="76" cy="98" rx="9" ry="4" fill="#e8a020"/>
</svg>`,T=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="72" rx="36" ry="28" fill="#f4a8c0"/>
  <ellipse cx="60" cy="68" rx="22" ry="18" fill="#ffd0e4"/>
  <ellipse cx="28" cy="50" rx="5" ry="14" fill="#f48aaa" transform="rotate(-20 28 50)"/>
  <ellipse cx="28" cy="40" rx="4" ry="8" fill="#f48aaa" transform="rotate(-30 28 40)"/>
  <ellipse cx="22" cy="45" rx="3" ry="10" fill="#f48aaa" transform="rotate(-10 22 45)"/>
  <ellipse cx="92" cy="50" rx="5" ry="14" fill="#f48aaa" transform="rotate(20 92 50)"/>
  <ellipse cx="92" cy="40" rx="4" ry="8" fill="#f48aaa" transform="rotate(30 92 40)"/>
  <ellipse cx="98" cy="45" rx="3" ry="10" fill="#f48aaa" transform="rotate(10 98 45)"/>
  <circle cx="50" cy="64" r="6" fill="#333"/>
  <circle cx="70" cy="64" r="6" fill="#333"/>
  <circle cx="52" cy="62" r="2" fill="#fff"/>
  <circle cx="72" cy="62" r="2" fill="#fff"/>
  <path d="M52,76 Q60,82 68,76" stroke="#d06080" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="70" r="3" fill="#f090b0" opacity="0.7"/>
  <circle cx="72" cy="70" r="3" fill="#f090b0" opacity="0.7"/>
</svg>`,C=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="68" r="34" fill="#6abf69"/>
  <ellipse cx="60" cy="74" rx="20" ry="16" fill="#a8d8a8"/>
  <ellipse cx="38" cy="46" rx="14" ry="10" fill="#6abf69"/>
  <ellipse cx="82" cy="46" rx="14" ry="10" fill="#6abf69"/>
  <circle cx="38" cy="44" r="7" fill="#fff"/>
  <circle cx="82" cy="44" r="7" fill="#fff"/>
  <circle cx="38" cy="44" r="4.5" fill="#1a3a1a"/>
  <circle cx="82" cy="44" r="4.5" fill="#1a3a1a"/>
  <circle cx="39" cy="43" r="1.5" fill="#fff"/>
  <circle cx="83" cy="43" r="1.5" fill="#fff"/>
  <path d="M50,78 Q60,86 70,78" stroke="#2a6a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M36,88 Q40,80 48,84" stroke="#4a8a4a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M84,88 Q80,80 72,84" stroke="#4a8a4a" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`,Q=`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="70" rx="40" ry="28" fill="#8b6343"/>
  <ellipse cx="60" cy="68" rx="25" ry="18" fill="#c8a070"/>
  <ellipse cx="30" cy="46" rx="10" ry="13" fill="#8b6343"/>
  <ellipse cx="90" cy="46" rx="10" ry="13" fill="#8b6343"/>
  <circle cx="50" cy="62" r="6" fill="#2a1a0a"/>
  <circle cx="70" cy="62" r="6" fill="#2a1a0a"/>
  <circle cx="52" cy="60" r="2" fill="#fff"/>
  <circle cx="72" cy="60" r="2" fill="#fff"/>
  <ellipse cx="60" cy="72" rx="10" ry="6" fill="#a07850"/>
  <ellipse cx="60" cy="70" rx="5" ry="3" fill="#7a5830"/>
  <path d="M53,80 Q60,86 67,80" stroke="#555" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="42" y1="66" x2="24" y2="62" stroke="#705030" stroke-width="1.2"/>
  <line x1="42" y1="70" x2="24" y2="70" stroke="#705030" stroke-width="1.2"/>
  <line x1="78" y1="66" x2="96" y2="62" stroke="#705030" stroke-width="1.2"/>
  <line x1="78" y1="70" x2="96" y2="70" stroke="#705030" stroke-width="1.2"/>
  <ellipse cx="40" cy="86" rx="12" ry="7" fill="#7a5430" transform="rotate(-15 40 86)"/>
  <ellipse cx="80" cy="86" rx="12" ry="7" fill="#7a5430" transform="rotate(15 80 86)"/>
</svg>`,g={cat:P,dog:A,capybara:I,red_panda:S,bunny:_,penguin:B,axolotl:T,zen_frog:C,otter:Q};function R(c){return g[c]??g.cat}export{L as B,N as P,O as a,R as g};
