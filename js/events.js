/* Grove — Step 1 extraction. Relocated as-is from the original single-file artifact.
   No logic changed in this step; persistence still uses window.storage (Claude artifact API)
   pending Step 2 (IndexedDB migration). */

/* ================= QUICK ADD MODAL ================= */
function openModal(html){ document.getElementById('modal-body').innerHTML = html; document.getElementById('modal-root').classList.add('show'); }
function closeModal(){ document.getElementById('modal-root').classList.remove('show'); }
document.getElementById('modal-overlay').addEventListener('click', closeModal);

function quickAddModal(){
  const cats = DB.categories.task;
  openModal(`
    <div class="modal-head"><h3>Quick add</h3><button class="iconbtn" id="qa-close"><svg><use href="#ic-x"/></svg></button></div>
    <div class="chiprow" id="qa-type" style="margin-bottom:16px">
      <button class="chip on" data-val="task">Task</button>
      <button class="chip" data-val="expense">Expense</button>
      <button class="chip" data-val="life">Life item</button>
      <button class="chip" data-val="journal">Journal note</button>
    </div>
    <div id="qa-body"></div>
  `);
  document.getElementById('qa-close').addEventListener('click', closeModal);
  const body = document.getElementById('qa-body');
  function renderQaBody(type){
    if(type==='task'){
      body.innerHTML = `<div class="field"><label>Task</label><input type="text" id="qa-title" placeholder="What needs doing?"></div>
        <div class="field-row"><div class="field"><label>Due</label><input type="date" id="qa-date" value="${todayStr()}"></div>
        <div class="field"><label>Category</label><select id="qa-cat">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div></div>
        <div class="form-actions"><button class="btn btn-primary" id="qa-save">Add task</button></div>`;
      document.getElementById('qa-save').onclick = async ()=>{
        const title = document.getElementById('qa-title').value.trim(); if(!title) return;
        DB.tasks.push({id:uid(), title, dueDate:document.getElementById('qa-date').value, category:document.getElementById('qa-cat').value, priority:'Normal', done:false, createdAt:Date.now()});
        await save('tasks'); closeModal(); route();
      };
    } else if(type==='expense'){
      const ecats = DB.categories.expense;
      body.innerHTML = `<div class="field-row"><div class="field"><label>Amount</label><input type="number" id="qa-amount" placeholder="8.50"></div>
        <div class="field"><label>Category</label><select id="qa-ecat">${ecats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div></div>
        <div class="field"><label>Note</label><input type="text" id="qa-note" placeholder="optional"></div>
        <div class="form-actions"><button class="btn btn-primary" id="qa-save">Add expense</button></div>`;
      document.getElementById('qa-save').onclick = async ()=>{
        const amt = parseFloat(document.getElementById('qa-amount').value); if(!amt) return;
        DB.expenses.push({id:uid(), date:todayStr(), amount:amt, category:document.getElementById('qa-ecat').value, note:document.getElementById('qa-note').value, type:'expense'});
        await save('expenses'); closeModal(); route();
      };
    } else if(type==='life'){
      const areas = DB.categories.lifeArea;
      body.innerHTML = `<div class="field"><label>Item</label><input type="text" id="qa-title" placeholder="e.g. Call mom"></div>
        <div class="field"><label>Area</label><select id="qa-area">${areas.map(a=>`<option>${esc(a)}</option>`).join('')}</select></div>
        <div class="form-actions"><button class="btn btn-primary" id="qa-save">Add</button></div>`;
      document.getElementById('qa-save').onclick = async ()=>{
        const title = document.getElementById('qa-title').value.trim(); if(!title) return;
        DB.lifeItems.push({id:uid(), title, area:document.getElementById('qa-area').value, done:false, dueDate:null, notes:''});
        await save('lifeItems'); closeModal(); route();
      };
    } else if(type==='journal'){
      const entry = ensureJournalEntry(todayStr());
      body.innerHTML = `<div class="field"><label>Add to today's page</label><textarea id="qa-jtext" placeholder="Quick thought…"></textarea></div>
        <div class="form-actions"><button class="btn btn-primary" id="qa-save">Save</button></div>`;
      document.getElementById('qa-save').onclick = async ()=>{
        const t = document.getElementById('qa-jtext').value.trim(); if(!t) return;
        entry.content = entry.content ? entry.content+'\\n\\n'+t : t;
        await save('journalEntries'); closeModal(); route();
      };
    }
  }
  renderQaBody('task');
  document.getElementById('qa-type').addEventListener('click', e=>{
    const c = e.target.closest('.chip'); if(!c) return;
    document.querySelectorAll('#qa-type .chip').forEach(x=>x.classList.remove('on')); c.classList.add('on');
    renderQaBody(c.dataset.val);
  });
}
document.getElementById('quick-add-btn').addEventListener('click', quickAddModal);

