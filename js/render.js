/* Grove — Step 1 extraction. Relocated as-is from the original single-file artifact.
   No logic changed in this step; persistence still uses window.storage (Claude artifact API)
   pending Step 2 (IndexedDB migration). */

/* ================= DASHBOARD ================= */
function renderDashboard(){
  const today = todayStr();
  const hour = new Date().getHours();
  const greet = hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';

  const todaysTasks = DB.tasks.filter(t=>!t.done && t.dueDate===today);
  const todaysAssignments = DB.assignments.filter(a=>a.status!=='submitted' && a.status!=='graded' && a.dueDate===today);
  const overdueTasks = DB.tasks.filter(t=>!t.done && t.dueDate && t.dueDate<today);

  const dueHabits = DB.habits.filter(h=>h.active && habitDueOn(h,new Date()));
  const doneHabits = dueHabits.filter(h=>{ const l = DB.habitLogs.find(x=>x.habitId===h.id&&x.date===today); return l&&l.done; });

  const todaysSessions = DB.studySessions.filter(s=>s.date===today);
  const studyMins = todaysSessions.reduce((a,s)=>a+s.duration,0);

  const journalToday = DB.journalEntries.find(j=>j.date===today) || ensureJournalEntry(today);

  const upcoming = [
    ...DB.assignments.filter(a=>a.status!=='submitted'&&a.status!=='graded'&&a.dueDate>today).map(a=>({...a,_kind:a.type})),
    ...DB.tasks.filter(t=>!t.done&&t.dueDate>today).map(t=>({...t,_kind:'task',title:t.title,dueDate:t.dueDate}))
  ].sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,6);

  const monthStart = today.slice(0,7);
  const monthExpenses = DB.expenses.filter(e=>e.date.startsWith(monthStart) && e.type==='expense');
  const monthTotal = monthExpenses.reduce((a,e)=>a+e.amount,0);
  const cur = DB.settings.currency||'$';

  return `
  <div class="section-head" style="margin-top:0"><h2>${greet}, ${esc(DB.settings.name||'there')}.</h2><span class="muted">${niceDateLong(today)}</span></div>

  <div class="grid grid-2">
    <div class="card">
      <div class="card-title"><h3>Today's focus</h3><span class="tag">${todaysTasks.length+todaysAssignments.length} due</span></div>
      ${ (todaysTasks.length+todaysAssignments.length+overdueTasks.length)===0 ? emptyState('ic-leaf','Nothing due today. Enjoy the clear stretch.') :
      `<div class="rowlist">
        ${overdueTasks.map(t=>taskRow(t,true)).join('')}
        ${todaysAssignments.map(a=>`<div class="row"><div class="check" data-act="assign-status" data-id="${a.id}"></div>
          <div class="row-main"><div class="row-title">${esc(a.title)}</div><div class="row-sub">${subjName(a.subjectId)} · ${a.type}</div></div>
          <span class="pill amber">today</span></div>`).join('')}
        ${todaysTasks.map(t=>taskRow(t,false)).join('')}
      </div>`}
      <div class="deco-sprig" style="width:90px;height:90px"><svg width="100%" height="100%"><use href="#ic-sprig"/></svg></div>
    </div>

    <div class="card">
      <div class="card-title"><h3>Habits today</h3><span class="tag">${doneHabits.length}/${dueHabits.length}</span></div>
      ${dueHabits.length===0 ? emptyState('ic-sprout','No habits set up yet.', 'habits','Plant a habit') :
      `<div class="rowlist">${dueHabits.map(h=>habitRow(h,today)).join('')}</div>`}
    </div>

    <div class="card">
      <div class="card-title"><h3>Study today</h3><span class="tag">${minutesToLabel(studyMins)}</span></div>
      ${todaysSessions.length===0 ? `<p class="dim" style="font-size:13px;margin:0 0 12px">No sessions logged yet today.</p>` :
        `<div class="rowlist">${todaysSessions.slice(0,4).map(s=>`<div class="row"><span class="dot" style="background:${subjColor(s.subjectId)}"></span>
          <div class="row-main"><div class="row-title">${esc(subjName(s.subjectId)||'General')}</div><div class="row-sub">${s.method||''} · ${minutesToLabel(s.duration)}</div></div></div>`).join('')}</div>`}
      <button class="btn btn-primary" style="margin-top:10px;width:100%;justify-content:center" data-act="goto" data-view="study"><svg><use href="#ic-play"/></svg>Start a session</button>
    </div>

    <div class="card">
      <div class="card-title"><h3>Today's page</h3><span class="tag">journal</span></div>
      <p class="dim" style="font-size:13.5px;font-style:italic;margin:0 0 10px">${esc(journalToday.prompt)}</p>
      <p style="font-size:13.5px;color:${journalToday.content?'var(--cream)':'var(--cream-faint)'};margin:0 0 12px">
        ${journalToday.content ? esc(journalToday.content).slice(0,140)+(journalToday.content.length>140?'…':'') : 'Not written yet — takes two minutes.'}</p>
      <button class="btn" style="width:100%;justify-content:center" data-act="goto" data-view="journal">Open journal</button>
    </div>
  </div>

  <div class="section-head"><h2>Coming up</h2><a class="muted" href="#calendar" style="font-size:13px">View calendar →</a></div>
  <div class="grid grid-2">
    <div class="card">
      ${upcoming.length===0 ? emptyState('ic-cal','Nothing on the horizon.') :
      `<div class="rowlist">${upcoming.map(u=>`<div class="row">
        <span class="pill ${daysBetween(today,u.dueDate)<=2?'amber':''}">${niceDate(u.dueDate)}</span>
        <div class="row-main"><div class="row-title">${esc(u.title)}</div><div class="row-sub">${u._kind==='task'?'Task':(subjName(u.subjectId)+' · '+u._kind)}</div></div>
      </div>`).join('')}</div>`}
    </div>
    <div class="card">
      <div class="card-title"><h3>This month</h3><span class="tag">spending</span></div>
      <div style="font-family:var(--serif);font-size:30px;margin-bottom:6px">${cur}${monthTotal.toFixed(2)}</div>
      <p class="muted" style="font-size:12.5px;margin:0">across ${monthExpenses.length} expense${monthExpenses.length===1?'':'s'} this month</p>
      <button class="btn" style="margin-top:12px" data-act="goto" data-view="finance">Open finance</button>
    </div>
  </div>
  `;
}
function emptyState(icon,text,gotoView,ctaLabel){
  return `<div class="empty"><svg><use href="#${icon}"/></svg><div>${text}</div>
    ${gotoView?`<button class="btn btn-ghost" style="margin-top:8px" data-act="goto" data-view="${gotoView}">${ctaLabel} →</button>`:''}</div>`;
}
function taskRow(t,overdue){
  return `<div class="row"><div class="check ${t.done?'on':''}" data-act="toggle-task" data-id="${t.id}">${t.done?'<svg><use href="#ic-check2"/></svg>':''}</div>
    <div class="row-main"><div class="row-title ${t.done?'done':''}">${esc(t.title)}</div><div class="row-sub">${t.category||''}</div></div>
    ${overdue?`<span class="pill clay">overdue</span>`:''}</div>`;
}
function habitRow(h,dateStr){
  const log = ensureHabitLog(h.id,dateStr);
  const streak = habitStreak(h);
  return `<div class="row"><div class="check check-round ${log.done?'on':''}" data-act="toggle-habit" data-id="${h.id}" data-date="${dateStr}">${log.done?'<svg><use href="#ic-check2"/></svg>':''}</div>
    <div class="row-main"><div class="row-title ${log.done?'done':''}">${esc(h.name)}</div></div>
    ${streak>0?`<span class="pill">${streak}d streak</span>`:''}</div>`;
}
function habitStreak(habit){
  let streak=0; let d = new Date(); let ds = fmt(d);
  const doneOn = (id,date)=>{ const l = DB.habitLogs.find(x=>x.habitId===id&&x.date===date); return l && l.done; };
  if(habitDueOn(habit,d) && !doneOn(habit.id,ds)){ d.setDate(d.getDate()-1); }
  for(let i=0;i<366;i++){
    ds = fmt(d);
    if(habitDueOn(habit,d)){
      if(doneOn(habit.id,ds)) streak++; else break;
    }
    d.setDate(d.getDate()-1);
  }
  return streak;
}

