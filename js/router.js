/* Grove — Step 1 extraction. Relocated as-is from the original single-file artifact.
   No logic changed in this step; persistence still uses window.storage (Claude artifact API)
   pending Step 2 (IndexedDB migration). */

/* ================= NAV / ROUTER ================= */
const NAV = [
  {id:'dashboard', label:'Home', icon:'ic-home'},
  {id:'academics', label:'Academics', icon:'ic-cap'},
  {id:'tasks', label:'Tasks', icon:'ic-check2'},
  {id:'habits', label:'Habits', icon:'ic-sprout'},
  {id:'study', label:'Study', icon:'ic-clock'},
  {id:'journal', label:'Journal', icon:'ic-feather'},
  {id:'finance', label:'Finance', icon:'ic-wallet'},
  {id:'life', label:'Life Center', icon:'ic-heart'},
  {id:'calendar', label:'Calendar', icon:'ic-cal'},
  {id:'stats', label:'Stats', icon:'ic-bars'},
];
const TITLES = {dashboard:'Home', academics:'Academics', tasks:'Tasks', habits:'Habits', study:'Study',
  journal:'Journal', finance:'Finance', life:'Life Center', calendar:'Calendar', stats:'Stats', settings:'Settings'};

function renderNav(active){
  document.getElementById('navlist').innerHTML = NAV.map(n=>`
    <div class="navitem ${active===n.id?'active':''}" data-view="${n.id}">
      <svg><use href="#${n.icon}"/></svg><span>${n.label}</span>
    </div>`).join('');
  document.getElementById('nav-settings').classList.toggle('active', active==='settings');
}
function go(view){
  location.hash = '#'+view;
}
async function route(){
  const view = (location.hash||'#dashboard').slice(1).split('/')[0];
  renderNav(view);
  document.getElementById('pagetitle').textContent = TITLES[view] || 'Home';
  const el = document.getElementById('view');
  const renderers = {
    dashboard: renderDashboard, academics: renderAcademics, tasks: renderTasks, habits: renderHabits,
    study: renderStudy, journal: renderJournal, finance: renderFinance, life: renderLife,
    calendar: renderCalendar, stats: renderStats, settings: renderSettings
  };
  el.innerHTML = (renderers[view]||renderDashboard)();
  wireView(view);
}
window.addEventListener('hashchange', route);

document.getElementById('today-pill').textContent = new Date().toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'});

document.getElementById('navlist').addEventListener('click', e=>{
  const item = e.target.closest('.navitem'); if(!item) return; go(item.dataset.view);
});
document.getElementById('nav-settings').addEventListener('click', ()=> go('settings'));