/* ================= SEARCH ================= */
document.getElementById('global-search').addEventListener('input', e=>{
  const q = e.target.value.trim().toLowerCase();
  if(!q){ if(location.hash.startsWith('#search')) go('dashboard'); return; }
  renderSearchResults(q);
});
function renderSearchResults(q){
  const results = [];
  DB.tasks.forEach(t=>{ if(t.title.toLowerCase().includes(q)) results.push({type:'Task', label:t.title, sub:t.category}); });
  DB.assignments.forEach(a=>{ if(a.title.toLowerCase().includes(q)) results.push({type:'Assignment', label:a.title, sub:subjName(a.subjectId)}); });
  DB.subjects.forEach(s=>{ if(s.name.toLowerCase().includes(q)) results.push({type:'Subject', label:s.name, sub:s.code}); });
  DB.journalEntries.forEach(j=>{ if(j.content && j.content.toLowerCase().includes(q)) results.push({type:'Journal', label:niceDate(j.date), sub:j.content.slice(0,60)}); });
  DB.expenses.forEach(e=>{ if((e.note||'').toLowerCase().includes(q) || e.category.toLowerCase().includes(q)) results.push({type:'Expense', label:e.category, sub:e.note}); });
  DB.lifeItems.forEach(i=>{ if(i.title.toLowerCase().includes(q)) results.push({type:'Life', label:i.title, sub:i.area}); });

  document.getElementById('pagetitle').textContent = 'Search';
  renderNav('');
  document.getElementById('view').innerHTML = `
    <div class="section-head" style="margin-top:0"><h2>Results for "${esc(q)}"</h2></div>
    <div class="card">${results.length===0?emptyState('ic-search','Nothing found.'):`<div class="rowlist">${results.map(r=>`
      <div class="row"><span class="pill">${r.type}</span><div class="row-main"><div class="row-title">${esc(r.label)}</div><div class="row-sub">${esc(r.sub||'')}</div></div></div>`).join('')}</div>`}</div>
  `;
}