/* ================= TASKS ================= */
function renderTasks(){
  const open = DB.tasks.filter(t=>!t.done).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  const done = DB.tasks.filter(t=>t.done).slice(-40).reverse();
  const cats = DB.categories.task;
  return `
  <div class="formcard">
    <div class="field-row">
      <div class="field" style="flex:2"><label>Task</label><input type="text" id="nt-title" placeholder="e.g. Reply to advisor email"></div>
      <div class="field"><label>Due</label><input type="date" id="nt-date" value="${todayStr()}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Category</label><select id="nt-cat">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
      <div class="field"><label>Priority</label><select id="nt-pri"><option>Normal</option><option>High</option><option>Low</option></select></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="add-task-btn"><svg><use href="#ic-plus"/></svg>Add task</button></div>
  </div>

  <div class="section-head" style="margin-top:8px"><h2>Open — ${open.length}</h2></div>
  <div class="card">${open.length===0?emptyState('ic-check2','All clear. Nothing on the list.'):`<div class="rowlist">${open.map(t=>`
    <div class="row"><div class="check" data-act="toggle-task" data-id="${t.id}"></div>
    <div class="row-main"><div class="row-title">${esc(t.title)}</div>
      <div class="row-sub">${t.category||''}${t.dueDate?' · due '+niceDate(t.dueDate):''}</div></div>
    ${t.priority==='High'?'<span class="pill clay">high</span>':''}
    <button class="iconbtn" data-act="del-task" data-id="${t.id}"><svg><use href="#ic-trash"/></svg></button>
    </div>`).join('')}</div>`}</div>

  ${done.length? `<div class="section-head"><h2>Completed</h2></div>
  <div class="card">${done.map(t=>`<div class="row"><div class="check on" data-act="toggle-task" data-id="${t.id}"><svg><use href="#ic-check2"/></svg></div>
    <div class="row-main"><div class="row-title done">${esc(t.title)}</div></div>
    <button class="iconbtn" data-act="del-task" data-id="${t.id}"><svg><use href="#ic-trash"/></svg></button></div>`).join('')}</div>` : ''}
  `;
}

