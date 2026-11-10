/* Grove — Step 1 extraction. Relocated as-is from the original single-file artifact.
   No logic changed in this step; persistence still uses window.storage (Claude artifact API)
   pending Step 2 (IndexedDB migration). */

/* ================= UTIL ================= */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function pad(n){ return n<10 ? '0'+n : ''+n; }
function fmt(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function todayStr(){ return fmt(new Date()); }
function parseDate(s){ const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(s,n){ const d = parseDate(s); d.setDate(d.getDate()+n); return fmt(d); }
function niceDate(s){ if(!s) return ''; const d = parseDate(s); return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }
function niceDateLong(s){ const d = parseDate(s); return d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); }
function daysBetween(a,b){ return Math.round((parseDate(b)-parseDate(a))/86400000); }
function esc(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function minutesToLabel(m){ const h=Math.floor(m/60), mm=m%60; return h>0 ? (h+'h '+mm+'m') : (mm+'m'); }
function monthLabel(y,m){ return new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}); }
function subjName(id){ const s = DB.subjects.find(x=>x.id===id); return s ? s.name : ''; }
function subjColor(id){ const s = DB.subjects.find(x=>x.id===id); return s ? s.color : '#a7bb95'; }
const PALETTE = ['#a7bb95','#cf9f5f','#b5715a','#8fb4c9','#c9a3c9','#7fae86','#d4b483'];
