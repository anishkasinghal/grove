/* Grove — Step 1 extraction. Relocated as-is from the original single-file artifact.
   No logic changed in this step; persistence still uses window.storage (Claude artifact API)
   pending Step 2 (IndexedDB migration). */

/* ================= DAILY ROLLOVER ================= */
function habitDueOn(habit, date){
  const dow = date.getDay();
  if(habit.frequency==='daily') return true;
  if(habit.frequency==='weekdays') return dow>=1 && dow<=5;
  if(habit.frequency==='custom') return (habit.days||[]).includes(dow);
  return true;
}
function ensureHabitLog(habitId, dateStr){
  let log = DB.habitLogs.find(l=>l.habitId===habitId && l.date===dateStr);
  if(!log){ log = {id:uid(), habitId, date:dateStr, done:false, count:0}; DB.habitLogs.push(log); }
  return log;
}
function pickPromptForDate(dateStr){
  const epoch = Math.floor(parseDate(dateStr).getTime()/86400000);
  const list = DB.journalPrompts.length ? DB.journalPrompts : DEFAULTS.journalPrompts;
  return list[epoch % list.length];
}
function ensureJournalEntry(dateStr){
  let e = DB.journalEntries.find(j=>j.date===dateStr);
  if(!e){ e = {id:uid(), date:dateStr, prompt: pickPromptForDate(dateStr), content:'', mood:null}; DB.journalEntries.push(e); }
  return e;
}
async function dailyRollover(){
  const today = todayStr();
  DB.habits.filter(h=>h.active).forEach(h=>{ if(habitDueOn(h, new Date())) ensureHabitLog(h.id, today); });
  ensureJournalEntry(today);
  if(DB.meta.lastOpenDate !== today){
    DB.meta.lastOpenDate = today;
    await save('meta');
  }
  await save('habitLogs'); await save('journalEntries');
}