/* ================= HABITS ================= */
function renderHabits(){
  const cats = DB.categories.task;
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `
  <div class="formcard">
    <div class="field-row">
      <div class="field" style="flex:2"><label>Habit</label><input type="text" id="nh-name" placeholder="e.g. Read for 20 minutes"></div>
      <div class="field"><label>Category</label><select id="nh-cat">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Frequency</label>
      <div class="chiprow" id="nh-freq">
        <button class="chip on" data-val="daily">Every day</button>
        <button class="chip" data-val="weekdays">Weekdays</button>
        <button class="chip" data-val="custom">Custom days</button>
      </div>
    </div>
    <div class="field" id="nh-days-wrap" style="display:none"><label>Days</label>
      <div class="chiprow" id="nh-days">${dayNames.map((d,i)=>`<button class="chip" data-val="${i}">${d}</button>`).join('')}</div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="add-habit-btn"><svg><use href="#ic-plus"/></svg>Plant habit</button></div>
  </div>

  <div class="section-head" style="margin-top:8px"><h2>Your habits</h2></div>
  ${DB.habits.length===0? `<div class="card">${emptyState('ic-sprout','No habits yet — once you add one, daily check-ins appear automatically.')}</div>` :
  `<div class="grid grid-3">${DB.habits.map(h=>{
    const streak = habitStreak(h);
    const last30 = [...Array(14)].map((_,i)=>{
      const ds = addDays(todayStr(), -13+i);
      const due = habitDueOn(h, parseDate(ds));
      const l = DB.habitLogs.find(x=>x.habitId===h.id&&x.date===ds);
      return {ds, due, done: l&&l.done};
    });
    return `<div class="card">
      <div class="card-title"><h3>${esc(h.name)}</h3><button class="iconbtn" data-act="del-habit" data-id="${h.id}"><svg><use href="#ic-trash"/></svg></button></div>
      <p class="muted" style="font-size:12px;margin:0 0 10px">${h.frequency==='daily'?'Every day':h.frequency==='weekdays'?'Weekdays':'Custom'} · ${h.category||''}</p>
      <div style="display:flex;gap:4px;margin-bottom:10px">
        ${last30.map(d=>`<div title="${d.ds}" style="width:100%;height:16px;border-radius:4px;background:${!d.due?'transparent':d.done?'var(--forest)':'var(--bg-soft)'};border:1px solid ${!d.due?'transparent':'var(--border)'}"></div>`).join('')}
      </div>
      <span class="pill">${streak} day streak</span>
    </div>`;
  }).join('')}</div>`}
  `;
}