/* ================= EVENT WIRING ================= */
function wireView(view){
  const v = document.getElementById('view');

  v.onclick = async (e)=>{
    const t = e.target.closest('[data-act]'); if(!t) return;
    const act = t.dataset.act;

    if(act==='goto') go(t.dataset.view);

    else if(act==='toggle-task'){ const task = DB.tasks.find(x=>x.id===t.dataset.id); task.done=!task.done; await save('tasks'); route(); }
    else if(act==='del-task'){ DB.tasks = DB.tasks.filter(x=>x.id!==t.dataset.id); await save('tasks'); route(); }

    else if(act==='toggle-habit'){ const log = ensureHabitLog(t.dataset.id, t.dataset.date); log.done=!log.done; await save('habitLogs'); route(); }
    else if(act==='del-habit'){ DB.habits = DB.habits.filter(x=>x.id!==t.dataset.id); DB.habitLogs = DB.habitLogs.filter(x=>x.habitId!==t.dataset.id); await save('habits'); await save('habitLogs'); route(); }

    else if(act==='del-session'){ DB.studySessions = DB.studySessions.filter(x=>x.id!==t.dataset.id); await save('studySessions'); route(); }

    else if(act==='toggle-life'){ const item = DB.lifeItems.find(x=>x.id===t.dataset.id); item.done=!item.done; await save('lifeItems'); route(); }
    else if(act==='del-life'){ DB.lifeItems = DB.lifeItems.filter(x=>x.id!==t.dataset.id); await save('lifeItems'); route(); }

    else if(act==='del-subject'){ DB.subjects = DB.subjects.filter(x=>x.id!==t.dataset.id); await save('subjects'); route(); }
    else if(act==='del-assignment'){ DB.assignments = DB.assignments.filter(x=>x.id!==t.dataset.id); await save('assignments'); route(); }
    else if(act==='del-schedule'){ DB.schedule = DB.schedule.filter(x=>x.id!==t.dataset.id); await save('schedule'); route(); }
    else if(act==='del-semester'){ DB.semesters = DB.semesters.filter(x=>x.id!==t.dataset.id); await save('semesters'); route(); }
    else if(act==='set-active-semester'){ DB.semesters.forEach(s=>s.active=(s.id===t.dataset.id)); await save('semesters'); route(); }
    else if(act==='assign-status' || act==='assign-set-status'){ /* handled via change for select; checkbox variant below */
      if(act==='assign-status'){ const a = DB.assignments.find(x=>x.id===t.dataset.id); a.status = a.status==='submitted'?'upcoming':'submitted'; await save('assignments'); route(); }
    }

    else if(act==='del-expense'){ DB.expenses = DB.expenses.filter(x=>x.id!==t.dataset.id); await save('expenses'); route(); }

    else if(act==='del-prompt'){ DB.journalPrompts.splice(Number(t.dataset.idx),1); await save('journalPrompts'); route(); }
    else if(act==='del-cat'){ const key=t.dataset.key; DB.categories[key] = DB.categories[key].filter(c=>c!==t.dataset.val); await save('categories'); route(); }
    else if(act==='add-cat'){ const key=t.dataset.key; const input=document.getElementById('newcat-'+key); const val=input.value.trim(); if(val && !DB.categories[key].includes(val)){ DB.categories[key].push(val); await save('categories'); route(); } }
  };

  v.onchange = async (e)=>{
    const t = e.target.closest('[data-act]'); if(!t) return;
    if(t.dataset.act==='assign-set-status'){ const a = DB.assignments.find(x=>x.id===t.dataset.id); a.status = t.value; await save('assignments'); route(); }
  };

  /* -------- per-view specific wiring -------- */
  if(view==='tasks'){
    document.getElementById('add-task-btn').onclick = async ()=>{
      const title = document.getElementById('nt-title').value.trim(); if(!title) return;
      DB.tasks.push({id:uid(), title, dueDate:document.getElementById('nt-date').value, category:document.getElementById('nt-cat').value, priority:document.getElementById('nt-pri').value, done:false, createdAt:Date.now()});
      await save('tasks'); route();
    };
  }
  if(view==='habits'){
    let freq='daily', days=[];
    document.getElementById('nh-freq').addEventListener('click', e=>{
      const c = e.target.closest('.chip'); if(!c) return;
      document.querySelectorAll('#nh-freq .chip').forEach(x=>x.classList.remove('on')); c.classList.add('on'); freq=c.dataset.val;
      document.getElementById('nh-days-wrap').style.display = freq==='custom' ? 'block' : 'none';
    });
    document.getElementById('nh-days').addEventListener('click', e=>{
      const c = e.target.closest('.chip'); if(!c) return; c.classList.toggle('on');
      days = [...document.querySelectorAll('#nh-days .chip.on')].map(x=>Number(x.dataset.val));
    });
    document.getElementById('add-habit-btn').onclick = async ()=>{
      const name = document.getElementById('nh-name').value.trim(); if(!name) return;
      const habit = {id:uid(), name, category:document.getElementById('nh-cat').value, frequency:freq, days: days.slice(), active:true, createdAt:Date.now()};
      DB.habits.push(habit);
      if(habitDueOn(habit,new Date())) ensureHabitLog(habit.id, todayStr());
      await save('habits'); await save('habitLogs'); route();
    };
  }
  if(view==='study'){
    if(timerInterval){ clearInterval(timerInterval); timerInterval=null; }
    if(DB.activeTimer){
      timerInterval = setInterval(()=>{ const d = document.getElementById('timer-display'); if(d) d.textContent = elapsedLabel(DB.activeTimer.startedAt); }, 1000);
    }
    const startBtn = document.getElementById('timer-start');
    if(startBtn) startBtn.onclick = async ()=>{
      DB.activeTimer = {startedAt: Date.now(), subjectId: document.getElementById('timer-subject').value, method: document.getElementById('timer-method').value};
      await save('activeTimer'); route();
    };
    const stopBtn = document.getElementById('timer-stop');
    if(stopBtn) stopBtn.onclick = async ()=>{
      const rt = DB.activeTimer;
      const mins = Math.max(1, Math.round((Date.now()-rt.startedAt)/60000));
      DB.studySessions.push({id:uid(), date:todayStr(), subjectId: rt.subjectId, duration: mins, method: rt.method, notes:''});
      DB.activeTimer = null;
      await save('studySessions'); await save('activeTimer'); route();
    };
    document.getElementById('log-session-btn').onclick = async ()=>{
      const mins = parseInt(document.getElementById('ls-mins').value); if(!mins) return;
      DB.studySessions.push({id:uid(), date:document.getElementById('ls-date').value, subjectId:document.getElementById('ls-subject').value, duration:mins, method:document.getElementById('ls-method').value, notes:document.getElementById('ls-notes').value});
      await save('studySessions'); route();
    };
  }
  if(view==='journal'){
    document.getElementById('save-journal-btn').onclick = async ()=>{
      const entry = ensureJournalEntry(todayStr());
      entry.content = document.getElementById('journal-today').value;
      await save('journalEntries'); route();
    };
  }
  if(view==='finance'){
    document.getElementById('add-expense-btn').onclick = async ()=>{
      const amt = parseFloat(document.getElementById('ne-amount').value); if(!amt) return;
      DB.expenses.push({id:uid(), type:document.getElementById('ne-type').value, amount:amt, category:document.getElementById('ne-cat').value, date:document.getElementById('ne-date').value, note:document.getElementById('ne-note').value});
      await save('expenses'); route();
    };
  }
  if(view==='life'){
    document.getElementById('add-life-btn').onclick = async ()=>{
      const title = document.getElementById('nl-title').value.trim(); if(!title) return;
      DB.lifeItems.push({id:uid(), title, area:document.getElementById('nl-area').value, dueDate:document.getElementById('nl-date').value||null, done:false, notes:''});
      await save('lifeItems'); route();
    };
  }
  if(view==='calendar'){
    v.querySelectorAll('.cal-cell').forEach(c=> c.addEventListener('click', ()=>{ calState.sel = c.dataset.date; route(); }));
    const prev = document.getElementById('cal-prev'); if(prev) prev.onclick = ()=>{ calState.m--; if(calState.m<0){calState.m=11;calState.y--;} route(); };
    const next = document.getElementById('cal-next'); if(next) next.onclick = ()=>{ calState.m++; if(calState.m>11){calState.m=0;calState.y++;} route(); };
    const tb = document.getElementById('cal-today'); if(tb) tb.onclick = ()=>{ const d=new Date(); calState={y:d.getFullYear(),m:d.getMonth(),sel:todayStr()}; route(); };
  }
  if(view==='academics'){
    const sub = (location.hash.split('/')[1]) || 'overview';
    if(sub==='subjects'){
      document.getElementById('add-subject-btn').onclick = async ()=>{
        const name = document.getElementById('ns-name').value.trim(); if(!name) return;
        DB.subjects.push({id:uid(), name, code:document.getElementById('ns-code').value, credits:document.getElementById('ns-credits').value,
          professor:document.getElementById('ns-prof').value, semesterId:document.getElementById('ns-sem').value||null, color: PALETTE[DB.subjects.length%PALETTE.length]});
        await save('subjects'); route();
      };
    }
    if(sub==='work'){
      document.getElementById('add-assignment-btn').onclick = async ()=>{
        const title = document.getElementById('na-title').value.trim(); if(!title) return;
        DB.assignments.push({id:uid(), title, type:document.getElementById('na-type').value, subjectId:document.getElementById('na-subject').value||null,
          dueDate:document.getElementById('na-date').value, weight:document.getElementById('na-weight').value, status:'upcoming', grade:''});
        await save('assignments'); route();
      };
    }
    if(sub==='schedule'){
      document.getElementById('add-schedule-btn').onclick = async ()=>{
        DB.schedule.push({id:uid(), subjectId:document.getElementById('nsc-subject').value, day:Number(document.getElementById('nsc-day').value),
          startTime:document.getElementById('nsc-start').value, endTime:document.getElementById('nsc-end').value, location:document.getElementById('nsc-loc').value});
        await save('schedule'); route();
      };
    }
    if(sub==='semesters'){
      document.getElementById('add-semester-btn').onclick = async ()=>{
        const name = document.getElementById('nsem-name').value.trim(); if(!name) return;
        const makeActive = DB.semesters.length===0;
        DB.semesters.push({id:uid(), name, startDate:document.getElementById('nsem-start').value, endDate:document.getElementById('nsem-end').value, active:makeActive});
        await save('semesters'); route();
      };
    }
  }
  if(view==='settings'){
    document.getElementById('save-settings-btn').onclick = async ()=>{
      DB.settings.name = document.getElementById('set-name').value.trim() || 'there';
      DB.settings.currency = document.getElementById('set-currency').value.trim() || '$';
      await save('settings'); route();
    };
    document.getElementById('add-prompt-btn').onclick = async ()=>{
      const val = document.getElementById('new-prompt').value.trim(); if(!val) return;
      DB.journalPrompts.push(val); await save('journalPrompts'); route();
    };
    document.getElementById('export-btn').onclick = ()=>{
      const blob = new Blob([JSON.stringify(DB,null,2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'grove-backup-'+todayStr()+'.json'; a.click();
    };
    document.getElementById('import-btn').onclick = ()=> document.getElementById('import-file').click();
    document.getElementById('import-file').onchange = async (e)=>{
      const file = e.target.files[0]; if(!file) return;
      const text = await file.text();
      try{
        const data = JSON.parse(text);
        for(const k of KEYS){ if(data[k]!==undefined){ DB[k]=data[k]; await save(k); } }
        route();
      }catch(err){ alert('Could not read that file.'); }
    };
  }
}
