/* Grove — Step 1 extraction. Relocated as-is from the original single-file artifact.
   No logic changed in this step; persistence still uses window.storage (Claude artifact API)
   pending Step 2 (IndexedDB migration). */

/* ================= STORAGE ================= */
const KEYS = ['meta','tasks','habits','habitLogs','subjects','semesters','assignments','schedule',
  'studySessions','activeTimer','journalPrompts','journalEntries','expenses','lifeItems','categories','settings'];

const DEFAULTS = {
  meta: { lastOpenDate: null },
  tasks: [], habits: [], habitLogs: [], subjects: [], semesters: [], assignments: [], schedule: [],
  studySessions: [], activeTimer: null, journalEntries: [], expenses: [], lifeItems: [],
  journalPrompts: [
    "What's one thing you're grateful for today?",
    "What's the biggest challenge this week, and one small step forward?",
    "Describe your energy today in a few words — what's driving it?",
    "What did you learn today, in class or otherwise?",
    "What would make today feel like a win?",
    "Who or what supported you today?",
    "What's one thing you'd do differently if you could redo today?",
    "What are you looking forward to this week?"
  ],
  categories: {
    task: ["Academic","Personal","Errands","Health","Social"],
    expense: ["Food","Transport","Rent","Subscriptions","Fun","Supplies","Health","Other"],
    lifeArea: ["Health","Relationships","Finance","Growth","Home"],
    studyMethod: ["Pomodoro","Deep Work","Active Recall","Reading","Practice Problems","Group Study"]
  },
  settings: { name: "there", currency: "$" }
};

let DB = {};

async function loadAll(){
  const results = await Promise.all(KEYS.map(async k => {
    try{
      const r = await window.storage.get(k, false);
      return r ? JSON.parse(r.value) : JSON.parse(JSON.stringify(DEFAULTS[k]));
    }catch(e){ return JSON.parse(JSON.stringify(DEFAULTS[k])); }
  }));
  KEYS.forEach((k,i)=> DB[k] = results[i]);
  if(!DB.categories) DB.categories = JSON.parse(JSON.stringify(DEFAULTS.categories));
  if(!DB.settings) DB.settings = JSON.parse(JSON.stringify(DEFAULTS.settings));
  if(!DB.journalPrompts || !DB.journalPrompts.length) DB.journalPrompts = DEFAULTS.journalPrompts.slice();
}
async function save(key){
  try{ await window.storage.set(key, JSON.stringify(DB[key]), false); }catch(e){ console.error('save failed', key, e); }
}