/* ================= STUDY ================= */
let timerInterval = null;
function renderStudy(){
  const today = todayStr();
  const sessions = DB.studySessions.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,25);
  const subs = DB.subjects;
  const methods = DB.categories.studyMethod;
  const running = DB.activeTimer;
  const weekAgo = addDays(today,-6);
  const weekMins = DB.studySessions.filter(s=>s.date>=weekAgo).reduce((a,s)=>a+s.duration,0);

  return `
  <div class="card" style="margin-bottom:20px">
    <div class="card-title"><h3>Session timer</h3><span class="tag">${minutesToLabel(weekMins)} this week</span></div>
    <div class="timer-wrap">
      <div>
        <div class="timer-display" id="timer-display">${running?elapsedLabel(running.startedAt):'00:00:00'}</div>
        <p class="muted" style="margin:4px 0 0;font-size:12.5px">${running?('Studying '+(subjName(running.subjectId)||'General')):'Not running'}</p>
      </div>
      ${!running ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
          <div class="field" style="margin:0"><label>Subject</label><select id="timer-subject"><option value="">General</option>${subs.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
          <div class="field" style="margin:0"><label>Method</label><select id="timer-method">${methods.map(m=>`<option>${esc(m)}</option>`).join('')}</select></div>
          <button class="btn btn-primary" id="timer-start"><svg><use href="#ic-play"/></svg>Start</button>
        </div>` : `<button class="btn btn-primary" id="timer-stop"><svg><use href="#ic-stop"/></svg>Stop &amp; log</button>`}
    </div>
  </div>

  <div class="section-head" style="margin-top:0"><h2>Log a past session</h2></div>
  <div class="formcard">
    <div class="field-row">
      <div class="field"><label>Subject</label><select id="ls-subject"><option value="">General</option>${subs.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Date</label><input type="date" id="ls-date" value="${today}"></div>
      <div class="field"><label>Minutes</label><input type="number" id="ls-mins" min="1" placeholder="45"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Method</label><select id="ls-method">${methods.map(m=>`<option>${esc(m)}</option>`).join('')}</select></div>
      <div class="field" style="flex:2"><label>Notes</label><input type="text" id="ls-notes" placeholder="What did you cover?"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="log-session-btn">Log session</button></div>
  </div>

  <div class="section-head"><h2>Recent sessions</h2></div>
  <div class="card">${sessions.length===0?emptyState('ic-clock','No sessions logged yet.'):`<div class="rowlist">${sessions.map(s=>`
    <div class="row"><span class="dot" style="background:${subjColor(s.subjectId)}"></span>
    <div class="row-main"><div class="row-title">${esc(subjName(s.subjectId)||'General')} <span class="muted">· ${s.method||''}</span></div>
    <div class="row-sub">${niceDate(s.date)} · ${minutesToLabel(s.duration)}${s.notes?' · '+esc(s.notes):''}</div></div>
    <button class="iconbtn" data-act="del-session" data-id="${s.id}"><svg><use href="#ic-trash"/></svg></button></div>`).join('')}</div>`}</div>
  `;
}
function elapsedLabel(startedAt){
  const s = Math.floor((Date.now()-startedAt)/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return pad(h)+':'+pad(m)+':'+pad(sec);
}

/* ================= JOURNAL ================= */
function renderJournal(){
  const today = todayStr();
  const entry = ensureJournalEntry(today);
  const past = DB.journalEntries.filter(j=>j.date!==today).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
  return `
  <div class="card" style="margin-bottom:20px">
    <div class="card-title"><h3>${niceDateLong(today)}</h3><span class="tag">today's page</span></div>
    <p class="dim" style="font-style:italic;font-size:14px;margin:0 0 12px">${esc(entry.prompt)}</p>
    <textarea id="journal-today" style="width:100%;min-height:160px;background:var(--bg-soft);border:1px solid var(--border-hi);border-radius:var(--r-sm);padding:12px;color:var(--cream)" placeholder="Write freely…">${esc(entry.content)}</textarea>
    <div class="form-actions"><button class="btn btn-primary" id="save-journal-btn">Save entry</button></div>
  </div>

  <div class="section-head" style="margin-top:0"><h2>Past entries</h2></div>
  ${past.length===0?`<div class="card">${emptyState('ic-feather','Your past pages will collect here.')}</div>`:
  `<div class="rowlist" style="display:flex;flex-direction:column;gap:10px">${past.map(j=>`
    <div class="card" style="padding:14px 18px">
      <div class="card-title" style="margin-bottom:6px"><h3 style="font-size:13.5px">${niceDate(j.date)}</h3></div>
      <p class="muted" style="font-size:12px;font-style:italic;margin:0 0 6px">${esc(j.prompt)}</p>
      <p style="font-size:13.5px;margin:0;white-space:pre-wrap">${j.content?esc(j.content):'<span class="muted">— left blank —</span>'}</p>
    </div>`).join('')}</div>`}
  `;
}

/* ================= ACADEMICS ================= */
function renderAcademics(){
  const sub = (location.hash.split('/')[1]) || 'overview';
  const tabs = [['overview','Overview'],['subjects','Subjects'],['work','Assignments'],['schedule','Schedule'],['semesters','Semesters']];
  let body = '';
  if(sub==='overview') body = academicsOverview();
  else if(sub==='subjects') body = academicsSubjects();
  else if(sub==='work') body = academicsWork();
  else if(sub==='schedule') body = academicsSchedule();
  else if(sub==='semesters') body = academicsSemesters();
  return `<div class="tabs">${tabs.map(([id,label])=>`<a class="tab ${sub===id?'active':''}" href="#academics/${id}">${label}</a>`).join('')}</div>${body}`;
}
function academicsOverview(){
  const activeSem = DB.semesters.find(s=>s.active);
  const credits = activeSem ? DB.subjects.filter(s=>s.semesterId===activeSem.id).reduce((a,s)=>a+(Number(s.credits)||0),0) : 0;
  const today = todayStr();
  const upcoming = DB.assignments.filter(a=>a.status!=='submitted'&&a.status!=='graded').sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,8);
  return `
  <div class="grid grid-3" style="margin-bottom:20px">
    <div class="card"><div class="card-title"><h3>Active semester</h3></div><div style="font-family:var(--serif);font-size:22px">${activeSem?esc(activeSem.name):'—'}</div></div>
    <div class="card"><div class="card-title"><h3>Credits enrolled</h3></div><div style="font-family:var(--serif);font-size:22px">${credits}</div></div>
    <div class="card"><div class="card-title"><h3>Subjects</h3></div><div style="font-family:var(--serif);font-size:22px">${DB.subjects.filter(s=>!activeSem||s.semesterId===activeSem.id).length}</div></div>
  </div>
  <div class="section-head" style="margin-top:0"><h2>Upcoming work</h2></div>
  <div class="card">${upcoming.length===0?emptyState('ic-cap','Nothing on the academic radar.'):`<div class="rowlist">${upcoming.map(a=>`
    <div class="row"><span class="pill ${a.dueDate<today?'clay':a.dueDate===today?'amber':''}">${niceDate(a.dueDate)}</span>
    <div class="row-main"><div class="row-title">${esc(a.title)}</div><div class="row-sub">${subjName(a.subjectId)} · ${a.type}</div></div></div>`).join('')}</div>`}</div>
  `;
}
function academicsSubjects(){
  const sems = DB.semesters;
  return `
  <div class="formcard">
    <div class="field-row">
      <div class="field" style="flex:2"><label>Subject name</label><input type="text" id="ns-name" placeholder="e.g. Organic Chemistry II"></div>
      <div class="field"><label>Code</label><input type="text" id="ns-code" placeholder="CHEM 202"></div>
      <div class="field"><label>Credits</label><input type="number" id="ns-credits" placeholder="4" style="width:80px"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Professor</label><input type="text" id="ns-prof" placeholder="optional"></div>
      <div class="field"><label>Semester</label><select id="ns-sem"><option value="">Unassigned</option>${sems.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="add-subject-btn">Add subject</button></div>
  </div>
  <div class="grid grid-3">${DB.subjects.length===0?`<div class="card">${emptyState('ic-cap','No subjects yet.')}</div>`:
  DB.subjects.map(s=>`<div class="card"><div class="card-title"><h3><span class="dot" style="background:${s.color};margin-right:7px"></span>${esc(s.name)}</h3>
    <button class="iconbtn" data-act="del-subject" data-id="${s.id}"><svg><use href="#ic-trash"/></svg></button></div>
    <p class="muted" style="font-size:12.5px;margin:0">${s.code||''}${s.credits?' · '+s.credits+' credits':''}</p>
    ${s.professor?`<p class="dim" style="font-size:12.5px;margin:6px 0 0">${esc(s.professor)}</p>`:''}</div>`).join('')}</div>
  `;
}
function academicsWork(){
  const items = DB.assignments.slice().sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  return `
  <div class="formcard">
    <div class="field-row">
      <div class="field" style="flex:2"><label>Title</label><input type="text" id="na-title" placeholder="e.g. Lab report 3"></div>
      <div class="field"><label>Type</label><select id="na-type"><option value="assignment">Assignment</option><option value="lab">Lab</option><option value="exam">Exam</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Subject</label><select id="na-subject"><option value="">—</option>${DB.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Due date</label><input type="date" id="na-date" value="${todayStr()}"></div>
      <div class="field"><label>Weight %</label><input type="number" id="na-weight" placeholder="optional"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="add-assignment-btn">Add</button></div>
  </div>
  <div class="card">${items.length===0?emptyState('ic-check2','No assignments, labs, or exams yet.'):`<div class="rowlist">${items.map(a=>`
    <div class="row"><span class="pill ${a.type==='exam'?'clay':a.type==='lab'?'amber':''}">${a.type}</span>
    <div class="row-main"><div class="row-title ${a.status==='submitted'||a.status==='graded'?'done':''}">${esc(a.title)}</div>
    <div class="row-sub">${subjName(a.subjectId)} · due ${niceDate(a.dueDate)}${a.weight?' · '+a.weight+'%':''}${a.grade?' · grade '+esc(a.grade):''}</div></div>
    <select data-act="assign-set-status" data-id="${a.id}" style="background:var(--bg-soft);border:1px solid var(--border-hi);border-radius:8px;padding:5px 8px;font-size:12px">
      <option ${a.status==='upcoming'?'selected':''}>upcoming</option><option ${a.status==='submitted'?'selected':''}>submitted</option><option ${a.status==='graded'?'selected':''}>graded</option>
    </select>
    <button class="iconbtn" data-act="del-assignment" data-id="${a.id}"><svg><use href="#ic-trash"/></svg></button></div>`).join('')}</div>`}</div>
  `;
}
function academicsSchedule(){
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `
  <div class="formcard">
    <div class="field-row">
      <div class="field"><label>Subject</label><select id="nsc-subject">${DB.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Day</label><select id="nsc-day">${dayNames.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></div>
      <div class="field"><label>Start</label><input type="time" id="nsc-start" value="09:00"></div>
      <div class="field"><label>End</label><input type="time" id="nsc-end" value="10:00"></div>
      <div class="field"><label>Location</label><input type="text" id="nsc-loc" placeholder="Room / building"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="add-schedule-btn">Add class</button></div>
  </div>
  <div class="week-grid">${dayNames.map((d,i)=>`<div><div class="week-col-head">${d}</div>
    ${DB.schedule.filter(b=>b.day===i).sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(b=>`
      <div class="sched-block"><div>${esc(subjName(b.subjectId))}</div><div class="t">${b.startTime}–${b.endTime}${b.location?' · '+esc(b.location):''}</div>
      <button class="iconbtn" style="padding:2px;margin-top:2px" data-act="del-schedule" data-id="${b.id}"><svg style="width:11px;height:11px"><use href="#ic-trash"/></svg></button></div>`).join('') || '<p class="muted" style="font-size:11.5px">—</p>'}
    </div>`).join('')}</div>
  `;
}
function academicsSemesters(){
  return `
  <div class="formcard">
    <div class="field-row">
      <div class="field" style="flex:2"><label>Semester name</label><input type="text" id="nsem-name" placeholder="e.g. Fall 2026"></div>
      <div class="field"><label>Start</label><input type="date" id="nsem-start"></div>
      <div class="field"><label>End</label><input type="date" id="nsem-end"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="add-semester-btn">Add semester</button></div>
  </div>
  <div class="card">${DB.semesters.length===0?emptyState('ic-cap','No semesters set up yet.'):`<div class="rowlist">${DB.semesters.map(s=>`
    <div class="row"><div class="check check-round ${s.active?'on':''}" data-act="set-active-semester" data-id="${s.id}">${s.active?'<svg><use href="#ic-check2"/></svg>':''}</div>
    <div class="row-main"><div class="row-title">${esc(s.name)}</div><div class="row-sub">${s.startDate||''} → ${s.endDate||''}</div></div>
    <button class="iconbtn" data-act="del-semester" data-id="${s.id}"><svg><use href="#ic-trash"/></svg></button></div>`).join('')}</div>`}</div>
  <p class="muted" style="font-size:12px;margin-top:8px">Tap the circle to mark a semester active.</p>
  `;
}

/* ================= FINANCE ================= */
function renderFinance(){
  const cur = DB.settings.currency||'$';
  const cats = DB.categories.expense;
  const today = todayStr();
  const monthStart = today.slice(0,7);
  const monthItems = DB.expenses.filter(e=>e.date.startsWith(monthStart));
  const spent = monthItems.filter(e=>e.type==='expense').reduce((a,e)=>a+e.amount,0);
  const income = monthItems.filter(e=>e.type==='income').reduce((a,e)=>a+e.amount,0);
  const byCat = {};
  monthItems.filter(e=>e.type==='expense').forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+e.amount; });
  const maxCat = Math.max(1,...Object.values(byCat));
  const recent = DB.expenses.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,25);

  return `
  <div class="grid grid-3" style="margin-bottom:20px">
    <div class="card"><div class="card-title"><h3>Spent this month</h3></div><div style="font-family:var(--serif);font-size:26px">${cur}${spent.toFixed(2)}</div></div>
    <div class="card"><div class="card-title"><h3>Income this month</h3></div><div style="font-family:var(--serif);font-size:26px">${cur}${income.toFixed(2)}</div></div>
    <div class="card"><div class="card-title"><h3>Net</h3></div><div style="font-family:var(--serif);font-size:26px">${cur}${(income-spent).toFixed(2)}</div></div>
  </div>

  <div class="formcard">
    <div class="field-row">
      <div class="field"><label>Type</label><select id="ne-type"><option value="expense">Expense</option><option value="income">Income</option></select></div>
      <div class="field"><label>Amount</label><input type="number" id="ne-amount" placeholder="12.50"></div>
      <div class="field"><label>Category</label><select id="ne-cat">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
      <div class="field"><label>Date</label><input type="date" id="ne-date" value="${today}"></div>
    </div>
    <div class="field"><label>Note</label><input type="text" id="ne-note" placeholder="optional"></div>
    <div class="form-actions"><button class="btn btn-primary" id="add-expense-btn">Add entry</button></div>
  </div>

  <div class="section-head" style="margin-top:0"><h2>By category this month</h2></div>
  <div class="card">${Object.keys(byCat).length===0?emptyState('ic-wallet','No spending logged yet this month.'):
    Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`
    <div class="bar-row"><span class="lbl">${esc(c)}</span><div class="track"><i style="width:${(v/maxCat*100)}%"></i></div><span class="val">${cur}${v.toFixed(0)}</span></div>`).join('')}</div>

  <div class="section-head"><h2>Recent activity</h2></div>
  <div class="card">${recent.length===0?emptyState('ic-wallet','Nothing logged yet.'):`<div class="rowlist">${recent.map(e=>`
    <div class="row"><span class="pill ${e.type==='income'?'':'clay'}">${e.type}</span>
    <div class="row-main"><div class="row-title">${esc(e.category)}${e.note?' — '+esc(e.note):''}</div><div class="row-sub">${niceDate(e.date)}</div></div>
    <div style="font-weight:600">${cur}${e.amount.toFixed(2)}</div>
    <button class="iconbtn" data-act="del-expense" data-id="${e.id}"><svg><use href="#ic-trash"/></svg></button></div>`).join('')}</div>`}</div>
  `;
}

/* ================= LIFE CENTER ================= */
function renderLife(){
  const areas = DB.categories.lifeArea;
  return `
  <div class="formcard">
    <div class="field-row">
      <div class="field" style="flex:2"><label>Item</label><input type="text" id="nl-title" placeholder="e.g. Book dentist appointment"></div>
      <div class="field"><label>Area</label><select id="nl-area">${areas.map(a=>`<option>${esc(a)}</option>`).join('')}</select></div>
      <div class="field"><label>Due</label><input type="date" id="nl-date"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="add-life-btn">Add</button></div>
  </div>
  <div class="grid grid-3">${areas.map(area=>{
    const items = DB.lifeItems.filter(i=>i.area===area);
    return `<div class="card"><div class="card-title"><h3>${esc(area)}</h3><span class="tag">${items.filter(i=>!i.done).length} open</span></div>
    ${items.length===0?`<p class="muted" style="font-size:12.5px">Nothing here yet.</p>`:`<div class="rowlist">${items.map(i=>`
      <div class="row"><div class="check ${i.done?'on':''}" data-act="toggle-life" data-id="${i.id}">${i.done?'<svg><use href="#ic-check2"/></svg>':''}</div>
      <div class="row-main"><div class="row-title ${i.done?'done':''}">${esc(i.title)}</div>${i.dueDate?`<div class="row-sub">${niceDate(i.dueDate)}</div>`:''}</div>
      <button class="iconbtn" data-act="del-life" data-id="${i.id}"><svg><use href="#ic-trash"/></svg></button></div>`).join('')}</div>`}
    </div>`;
  }).join('')}</div>
  `;
}

/* ================= CALENDAR ================= */
let calState = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: todayStr() };
function renderCalendar(){
  const {y,m,sel} = calState;
  const first = new Date(y,m,1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const prevDays = new Date(y,m,0).getDate();
  const cells = [];
  for(let i=0;i<startDow;i++) cells.push({d: prevDays-startDow+1+i, other:true, y, m:m-1});
  for(let d=1;d<=daysInMonth;d++) cells.push({d, other:false, y, m});
  while(cells.length%7!==0 || cells.length<42) cells.push({d: cells.length-startDow-daysInMonth+1, other:true, y, m:m+1});

  function dateStrFor(c){ const dt = new Date(c.y, c.m, c.d); return fmt(dt); }
  const today = todayStr();

  const dayEvents = ds => ({
    tasks: DB.tasks.filter(t=>t.dueDate===ds),
    assigns: DB.assignments.filter(a=>a.dueDate===ds),
    journal: DB.journalEntries.find(j=>j.date===ds && j.content),
    study: DB.studySessions.filter(s=>s.date===ds)
  });

  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const grid = cells.map(c=>{
    const ds = dateStrFor(c);
    const ev = dayEvents(ds);
    const dots = [];
    if(ev.tasks.length) dots.push(`<span class="dot" style="background:var(--sage)"></span>`);
    if(ev.assigns.length) dots.push(`<span class="dot" style="background:var(--clay)"></span>`);
    if(ev.study.length) dots.push(`<span class="dot" style="background:var(--amber)"></span>`);
    if(ev.journal) dots.push(`<span class="dot" style="background:var(--forest)"></span>`);
    return `<div class="cal-cell ${c.other?'other':''} ${ds===today?'today':''} ${ds===sel?'sel':''}" data-date="${ds}">
      <div class="cal-num">${c.d}</div><div class="cal-dots">${dots.join('')}</div></div>`;
  }).join('');

  const selEv = dayEvents(sel);
  return `
  <div class="card" style="margin-bottom:18px">
    <div class="card-title">
      <h3>${monthLabel(y,m)}</h3>
      <div style="display:flex;gap:6px">
        <button class="iconbtn" id="cal-prev"><svg><use href="#ic-x"/></svg>◀</button>
        <button class="btn btn-ghost" id="cal-today">Today</button>
        <button class="iconbtn" id="cal-next">▶</button>
      </div>
    </div>
    <div class="cal-grid">${dow.map(d=>`<div class="cal-dow">${d}</div>`).join('')}${grid}</div>
  </div>
  <div class="card">
    <div class="card-title"><h3>${niceDateLong(sel)}</h3></div>
    ${(selEv.tasks.length+selEv.assigns.length+selEv.study.length===0 && !selEv.journal) ? emptyState('ic-cal','Nothing scheduled for this day.') : `
    <div class="rowlist">
      ${selEv.assigns.map(a=>`<div class="row"><span class="pill clay">${a.type}</span><div class="row-main"><div class="row-title">${esc(a.title)}</div><div class="row-sub">${subjName(a.subjectId)}</div></div></div>`).join('')}
      ${selEv.tasks.map(t=>`<div class="row"><span class="pill">task</span><div class="row-main"><div class="row-title ${t.done?'done':''}">${esc(t.title)}</div></div></div>`).join('')}
      ${selEv.study.map(s=>`<div class="row"><span class="pill amber">study</span><div class="row-main"><div class="row-title">${subjName(s.subjectId)||'General'} · ${minutesToLabel(s.duration)}</div></div></div>`).join('')}
      ${selEv.journal?`<div class="row"><span class="pill" style="background:rgba(74,122,90,0.18);color:var(--sage)">journal</span><div class="row-main"><div class="row-title">Entry written</div></div></div>`:''}
    </div>`}
  </div>
  `;
}

/* ================= STATS ================= */
function renderStats(){
  const today = todayStr();
  const weekAgo = addDays(today,-6);
  const monthAgo = addDays(today,-29);
  const cur = DB.settings.currency||'$';

  function summaryFor(sinceDate){
    const tasksDone = DB.tasks.filter(t=>t.done).length; // lifetime; fine for a light touch
    const habitsWeek = DB.habitLogs.filter(l=>l.date>=sinceDate);
    const habitsDue = habitsWeek.length;
    const habitsDone = habitsWeek.filter(l=>l.done).length;
    const studyMins = DB.studySessions.filter(s=>s.date>=sinceDate).reduce((a,s)=>a+s.duration,0);
    const spent = DB.expenses.filter(e=>e.date>=sinceDate && e.type==='expense').reduce((a,e)=>a+e.amount,0);
    return {habitsDue, habitsDone, studyMins, spent};
  }
  const w = summaryFor(weekAgo), mo = summaryFor(monthAgo);

  const habitRates = DB.habits.map(h=>{
    const logs = DB.habitLogs.filter(l=>l.habitId===h.id && l.date>=monthAgo);
    const rate = logs.length ? Math.round(100*logs.filter(l=>l.done).length/logs.length) : 0;
    return {name:h.name, rate};
  }).sort((a,b)=>b.rate-a.rate);

  const subjMins = {};
  DB.studySessions.filter(s=>s.date>=monthAgo).forEach(s=>{ const n = subjName(s.subjectId)||'General'; subjMins[n]=(subjMins[n]||0)+s.duration; });
  const maxSubj = Math.max(1,...Object.values(subjMins));

  const catSpend = {};
  DB.expenses.filter(e=>e.date>=monthAgo && e.type==='expense').forEach(e=>{ catSpend[e.category]=(catSpend[e.category]||0)+e.amount; });
  const maxCat = Math.max(1,...Object.values(catSpend));

  return `
  <div class="grid grid-2" style="margin-bottom:20px">
    <div class="card">
      <div class="card-title"><h3>Last 7 days</h3></div>
      <div class="bar-row"><span class="lbl">Habit rate</span><div class="track"><i style="width:${w.habitsDue?Math.round(100*w.habitsDone/w.habitsDue):0}%"></i></div><span class="val">${w.habitsDue?Math.round(100*w.habitsDone/w.habitsDue):0}%</span></div>
      <div class="bar-row"><span class="lbl">Study time</span><div class="track"><i style="width:${Math.min(100,w.studyMins/10)}%"></i></div><span class="val">${minutesToLabel(w.studyMins)}</span></div>
      <div class="bar-row"><span class="lbl">Spent</span><div class="track"><i style="width:${Math.min(100,w.spent/2)}%"></i></div><span class="val">${cur}${w.spent.toFixed(0)}</span></div>
    </div>
    <div class="card">
      <div class="card-title"><h3>Last 30 days</h3></div>
      <div class="bar-row"><span class="lbl">Habit rate</span><div class="track"><i style="width:${mo.habitsDue?Math.round(100*mo.habitsDone/mo.habitsDue):0}%"></i></div><span class="val">${mo.habitsDue?Math.round(100*mo.habitsDone/mo.habitsDue):0}%</span></div>
      <div class="bar-row"><span class="lbl">Study time</span><div class="track"><i style="width:${Math.min(100,mo.studyMins/40)}%"></i></div><span class="val">${minutesToLabel(mo.studyMins)}</span></div>
      <div class="bar-row"><span class="lbl">Spent</span><div class="track"><i style="width:${Math.min(100,mo.spent/8)}%"></i></div><span class="val">${cur}${mo.spent.toFixed(0)}</span></div>
    </div>
  </div>

  <div class="grid grid-2">
    <div class="card"><div class="card-title"><h3>Habit consistency (30d)</h3></div>
      ${habitRates.length===0?emptyState('ic-sprout','No habit data yet.'):habitRates.map(h=>`
      <div class="bar-row"><span class="lbl">${esc(h.name)}</span><div class="track"><i style="width:${h.rate}%"></i></div><span class="val">${h.rate}%</span></div>`).join('')}
    </div>
    <div class="card"><div class="card-title"><h3>Study minutes by subject (30d)</h3></div>
      ${Object.keys(subjMins).length===0?emptyState('ic-clock','No study data yet.'):Object.entries(subjMins).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`
      <div class="bar-row"><span class="lbl">${esc(n)}</span><div class="track"><i style="width:${(v/maxSubj*100)}%"></i></div><span class="val">${minutesToLabel(v)}</span></div>`).join('')}
    </div>
  </div>
  <div class="section-head"><h2>Spending by category (30d)</h2></div>
  <div class="card">${Object.keys(catSpend).length===0?emptyState('ic-wallet','No spending data yet.'):Object.entries(catSpend).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`
    <div class="bar-row"><span class="lbl">${esc(c)}</span><div class="track"><i style="width:${(v/maxCat*100)}%"></i></div><span class="val">${cur}${v.toFixed(0)}</span></div>`).join('')}</div>
  `;
}

/* ================= SETTINGS ================= */
function renderSettings(){
  const s = DB.settings;
  function catEditor(key,label){
    return `<div class="card" style="margin-bottom:14px">
      <div class="card-title"><h3>${label}</h3></div>
      <div class="chiprow" style="margin-bottom:10px">${DB.categories[key].map(c=>`
        <span class="chip on" style="display:inline-flex;align-items:center;gap:6px">${esc(c)}
        <button data-act="del-cat" data-key="${key}" data-val="${esc(c)}" style="background:none;border:none;color:inherit;cursor:pointer;padding:0;line-height:1">×</button></span>`).join('')}</div>
      <div style="display:flex;gap:8px"><input type="text" id="newcat-${key}" placeholder="Add category…" style="flex:1;background:var(--bg-soft);border:1px solid var(--border-hi);border-radius:8px;padding:7px 10px;color:var(--cream)">
      <button class="btn" data-act="add-cat" data-key="${key}">Add</button></div>
    </div>`;
  }
  return `
  <div class="card" style="margin-bottom:20px">
    <div class="card-title"><h3>Profile</h3></div>
    <div class="field-row">
      <div class="field"><label>Name for greeting</label><input type="text" id="set-name" value="${esc(s.name||'')}"></div>
      <div class="field"><label>Currency symbol</label><input type="text" id="set-currency" value="${esc(s.currency||'$')}" style="width:80px"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="save-settings-btn">Save</button></div>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div class="card-title"><h3>Journal prompts</h3></div>
    <div class="rowlist">${DB.journalPrompts.map((p,i)=>`<div class="row"><div class="row-main">${esc(p)}</div>
      <button class="iconbtn" data-act="del-prompt" data-idx="${i}"><svg><use href="#ic-trash"/></svg></button></div>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:10px"><input type="text" id="new-prompt" placeholder="Add a prompt…" style="flex:1;background:var(--bg-soft);border:1px solid var(--border-hi);border-radius:8px;padding:7px 10px;color:var(--cream)">
    <button class="btn" id="add-prompt-btn">Add</button></div>
    <p class="muted" style="font-size:12px;margin-top:8px">Prompts rotate automatically — a new one is picked for you each day.</p>
  </div>

  ${catEditor('task','Task categories')}
  ${catEditor('expense','Expense categories')}
  ${catEditor('lifeArea','Life Center areas')}
  ${catEditor('studyMethod','Study methods')}

  <div class="card">
    <div class="card-title"><h3>Backup</h3></div>
    <p class="muted" style="font-size:12.5px;margin:0 0 12px">Export everything as a file, or restore from a previous export.</p>
    <div style="display:flex;gap:8px">
      <button class="btn" id="export-btn">Export data</button>
      <button class="btn" id="import-btn">Import data</button>
      <input type="file" id="import-file" accept=".json" style="display:none">
    </div>
  </div>
  `;
}
